<?php
declare(strict_types=1);

/**
 * Halloween event at /hallowing: a witch, a "fingerprint" you hold for a few seconds, then a prize wheel.
 * Everything visible is editable at /hallowing/config, stored as one JSON row in zero_settings.
 * Admin access: config('halloween') holds the admin email and a password_hash(), never the password.
 */

const HW_UPLOAD_DIR = '/assets/uploads';

function hw_defaults(): array
{
    return [
        'title' => 'Noche de brujas ZERO',
        'subtitle' => 'Deja tu huella en el sensor mágico y la bruja girará la ruleta por ti.',
        'sensor_title' => 'Sensor de huella',
        'sensor_hint' => 'Mantén presionado el sensor',
        'sensor_done' => 'Huella aceptada',
        'result_title' => 'La bruja te dio',
        'replay_label' => 'Girar otra vez',
        'footer' => 'Una sorpresa de ZERO Solutions',
        'bg_from' => '#2a0a4a',
        'bg_to' => '#0d0221',
        'bg_image' => '',
        'accent' => '#c084fc',
        'text' => '#f5ecff',
        'robe' => '#7c3aed',
        'hat' => '#4c1d95',
        'skin' => '#a7e3a1',
        'potion_1' => '#f472b6',
        'potion_2' => '#4ade80',
        'potion_3' => '#fb923c',
        'hold_seconds' => 5,
        'spin_seconds' => 8,
        'spin_speed' => 2.5,
        'allow_replay' => true,
        'sound' => true,
        'bats' => true,
        'stars' => true,
        'items' => [
            ['label' => '10% de descuento', 'color' => '#7c3aed', 'weight' => 3],
            ['label' => 'Dulce sorpresa', 'color' => '#f97316', 'weight' => 3],
            ['label' => 'Un mes de FlowDesk Pro', 'color' => '#a855f7', 'weight' => 1],
            ['label' => 'Sigue intentando', 'color' => '#1e1b4b', 'weight' => 4],
            ['label' => 'Asesoría gratis', 'color' => '#db2777', 'weight' => 2],
            ['label' => 'Calabaza de la suerte', 'color' => '#ea580c', 'weight' => 3],
        ],
    ];
}

/** Text fields and their max length. */
const HW_TEXTS = [
    'title' => 80, 'subtitle' => 200, 'sensor_title' => 40, 'sensor_hint' => 80, 'sensor_done' => 40,
    'result_title' => 60, 'replay_label' => 30, 'footer' => 120,
];
const HW_COLORS = ['bg_from', 'bg_to', 'accent', 'text', 'robe', 'hat', 'skin', 'potion_1', 'potion_2', 'potion_3'];
const HW_FLAGS = ['allow_replay', 'sound', 'bats', 'stars'];
/** Numbers: [min, max]. */
const HW_NUMBERS = ['hold_seconds' => [1, 15], 'spin_seconds' => [2, 30], 'spin_speed' => [0.5, 6]];

function hw_settings(): array
{
    $saved = q("SELECT v FROM zero_settings WHERE k = 'halloween'")->fetchColumn();
    $data = $saved ? json_decode((string) $saved, true) : null;
    return is_array($data) ? array_replace(hw_defaults(), $data) : hw_defaults();
}

function hw_save(array $settings): void
{
    q(
        'INSERT INTO zero_settings (k, v, updated_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v), updated_at = VALUES(updated_at)',
        ['halloween', json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), now_utc()],
    );
}

function hw_color(mixed $value, string $fallback): string
{
    $value = strtolower(trim((string) $value));
    return preg_match('/^#[0-9a-f]{6}$/', $value) ? $value : $fallback;
}

/** Validates the config form; returns [settings, errors]. Bad values fall back to the current ones. */
function hw_from_form(array $in, array $current): array
{
    $errors = [];
    $out = $current;
    foreach (HW_TEXTS as $key => $max) {
        $value = trim(preg_replace('/\s+/u', ' ', (string) ($in[$key] ?? '')));
        if ($value === '' && $key !== 'footer') {
            $errors[] = 'Hay textos vacíos: se mantuvo el valor anterior.';
            continue;
        }
        $out[$key] = mb_substr($value, 0, $max);
    }
    foreach (HW_COLORS as $key) {
        $out[$key] = hw_color($in[$key] ?? '', $current[$key]);
    }
    foreach (HW_FLAGS as $key) {
        $out[$key] = !empty($in[$key]);
    }
    foreach (HW_NUMBERS as $key => [$min, $max]) {
        $value = (float) str_replace(',', '.', (string) ($in[$key] ?? $current[$key]));
        $out[$key] = round(min($max, max($min, $value)), 1);
    }

    $items = [];
    $labels = (array) ($in['item_label'] ?? []);
    foreach ($labels as $i => $label) {
        $label = mb_substr(trim(preg_replace('/\s+/u', ' ', (string) $label)), 0, 40);
        if ($label === '') {
            continue;
        }
        $items[] = [
            'label' => $label,
            'color' => hw_color($in['item_color'][$i] ?? '', '#7c3aed'),
            'weight' => (int) min(100, max(1, (int) ($in['item_weight'][$i] ?? 1))),
        ];
    }
    if (count($items) < 2) {
        $errors[] = 'La ruleta necesita al menos 2 premios: se mantuvieron los anteriores.';
    } elseif (count($items) > 24) {
        $errors[] = 'La ruleta admite hasta 24 premios: se guardaron los primeros 24.';
        $out['items'] = array_slice($items, 0, 24);
    } else {
        $out['items'] = $items;
    }
    return [$out, array_values(array_unique($errors))];
}

/** Stores an uploaded background (JPG, PNG or WebP, up to 5 MB) and returns its public path. */
function hw_store_background(array $file): string
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
        throw new RuntimeException('No pudimos recibir la imagen. Inténtalo de nuevo.');
    }
    if ($file['size'] > 5 * 1024 * 1024) {
        throw new RuntimeException('La imagen pesa más de 5 MB.');
    }
    $types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];
    $info = @getimagesize($file['tmp_name']);
    $ext = $info ? ($types[$info[2]] ?? null) : null;
    if (!$ext) {
        throw new RuntimeException('El fondo debe ser una imagen JPG, PNG o WebP.');
    }
    $dir = dirname(APP_DIR) . HW_UPLOAD_DIR;
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        throw new RuntimeException('No pudimos guardar la imagen en el servidor.');
    }
    $name = 'halloween-' . bin2hex(random_bytes(6)) . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], "{$dir}/{$name}")) {
        throw new RuntimeException('No pudimos guardar la imagen en el servidor.');
    }
    chmod("{$dir}/{$name}", 0644);
    return HW_UPLOAD_DIR . '/' . $name;
}

function hw_delete_background(string $path): void
{
    if (preg_match('#^' . preg_quote(HW_UPLOAD_DIR, '#') . '/halloween-[0-9a-f]{12}\.(jpg|png|webp)$#', $path)) {
        @unlink(dirname(APP_DIR) . $path);
    }
}

// ---- Admin access ------------------------------------------------------------------

function hw_admin_config(): array
{
    $c = config('halloween', []);
    return [
        'email' => normalize_email((string) ($c['admin_email'] ?? '')),
        'hash' => (string) ($c['admin_password_hash'] ?? ''),
    ];
}

/** The session stays valid only while the configured password is the same one used to sign in. */
function hw_is_admin(): bool
{
    start_session();
    $admin = hw_admin_config();
    return $admin['hash'] !== '' && hash_equals(hash('sha256', $admin['hash']), (string) ($_SESSION['hw_admin'] ?? ''));
}

function hw_login(string $email, string $password): ?string
{
    $admin = hw_admin_config();
    if ($admin['email'] === '' || $admin['hash'] === '') {
        return 'El acceso al panel no está configurado en el servidor.';
    }
    if (too_many('hw-login:' . client_ip(), 10, 900)) {
        return 'Demasiados intentos. Espera 15 minutos.';
    }
    $ok = password_verify($password, $admin['hash']);
    if (!$ok || !hash_equals($admin['email'], normalize_email($email))) {
        return 'Correo o contraseña incorrectos.';
    }
    start_session();
    session_regenerate_id(true);
    $_SESSION['hw_admin'] = hash('sha256', $admin['hash']);
    return null;
}

function hw_logout(): void
{
    start_session();
    unset($_SESSION['hw_admin']);
    session_regenerate_id(true);
}
