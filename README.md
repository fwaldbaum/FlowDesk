<p align="center"><img src="docs/flowdesk-logo.jpg" alt="FlowDesk" width="520" /></p>

# FlowDesk

CRM ligero tipo Kanban para que emprendedores y equipos pequeños gestionen sus leads entrantes:
tablero con drag & drop, ficha lateral con notas y recordatorios, y un webhook que inserta
leads en tiempo real (Socket.io) sin refrescar la página. Incluye página de inicio pública e inicio de sesión
con cuentas para el equipo.

![Inicio](docs/screenshots/landing.png)

![Tablero](docs/screenshots/tablero.png)

| Ficha del lead | Contactos |
| --- | --- |
| ![Detalle](docs/screenshots/detalle-lead.png) | ![Contactos](docs/screenshots/contactos.png) |

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS, `@dnd-kit`, Lucide Icons |
| Backend | Node.js 20+, Express 5, Socket.io, Zod |
| Base de datos | PostgreSQL 14+ (local, Supabase, Neon o Replit Postgres) |

```
FlowDesk/
├── server/src
│   ├── index.js          # Express + Socket.io; sirve el frontend compilado en producción
│   ├── schema.sql        # Esquema idempotente (se aplica en cada arranque)
│   ├── services/leads.js # Lógica de leads/notas + emisión de eventos en tiempo real
│   ├── services/auth.js  # Contraseñas (scrypt), sesiones y rate limiting
│   ├── routes/           # /api/auth, /api/users, /api/leads, /api/notes, /api/webhooks
│   └── seed.js           # Datos de demostración
└── client/src
    ├── store/AppStore.tsx   # Estado global + suscripción al socket
    ├── auth/                # Sesión del usuario y rutas protegidas
    ├── views/               # Inicio, Login/Registro, Tablero, Contactos, Configuración
    └── components/          # Sidebar, Header, Slide-over, Modal, Toasts
```

## Puesta en marcha

Requisitos: Node.js 20.12+ y una base PostgreSQL.

```bash
cp .env.example .env              # ajusta DATABASE_URL
docker compose up -d              # opcional: Postgres local en :5432
npm install
npm run db:seed                   # opcional: 9 leads de ejemplo (borra los datos existentes)
npm run dev                       # API en :3001, frontend en http://localhost:5173
```

Abre `http://localhost:5173`, pulsa **Crear mi espacio** y registra la cuenta propietaria. El tablero vive en `/app`.

El esquema se crea automáticamente al iniciar el servidor (`npm run db:migrate` lo aplica a mano).

**Producción** (un único proceso sirve API, WebSocket y frontend):

```bash
npm run build && npm start        # http://localhost:3001
```

**Supabase / Neon / Replit**: usa la cadena de conexión del proveedor en `DATABASE_URL`. Si no incluye
`sslmode=require`, define `PGSSL=true`. En Replit, el archivo `.replit` ya trae los comandos de build y run.

### Variables de entorno

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `PGSSL` | `true` para forzar TLS |
| `PORT` | Puerto del servidor (por defecto `3001`) |
| `WEBHOOK_SECRET` | Si se define, el webhook exige la cabecera `X-Webhook-Secret` (o `?secret=`) |
| `CORS_ORIGIN` | Orígenes permitidos para Socket.io, separados por coma |
| `NODE_ENV` | `production` marca la cookie de sesión como `Secure` |
| `TRUST_PROXY` | Proxies de confianza para `X-Forwarded-*` (por defecto, solo redes privadas) |

## Páginas y acceso

| Ruta | Contenido |
| --- | --- |
| `/` | Página de inicio: qué es FlowDesk, para quién es y cómo funciona |
| `/login` | Inicio de sesión |
| `/registro` | Alta de la cuenta propietaria (solo mientras no exista ningún usuario) |
| `/app`, `/app/contactos`, `/app/configuracion` | La aplicación; requiere sesión |

- El **primer usuario** que se registra es el propietario. Después el registro público se cierra y el propietario
  crea las cuentas del equipo en **Configuración → Equipo**, para que nadie externo pueda registrarse y ver los leads.
- Contraseñas con `scrypt`; sesión en cookie `httpOnly` + `SameSite=Lax` de 30 días. En la base solo se guarda el hash
  SHA-256 del token.
- Inicio de sesión limitado a 8 intentos por email y 40 por IP cada 15 minutos.
- Cambiar la contraseña cierra la sesión en los demás dispositivos; quitar a un miembro lo desconecta al instante.
- Toda la API y el WebSocket exigen sesión, excepto `POST /api/webhooks/lead` (protegido con `WEBHOOK_SECRET`).

## Webhook de leads

```bash
curl -X POST http://localhost:3001/api/webhooks/lead \
  -H "Content-Type: application/json" \
  -d '{"name":"María González","email":"maria@empresa.com","phone":"+56 9 1234 5678","source":"Formulario web","notes":"Solicita una demo"}'
```

- `name` es obligatorio; `email`, `phone`, `source`, `notes` son opcionales (también acepta `company` y `value`).
- Acepta `application/json` y `application/x-www-form-urlencoded`.
- Respuestas: `201 { ok, lead }`, `401` secreto inválido, `422` con el detalle de validación.
- El lead entra al tope de **Nuevo Lead**, `notes` se guarda como primera nota y todos los tableros
  abiertos lo reciben al instante. Cada solicitud queda registrada en **Configuración → Actividad del webhook**,
  donde también hay un botón para enviar un lead de prueba.

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/auth/status` | `{ setupRequired }` — si falta crear la cuenta propietaria |
| `POST` | `/api/auth/register` · `/api/auth/login` · `/api/auth/logout` | Alta del propietario, inicio y cierre de sesión |
| `GET` | `/api/auth/me` | Usuario actual (`null` si no hay sesión) |
| `POST` | `/api/auth/password` | `{ current, next }` — cambiar contraseña |
| `GET` / `POST` / `DELETE` | `/api/users[/:id]` | Equipo (crear y quitar: solo propietario) |
| `GET` | `/api/leads` | Todos los leads (con `pending_reminders`) |
| `POST` | `/api/leads` | Crear lead |
| `PATCH` | `/api/leads/:id` | Editar campos (`name`, `email`, `phone`, `company`, `source`, `value`, `last_contact_at`) |
| `POST` | `/api/leads/:id/move` | `{ status, beforeId }` — cambia de etapa y posición |
| `DELETE` | `/api/leads/:id` | Eliminar lead |
| `GET` / `POST` | `/api/leads/:id/notes` | Historial / nueva nota o recordatorio (`{ kind, body, dueAt }`) |
| `PATCH` / `DELETE` | `/api/notes/:id` | Marcar recordatorio (`{ done }`) / eliminar |
| `GET` | `/api/webhooks/events` | Últimas 25 solicitudes del webhook |

Eventos Socket.io emitidos: `lead:created`, `lead:updated`, `lead:deleted`, `leads:reordered`,
`note:created`, `note:updated`, `note:deleted`.

## Atajos de teclado

| Tecla | Acción |
| --- | --- |
| `/` o `Ctrl/⌘ K` | Buscar |
| `N` | Nuevo lead |
| `Esc` | Cerrar panel o modal |
| `Ctrl/⌘ Enter` | Guardar nota |
| `Enter` / `Espacio` sobre una tarjeta | Abrir ficha / mover con flechas |

## Notas

- Agregar una nota actualiza la fecha de **último contacto**; también se puede registrar con «Registrar hoy».
- Los cambios de etapa quedan en el historial del lead.
- Todo el equipo comparte un único espacio de trabajo (un tablero). En producción sirve la app detrás de HTTPS.
