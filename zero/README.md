# ZERO Solutions · zerosolutions.cl

Sitio de la empresa y **cuentas ZERO**: una sola cuenta para abrir todas las aplicaciones (hoy FlowDesk) sin
volver a escribir la contraseña. Está hecho en **PHP 8.1+ y MySQL**, sin dependencias externas, para que funcione
en el hosting compartido con cPanel.

```
zero/public_html/          <- todo esto va a public_html en cPanel
├── index.php              enrutador: páginas, cuentas y entrada a las apps
├── .htaccess              URLs limpias, HTTPS forzado y cabeceras de seguridad
├── assets/                CSS, JS e imágenes: logos en SVG (zero-mark, zero-word-dark/light),
│                          favicon, og.jpg (vista al compartir) y capturas de FlowDesk
└── app/                   código privado (bloqueado por .htaccess)
    ├── config.example.php plantilla de configuración -> copiar como config.php
    ├── bootstrap.php      base de datos (crea las tablas sola), sesión, CSRF, vistas
    ├── accounts.php       cuentas, tokens de correo y pases de inicio de sesión (SSO)
    ├── apps.php           catálogo de aplicaciones: agrega aquí los próximos productos
    ├── plans.php          planes y precios (FlowDesk Pro, FlowDesk Max, ZERO Plus)
    ├── flow.php           cliente de la API de Flow (flow.cl)
    ├── billing.php        compras, activación de planes y aviso a las apps
    ├── cron.php           tarea diaria: recordatorios de renovación
    ├── mail.php           correos (confirmación y recuperación de contraseña)
    └── views/             páginas
```

## Páginas

- `/` inicio, `/productos`, `/productos/flowdesk`, `/nosotros`
- `/registro`, `/entrar`, `/recuperar`, `/restablecer`, `/verificar`
- `/cuenta` (aplicaciones de la cuenta), `/cuenta/ajustes` (perfil, contraseña, cerrar sesiones)
- `/abrir/flowdesk`: entra a FlowDesk con la cuenta ZERO
- `/precios`, `/cuenta/plan` (planes, pago y comprobantes), `/pagos/flow/confirmacion` y `/pagos/flow/retorno` (los llama Flow)

## Instalar en cPanel

1. **PHP 8.1 o superior**: cPanel → *Administrador MultiPHP* → elige PHP 8.1, 8.2 o 8.3 para zerosolutions.cl.
2. **Base de datos**: cPanel → *Bases de datos MySQL*:
   - crea una base (por ejemplo `zero`; cPanel le agrega tu prefijo, queda como `micuenta_zero`);
   - crea un usuario con una contraseña segura;
   - agrégalo a la base con **TODOS LOS PRIVILEGIOS**.
   Las tablas se crean solas en la primera visita.
3. **Subir los archivos**: cPanel → *Administrador de archivos* → `public_html` → *Cargar* el ZIP del sitio →
   clic derecho → *Extraer*. Activa *Configuración → Mostrar archivos ocultos* para ver `.htaccess`.
4. **Configurar**: dentro de `public_html/app/`, copia `config.example.php` como `config.php` y completa:
   - `db`: nombre de la base, usuario y contraseña del paso 2;
   - `mail.from`: el remitente de los correos;
   - `sso_secret`: una clave larga, explicada en *Conectar con FlowDesk* más abajo.
5. **HTTPS**: cPanel → *SSL/TLS Status* → *Run AutoSSL*. El `.htaccess` ya redirige todo a `https://`.
6. **Correo**: cPanel → *Cuentas de correo* → crea `noreply@zerosolutions.cl` (remitente) y `hola@zerosolutions.cl` (contacto público).
   Luego, en *Email Deliverability*, repara SPF y DKIM si aparecen en rojo, para que los correos no lleguen a spam.

## FlowDesk en zerosolutions.cl/flowdesk

FlowDesk sigue corriendo en Vercel (el hosting no tiene Node), pero se abre en **zerosolutions.cl/flowdesk** (portada)
y **zerosolutions.cl/flowdesk/app** (panel). `app/flowdesk_proxy.php` reenvía cada visita a Vercel y devuelve la
respuesta como si viniera de zerosolutions.cl. En `config.php`:

```php
'apps' => ['flowdesk' => 'https://zerosolutions.cl/flowdesk'],
'flowdesk_upstream' => 'https://flowdesk-ten-ruby.vercel.app',
'sso_secret' => '...',   // obligatorio: la misma clave que ZERO_SSO_SECRET en Vercel
```

Sin `sso_secret` (y su igual en Vercel), FlowDesk vería a todos los visitantes con la IP del hosting y los límites de
intentos de login y registro se agotarían para todos a la vez.

En Vercel conviene además poner `APP_URL=https://zerosolutions.cl/flowdesk`, para que los correos que no pasan por el
proxy también enlacen ahí.

## Conectar con FlowDesk (inicio de sesión único)

ZERO firma un pase de un solo uso que vence en 2 minutos. FlowDesk lo verifica en `/api/auth/zero` y entra a la
cuenta con el mismo correo, o crea una nueva. Solo se emiten pases para correos ya confirmados.

1. Genera una clave secreta (64 caracteres), por ejemplo en https://www.random.org/strings o con
   `php -r "echo bin2hex(random_bytes(32));"`.
2. Pégala en `app/config.php` → `'sso_secret' => '...'`.
3. En Vercel → proyecto FlowDesk → *Settings → Environment Variables*, agrega `ZERO_SSO_SECRET` con **la misma
   clave** y vuelve a desplegar.
4. En `config.php`, `apps.flowdesk` debe ser `https://zerosolutions.cl/flowdesk`.

Sin `sso_secret`, el botón *Abrir FlowDesk* lleva al login normal de FlowDesk.

### Opcional: FlowDesk en flowdesk.zerosolutions.cl

1. En Vercel → *Settings → Domains*, agrega `flowdesk.zerosolutions.cl`.
2. En cPanel → *Zone Editor*, agrega un registro **CNAME** `flowdesk` → `cname.vercel-dns.com`.
3. Cambia `APP_URL` en Vercel y `apps.flowdesk` en `config.php` a `https://flowdesk.zerosolutions.cl`.

## Pagos con Flow

Cada compra es un periodo prepagado (mes o año) que se paga en Flow con tarjeta, transferencia u otros medios. Pagar
de nuevo extiende el plan; subir de plan convierte los días que quedaban en días extra del plan nuevo. No hay cobros
automáticos: 5 días antes del vencimiento llega un correo para renovar.

1. Crea la cuenta de comercio en [flow.cl](https://www.flow.cl) y, para probar, otra en
   [sandbox.flow.cl](https://sandbox.flow.cl).
2. En Flow → *Mi cuenta → Integraciones* (o *Datos de integración*) copia el **apiKey** y el **secretKey**.
3. En `app/config.php`:
   ```php
   'flow' => ['api_key' => '...', 'secret_key' => '...', 'sandbox' => true],
   ```
   Con `sandbox => true` los pagos son de prueba (usa las tarjetas de prueba que indica Flow). Cuando funcione, pon
   las claves del comercio real y `'sandbox' => false`.
4. cPanel → *Cron Jobs* → una vez al día (por ejemplo a las 10:00):
   `/usr/local/bin/php /home3/<cuenta>/public_html/app/cron.php`
5. Los precios y lo que incluye cada plan están en `app/plans.php` (CLP, IVA incluido).

Al confirmarse un pago, ZERO avisa a FlowDesk (`POST /api/zero/plan`, firmado con `sso_secret`) y el espacio de la
cuenta FlowDesk con el mismo correo pasa a Pro o Max hasta la fecha de término. Si FlowDesk no estaba disponible, el
plan llega igual la próxima vez que la persona abra FlowDesk desde ZERO.

## Desarrollo local

```bash
cp zero/public_html/app/config.example.php zero/public_html/app/config.php   # 'mail' => ['transport' => 'log']
php -S 127.0.0.1:8080 -t zero/public_html zero/public_html/index.php
```

Con `transport => 'log'` los correos se escriben en `app/storage/mail.log`.

## Agregar un producto nuevo

Agrega una entrada en `app/apps.php` (nombre, categoría, resumen, `url`) y su dirección en `config.php` → `apps`.
Aparecerá en el sitio y en el panel de cada cuenta. Para el inicio de sesión único, la app nueva debe verificar
los pases igual que FlowDesk (`verifyZeroTicket` en `server/src/services/auth.js`).
