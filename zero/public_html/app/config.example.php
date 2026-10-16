<?php
/**
 * Copy this file to app/config.php and fill it in (cPanel > Administrador de archivos).
 * config.php is ignored by git: it holds passwords.
 */
return [
    // Public address of the site, without a trailing slash.
    'app_url' => 'https://zerosolutions.cl',

    // cPanel > Bases de datos MySQL: create the database and user, and give the user ALL PRIVILEGES.
    // On cPanel both names carry your account prefix, e.g. "micuenta_zero".
    'db' => [
        'host' => 'localhost',
        'name' => 'micuenta_zero',
        'user' => 'micuenta_zero',
        'pass' => 'CAMBIA_ESTA_CLAVE',
    ],

    // Outgoing email. 'mail' uses the hosting's mail() (create the mailbox in cPanel > Cuentas de correo);
    // 'log' writes emails to app/storage/mail.log instead of sending them (local testing).
    'mail' => [
        'transport' => 'mail',
        'from' => 'ZERO Solutions <noreply@zerosolutions.cl>',
    ],

    'contact_email' => 'hola@zerosolutions.cl',

    // Single sign-on into the apps. The secret must be identical to ZERO_SSO_SECRET in the app's
    // server. Generate one with: php -r "echo bin2hex(random_bytes(32));"
    'sso_secret' => '',
    'apps' => [
        'flowdesk' => 'https://zerosolutions.cl/flowdesk',
    ],

    // Payments with Flow (flow.cl): Mi cuenta > Datos de integración shows the apiKey and secretKey.
    // Test first with 'sandbox' => true and the keys from sandbox.flow.cl, then switch to the real ones.
    'flow' => [
        'api_key' => '',
        'secret_key' => '',
        'sandbox' => true,
    ],

    // Panel of /hallowing/config. Generate the hash with: php -r "echo password_hash('LA_CLAVE', PASSWORD_DEFAULT);"
    'halloween' => [
        'admin_email' => '',
        'admin_password_hash' => '',
    ],

    // Where FlowDesk actually runs (Vercel). zerosolutions.cl/flowdesk forwards every request there.
    'flowdesk_upstream' => 'https://flowdesk-ten-ruby.vercel.app',
];
