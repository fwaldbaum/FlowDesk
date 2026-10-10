# FlowDesk: contexto para Claude

CRM ligero tipo Kanban para emprendedores y pymes (público hispanohablante, principalmente Chile).
Repo: `github.com/fwaldbaum/FlowDesk`, rama de trabajo `claude/flowdesk-crm` (es también la rama de producción en
Vercel). El dueño del proyecto escribe en español: **responde en español**. El código y los commits van en inglés;
**toda la UI va en español**.

## Stack

- **Monorepo npm workspaces**: `server/` (Node 20+, Express 5, ESM, `pg`, Zod, Socket.io, nodemailer) y `client/`
  (React 18 + TypeScript estricto, Vite 6, Tailwind 3, `@dnd-kit`, `lucide-react`, `motion`).
- **PostgreSQL** (Neon/Supabase en producción). Sin ORM: SQL parametrizado a mano.
- **Despliegue: Vercel Services** (`vercel.json`): servicio `client` (Vite, fallback SPA a `index.html`) y servicio
  `server` (preset Express, entrada `server/src/app.js` con `export default app`). `/api/*` llega al servidor con la
  ruta original.

## Comandos

```bash
npm install
npm run dev                      # API :3001 + Vite :5173 (proxy de /api y /socket.io)
npm run build                    # build del cliente (tsc -b && vite build)
npm start                        # servidor único: API + client/dist + Socket.io en :3001
npm run db:migrate               # aplica el esquema (también corre solo al arrancar / en la 1.ª petición)
npm run db:seed -- correo@x.cl   # 9 leads demo en el espacio de esa cuenta (reemplaza sus leads)
npm run admin:grant -- correo@x.cl
npx tsc -b client                # typecheck del cliente (hazlo siempre antes de commitear)
```

Para desarrollo local usa un `.env` en la raíz (ignorado por git), por ejemplo `EMAIL_TRANSPORT=console`, que
imprime los correos y sus enlaces en el log del servidor. No hay suite de tests en el repo: la verificación se hace
con `tsc`, el build y pruebas E2E manuales con Playwright (Chromium está en `/opt/pw-browsers` en los entornos
cloud de Claude).

## Arquitectura

### Servidor (`server/src`)
- `app.js`: app Express. El orden importa: `/api/health` (diagnóstico de BD sin secretos) → middleware que corre
  `migrate()` (memoizado) → rutas públicas (`authRouter`, `publicWebhooksRouter`, `publicFormsRouter`) →
  `requireAuth` → rutas protegidas. Sirve `client/dist` si existe (fuera de Vercel).
- `index.js`: servidor HTTP + Socket.io para despliegues tradicionales (no corre en Vercel).
- `db.js`: busca la cadena de conexión en `DATABASE_URL`, `POSTGRES_URL` y variables con prefijo de integraciones.
  Aplica `sslmode` con semántica libpq (lo quita de la URL porque `pg` trata `require` como `verify-full`).
  `explainDbError()` traduce errores a mensajes accionables. En Vercel nunca cae a localhost.
- `schema.js`: **esquema idempotente en un string JS** (no `.sql`: el bundler de Vercel no incluiría el archivo). Se
  aplica en una transacción con `pg_advisory_xact_lock`. Las migraciones son **aditivas** (`ADD COLUMN IF NOT EXISTS`,
  bloques `DO $$`) y se agregan al final por versión (v3, v4…). Nunca reescribas secciones anteriores.
- `services/leads.js`: lógica de leads y notas. **Toda función recibe el `workspace_id` primero** y filtra por él.
- `services/auth.js`: scrypt, sesiones (cookie `fd_session` httpOnly; en la BD solo el SHA-256 del token), tokens de
  correo de un solo uso, rate limiter en memoria, `publicUser()`.
- `services/email.js`: SMTP (`SMTP_HOST`…) > Resend (`RESEND_API_KEY`) > consola. Sin proveedor, `emailEnabled` es
  falso y **la verificación no se exige**.
- `realtime.js`: `broadcast(workspaceId, event, payload)`. En modo `socket` emite a la sala `workspace:<id>`; en modo
  `poll` (por defecto en Vercel) guarda el evento en la tabla `events` y los clientes consultan
  `/api/events?after=` cada 3 s. **Hay que hacer `await` de broadcast** (en serverless la instancia se congela al
  responder).
- `routes/`: `auth.js` (registro, login, verificación, olvido/restablecer, encuesta, equipo), `leads.js` (+ `/today`,
  `/leads/import`, `/leads/:id/contact`), `webhooks.js`, `workspace.js` (ajustes y formulario público `/api/forms/:key`),
  `admin.js` (panel de plataforma con auditoría), `events.js`.
- `validation.js`: todos los esquemas Zod, con mensajes en español.

### Cliente (`client/src`)
- `main.tsx`: rutas con **code splitting** (`lazy`). `/f/:key` (formulario embebible) va fuera de `AuthProvider` para
  que sea liviano.
- `auth/AuthContext.tsx`: sesión; `RequireAuth step=…` aplica las puertas en orden: verificar correo
  (`/verifica-tu-correo`) → encuesta (`/bienvenida`) → `/app`.
- `store/AppStore.tsx`: estado de leads y notas (reducer), transporte en tiempo real (Socket.io o sondeo; ambos usan el
  mismo `handle(type, payload)` idempotente), toasts, resumen de "Hoy" y ajustes del espacio.
- `views/`: `LandingPage`, `AuthPages` (login, registro, verificación, olvido, reset), `OnboardingPage`, `TodayView`,
  `BoardView` (Kanban con dnd-kit; mover = `POST /leads/:id/move {status, beforeId}`), `ContactsView`
  (importar/exportar CSV), `SettingsView` (formulario, WhatsApp, webhook, equipo, cuenta), `integrations/` (catálogo de 20 guías en `guides.tsx`: anuncios, mensajería, web,
  correo y avisos; cada guía con `source` muestra su estado leyendo el log del webhook), `AdminView` +
  `AdminUserPanel`, `PublicFormPage`.
- `components/motion.tsx`: presets de animación compartidos (`spring`, `panelMotion`, `dialogMotion`, `Reveal`,
  `CountUp`…). `MotionConfig reducedMotion="user"` está en `main.tsx`.
- `lib/`: `api.ts` (cliente fetch tipado, maneja 401), `types.ts`, `csv.ts` (parser e importación), `contact.ts`
  (número y plantilla de WhatsApp), `format.ts`, `constants.ts`.

## Modelo de datos y reglas de negocio

- **Multi-tenant**: `workspaces` 1—N `users` (`role` owner|member), `leads`, `webhook_events`, `events`. Cada registro
  crea su propio espacio. **Nunca devuelvas ni modifiques filas de otro espacio**: cualquier consulta nueva debe
  filtrar por `workspace_id` (las notas, a través de su lead).
- **Administrador de plataforma** (`users.is_admin`): la primera cuenta de la instalación y los correos de
  `ADMIN_EMAILS` (solo si el correo está verificado). Un admin no puede suspenderse, quitarse permisos ni eliminarse
  a sí mismo. Toda acción de admin se registra en `admin_actions`.
- Etapas: `new`, `contacted`, `proposal`, `won`, `lost` (etiquetas en `client/src/lib/constants.ts`). Las posiciones
  son enteros densos por columna; el servidor renumera la columna destino.
- El webhook se autentica con `workspaces.webhook_key` (`X-Webhook-Key` o `?key=`). El formulario usa una
  `form_key` distinta, con honeypot (`website`) y rate limit.
- Usuarios suspendidos (`banned_at`): sin sesión válida; el motivo se muestra solo tras una contraseña correcta.
- Encuesta (`survey_responses`): obligatoria para owners; los miembros invitados no la responden.

## Estilo y diseño (exigencias del dueño)

- Tema oscuro tipo Linear/Vercel: fondo `#0B0F17` (`canvas`), tarjetas `#161B26` (`surface`), bordes `#262D3D`
  (`line`), texto `#F3F4F6` (`fg`), acento índigo `#4F46E5` (`accent`). Tokens en `client/tailwind.config.js`.
- **Prohibido usar emojis en la UI**: solo iconos `lucide-react`. Nada de "AI slop": sin gradientes exagerados, sin
  texto de relleno ni métricas inventadas, y animaciones cortas y con propósito.
- Comentarios de código escasos y útiles; sigue el estilo existente (componentes funcionales, `clsx`, Tailwind).

## Variables de entorno

`DATABASE_URL` (o la que inyecte la integración), `ADMIN_EMAILS`, `APP_URL`, `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/
`SMTP_PASS` (Gmail con contraseña de aplicación es la opción gratuita), `RESEND_API_KEY`, `EMAIL_FROM`,
`EMAIL_TRANSPORT=console` (desarrollo), `REALTIME_MODE` (`socket`|`poll`), `NODE_ENV`, `TRUST_PROXY`, `PGSSL`.
Detalle en `.env.example` y `README.md`.

## Al hacer cambios

1. Lee el archivo antes de editarlo y respeta el aislamiento por `workspace_id`.
2. Cambios de esquema: agrega una sección nueva al final de `schema.js`, idempotente y que funcione sobre datos
   existentes.
3. Rutas nuevas: decide si son públicas (antes de `requireAuth` en `app.js`) o protegidas; valida con Zod; usa
   `await broadcast(ws, …)` si cambian datos que otros ven.
4. Verifica con `npx tsc -b client`, `npm run build` y, si tocas el flujo, una prueba real en navegador.
5. Commits en inglés y descriptivos; push a `claude/flowdesk-crm` (Vercel despliega solo).

## Pendientes conocidos / ideas

- El rate limiter es en memoria (en Vercel es por instancia).
- No hay tests automatizados en el repo.
- Ideas acordadas para el futuro: responsable por lead, etiquetas y campos personalizados, motivo de pérdida,
  reportes (embudo y rendimiento por origen), automatizaciones, integración con Meta Lead Ads o WhatsApp Business,
  planes de pago (Stripe o Mercado Pago), modo claro y PWA.
