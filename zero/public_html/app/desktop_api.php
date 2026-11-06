<?php
declare(strict_types=1);

/**
 * JSON API for the ZERO desktop app (Windows, macOS, Linux). It signs in with email and password and gets a
 * device token ("zd.<id>.<secret>", only the secret's SHA-256 is stored in zero_devices). Every other call sends
 * it as "Authorization: Bearer". No cookies or CSRF: the token is the credential.
 */

const DESKTOP_WEB_LINK_TTL = 120;

final class DesktopError extends RuntimeException
{
    public function __construct(public readonly int $status, string $message, public readonly string $codeName = '')
    {
        parent::__construct($message);
    }
}

function desktop_fail(int $status, string $message, string $code = ''): never
{
    throw new DesktopError($status, $message, $code);
}

function desktop_json(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function desktop_body(): array
{
    static $body = null;
    if ($body === null) {
        $body = json_decode(file_get_contents('php://input') ?: '', true);
        $body = is_array($body) ? $body : [];
    }
    return $body;
}

function desktop_iso(?string $utc): ?string
{
    return $utc ? str_replace(' ', 'T', $utc) . 'Z' : null;
}

function desktop_bearer(): string
{
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($h === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) {
            if (strcasecmp($k, 'Authorization') === 0) {
                $h = $v;
            }
        }
    }
    return preg_match('/^Bearer\s+(\S+)$/i', (string) $h, $m) ? $m[1] : '';
}

/** Resolves the device token to [user, device] or fails with 401. */
function desktop_auth(): array
{
    static $auth = null;
    if ($auth !== null) {
        return $auth;
    }
    if (!preg_match('/^zd\.(\d+)\.([A-Za-z0-9_-]{30,})$/', desktop_bearer(), $m)) {
        desktop_fail(401, 'Tu sesión terminó. Vuelve a iniciar sesión.', 'UNAUTHORIZED');
    }
    $device = q('SELECT * FROM zero_devices WHERE id = ? AND revoked_at IS NULL', [(int) $m[1]])->fetch();
    if (!$device || !hash_equals($device['token_hash'], hash('sha256', $m[2]))) {
        desktop_fail(401, 'Tu sesión terminó. Vuelve a iniciar sesión.', 'UNAUTHORIZED');
    }
    $user = q('SELECT * FROM zero_users WHERE id = ?', [$device['user_id']])->fetch();
    if (!$user) {
        desktop_fail(401, 'Tu sesión terminó. Vuelve a iniciar sesión.', 'UNAUTHORIZED');
    }
    if (!$device['last_seen_at'] || strtotime($device['last_seen_at'] . ' UTC') < time() - 60) {
        q('UPDATE zero_devices SET last_seen_at = ? WHERE id = ?', [now_utc(), $device['id']]);
    }
    return $auth = [$user, $device];
}

function desktop_user(array $user): array
{
    return [
        'id' => (int) $user['id'],
        'name' => $user['name'],
        'first_name' => first_name($user['name']),
        'initials' => initials($user['name']),
        'email' => $user['email'],
        'verified' => (bool) $user['email_verified_at'],
        'member_since' => desktop_iso($user['created_at']),
        'is_admin' => function_exists('is_admin') ? is_admin($user) : false,
    ];
}

function desktop_api(string $method, string $path): never
{
    try {
        desktop_route($method, $path);
    } catch (DesktopError $e) {
        desktop_json(['error' => $e->getMessage(), 'code' => $e->codeName], $e->status);
    } catch (Throwable $e) {
        error_log('[zero] desktop api: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
        desktop_json(['error' => 'Algo salió mal en el servidor. Inténtalo de nuevo.', 'code' => 'SERVER_ERROR'], 500);
    }
}

function desktop_route(string $method, string $path): never
{
    $sub = substr($path, strlen('/api/desktop')) ?: '/';
    switch ("{$method} {$sub}") {
        case 'GET /':
        case 'GET /status':
            desktop_json(['ok' => true, 'name' => 'ZERO', 'site' => rtrim(url('/'), '/')]);
        case 'POST /login':
            desktop_login();
        case 'POST /logout':
            [, $device] = desktop_auth();
            q('UPDATE zero_devices SET revoked_at = ? WHERE id = ?', [now_utc(), $device['id']]);
            desktop_json(['ok' => true]);
        case 'GET /me':
            [$user, $device] = desktop_auth();
            desktop_json(['user' => desktop_user($user), 'device' => ['id' => (int) $device['id'], 'name' => $device['name']]]);
        case 'POST /profile':
            desktop_profile();
        case 'POST /password':
            desktop_password();
        case 'POST /verify/resend':
            [$user] = desktop_auth();
            if ($user['email_verified_at']) {
                desktop_json(['ok' => true, 'already' => true]);
            }
            if (too_many('resend:' . $user['id'], 3, 3600)) {
                desktop_fail(429, 'Ya te enviamos varios correos. Espera un rato y revisa tu bandeja de spam.');
            }
            send_verification($user);
            desktop_json(['ok' => true]);
        case 'GET /devices':
            desktop_devices();
        case 'POST /devices/revoke-others':
            desktop_revoke_others();
        case 'GET /apps':
            desktop_apps();
        case 'GET /billing':
            desktop_billing();
        case 'POST /web-link':
            desktop_web_link();
    }
    if ($method === 'DELETE' && preg_match('#^/devices/(\d+)$#', $sub, $m)) {
        [$user, $current] = desktop_auth();
        $n = q('UPDATE zero_devices SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL', [now_utc(), (int) $m[1], $user['id']])->rowCount();
        if (!$n) {
            desktop_fail(404, 'No encontramos ese dispositivo.');
        }
        desktop_json(['ok' => true, 'current' => (int) $m[1] === (int) $current['id']]);
    }
    if ($method === 'POST' && preg_match('#^/open/([a-z0-9-]{1,40})$#', $sub, $m)) {
        desktop_open($m[1]);
    }
    desktop_fail(404, 'Ruta no encontrada.');
}

function desktop_login(): never
{
    $b = desktop_body();
    $email = normalize_email((string) ($b['email'] ?? ''));
    $password = (string) ($b['password'] ?? '');
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0';
    if (too_many('desktop-login-ip:' . $ip, 20, 900) || too_many('login:' . $email, 8, 900)) {
        desktop_fail(429, 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.');
    }
    $user = $email !== '' ? find_user_by_email($email) : null;
    if (!$user || !password_verify($password, $user['password_hash'])) {
        desktop_fail(401, 'El correo o la contraseña no coinciden.');
    }
    clear_attempts('login:' . $email);
    $name = mb_substr(trim(preg_replace('/\s+/u', ' ', (string) ($b['device_name'] ?? '')) ?? ''), 0, 80) ?: 'Computador';
    $platform = in_array($b['platform'] ?? '', ['win32', 'darwin', 'linux'], true) ? $b['platform'] : 'other';
    $secret = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    q('INSERT INTO zero_devices (user_id, name, platform, token_hash, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)',
        [$user['id'], $name, $platform, hash('sha256', $secret), now_utc(), now_utc()]);
    $id = (int) db()->lastInsertId();
    q('UPDATE zero_users SET last_login_at = ? WHERE id = ?', [now_utc(), $user['id']]);
    desktop_json(['token' => "zd.{$id}.{$secret}", 'user' => desktop_user($user)]);
}

function desktop_profile(): never
{
    [$user] = desktop_auth();
    $name = trim(preg_replace('/\s+/u', ' ', (string) (desktop_body()['name'] ?? '')) ?? '');
    if ($name === '' || mb_strlen($name) > 120) {
        desktop_fail(422, 'Escribe tu nombre (máximo 120 caracteres).');
    }
    q('UPDATE zero_users SET name = ? WHERE id = ?', [$name, $user['id']]);
    $user['name'] = $name;
    desktop_json(['user' => desktop_user($user)]);
}

function desktop_password(): never
{
    [$user, $device] = desktop_auth();
    $b = desktop_body();
    if (too_many('desktop-password:' . $user['id'], 8, 900)) {
        desktop_fail(429, 'Demasiados intentos. Espera unos minutos.');
    }
    if (!password_verify((string) ($b['current'] ?? ''), $user['password_hash'])) {
        desktop_fail(422, 'Tu contraseña actual no es correcta.');
    }
    $new = (string) ($b['password'] ?? '');
    if ($err = validate_password($new)) {
        desktop_fail(422, $err);
    }
    // Same effect as on the website: every other session (web and desktop) ends.
    q('UPDATE zero_users SET password_hash = ?, session_version = session_version + 1 WHERE id = ?', [password_hash($new, PASSWORD_DEFAULT), $user['id']]);
    $others = q('UPDATE zero_devices SET revoked_at = ? WHERE user_id = ? AND id <> ? AND revoked_at IS NULL', [now_utc(), $user['id'], $device['id']])->rowCount();
    desktop_json(['ok' => true, 'revoked_devices' => $others]);
}

function desktop_devices(): never
{
    [$user, $current] = desktop_auth();
    $rows = q('SELECT id, name, platform, created_at, last_seen_at FROM zero_devices WHERE user_id = ? AND revoked_at IS NULL ORDER BY last_seen_at DESC', [$user['id']])->fetchAll();
    desktop_json(['items' => array_map(fn ($d) => [
        'id' => (int) $d['id'],
        'name' => $d['name'],
        'platform' => $d['platform'],
        'created_at' => desktop_iso($d['created_at']),
        'last_seen_at' => desktop_iso($d['last_seen_at']),
        'current' => (int) $d['id'] === (int) $current['id'],
    ], $rows), 'last_web_login' => desktop_iso($user['last_login_at'])]);
}

/** Signs out everywhere else: other desktop devices and every browser session (session_version). */
function desktop_revoke_others(): never
{
    [$user, $device] = desktop_auth();
    q('UPDATE zero_users SET session_version = session_version + 1 WHERE id = ?', [$user['id']]);
    $n = q('UPDATE zero_devices SET revoked_at = ? WHERE user_id = ? AND id <> ? AND revoked_at IS NULL', [now_utc(), $user['id'], $device['id']])->rowCount();
    desktop_json(['ok' => true, 'revoked_devices' => $n]);
}

function desktop_apps(): never
{
    [$user] = desktop_auth();
    $access = app_access((int) $user['id']);
    $items = [];
    foreach (zero_apps() as $id => $app) {
        $tier = app_tier((int) $user['id'], $id);
        $items[] = [
            'id' => $id,
            'name' => $app['name'],
            'category' => $app['category'],
            'summary' => $app['summary'],
            'color' => $app['color'],
            'url' => rtrim((string) $app['url'], '/'),
            'origin' => desktop_origin((string) $app['url']),
            'page' => isset($app['page']) && str_starts_with((string) $app['page'], '/') ? url($app['page']) : $app['page'],
            'mark' => app_mark($id, 64),
            'tier' => $tier['tier'],
            'tier_ends_at' => desktop_iso($tier['ends_at']),
            'last_opened_at' => desktop_iso($access[$id]['last_opened_at'] ?? null),
        ];
    }
    desktop_json(['items' => $items, 'verified' => (bool) $user['email_verified_at']]);
}

function desktop_origin(string $url): string
{
    $p = parse_url($url);
    return ($p['scheme'] ?? 'https') . '://' . ($p['host'] ?? '') . (isset($p['port']) ? ':' . $p['port'] : '');
}

/** Single sign-on into an app: the desktop app loads this URL in the app's own window. */
function desktop_open(string $id): never
{
    [$user] = desktop_auth();
    $app = zero_app($id);
    if (!$app || empty($app['url'])) {
        desktop_fail(404, 'Esa aplicación no existe o todavía no está disponible.');
    }
    if (!$user['email_verified_at']) {
        desktop_fail(403, "Confirma tu correo para abrir {$app['name']}. Revisa tu bandeja de entrada.", 'EMAIL_UNVERIFIED');
    }
    $base = rtrim($app['url'], '/');
    if (!config('sso_secret')) {
        desktop_json(['url' => $base . ($app['login_path'] ?? '/login'), 'sso' => false]);
    }
    record_app_open((int) $user['id'], $id);
    desktop_json(['url' => $base . ($app['sso_path'] ?? '/api/auth/zero') . '?ticket=' . rawurlencode(sso_ticket($user, $id)), 'sso' => true]);
}

function desktop_billing(): never
{
    [$user] = desktop_auth();
    $subs = [];
    foreach (active_subscriptions((int) $user['id']) as $key => $sub) {
        $plan = zero_plan($key);
        $subs[] = [
            'plan' => $key,
            'name' => $plan['name'],
            'period' => $sub['period'],
            'ends_at' => desktop_iso($sub['ends_at']),
            'replaced_by' => $sub['replaced_by'],
        ];
    }
    $payments = array_map(fn ($p) => [
        'id' => $p['commerce_order'],
        'plan' => zero_plan($p['plan'])['name'] ?? $p['plan'],
        'period' => PLAN_PERIODS[$p['period']]['label'] ?? $p['period'],
        'amount' => (int) $p['amount'],
        'amount_label' => clp((int) $p['amount']),
        'status' => $p['status'],
        'date' => desktop_iso($p['paid_at'] ?: $p['created_at']),
    ], payment_history((int) $user['id']));
    $catalog = [];
    foreach (zero_plans() as $key => $plan) {
        $catalog[] = [
            'key' => $key,
            'app' => $plan['app'] ?? null,
            'name' => $plan['name'],
            'tagline' => $plan['tagline'] ?? '',
            'price_month' => (int) $plan['price']['month'],
            'price_month_label' => clp((int) $plan['price']['month']),
            'price_year_label' => clp((int) $plan['price']['year']),
            'list_month_label' => isset($plan['list_price']) ? clp((int) $plan['list_price']['month']) : null,
            'features' => array_values($plan['features'] ?? []),
            'featured' => !empty($plan['featured']),
            'covered' => covering_subscription((int) $user['id'], $key) !== null,
        ];
    }
    desktop_json(['subscriptions' => $subs, 'payments' => $payments, 'plans' => $catalog]);
}

/**
 * One-time link (2 minutes) that signs the browser into the website and lands on an internal page, so paying
 * with Mercado Pago happens on zerosolutions.cl with a normal web session.
 */
function desktop_web_link(): never
{
    [$user] = desktop_auth();
    if (too_many('desktop-weblink:' . $user['id'], 20, 600)) {
        desktop_fail(429, 'Demasiados intentos. Espera un momento.');
    }
    $next = safe_next((string) (desktop_body()['next'] ?? '/cuenta'));
    $token = create_token((int) $user['id'], 'desktop');
    desktop_json(['url' => url('/desktop/continuar?t=' . rawurlencode($token) . '&next=' . rawurlencode($next))]);
}

/** GET /desktop/continuar?t=&next=: consumes the one-time link from the desktop app and opens the page signed in. */
function desktop_continue_action(): void
{
    $userId = consume_token((string) ($_GET['t'] ?? ''), 'desktop');
    $next = safe_next((string) ($_GET['next'] ?? '/cuenta'));
    if (!$userId) {
        flash('error', 'Ese enlace ya se usó o venció. Ábrelo de nuevo desde la app ZERO.');
        redirect('/entrar?next=' . rawurlencode($next));
    }
    $user = q('SELECT * FROM zero_users WHERE id = ?', [$userId])->fetch();
    if (!$user) {
        redirect('/entrar');
    }
    login_user($user);
    redirect($next);
}
