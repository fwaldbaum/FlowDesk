<?php
declare(strict_types=1);

const TOKEN_TTL = ['verify' => 86400, 'reset' => 3600];

function normalize_email(string $email): string
{
    return mb_strtolower(trim($email));
}

function find_user_by_email(string $email): ?array
{
    return q('SELECT * FROM zero_users WHERE email = ?', [normalize_email($email)])->fetch() ?: null;
}

/** The signed-in account, or null. A changed session_version (password change, "sign out everywhere") ends old sessions. */
function current_user(): ?array
{
    static $user = false;
    if ($user !== false) {
        return $user;
    }
    start_session();
    $user = null;
    if (!empty($_SESSION['uid'])) {
        $row = q('SELECT * FROM zero_users WHERE id = ?', [$_SESSION['uid']])->fetch();
        if ($row && (int) $row['session_version'] === (int) ($_SESSION['sv'] ?? 0)) {
            $user = $row;
        } else {
            unset($_SESSION['uid'], $_SESSION['sv']);
        }
    }
    return $user;
}

function require_login(): array
{
    $user = current_user();
    if (!$user) {
        redirect('/entrar?next=' . rawurlencode($_SERVER['REQUEST_URI'] ?? '/cuenta'));
    }
    return $user;
}

function login_user(array $user): void
{
    start_session();
    session_regenerate_id(true);
    $_SESSION['uid'] = (int) $user['id'];
    $_SESSION['sv'] = (int) $user['session_version'];
    q('UPDATE zero_users SET last_login_at = ? WHERE id = ?', [now_utc(), $user['id']]);
}

function logout_user(): void
{
    start_session();
    $_SESSION = [];
    session_regenerate_id(true);
}

function first_name(string $name): string
{
    return explode(' ', trim($name))[0] ?: $name;
}

function initials(string $name): string
{
    $parts = preg_split('/\s+/', trim($name)) ?: [];
    $out = '';
    foreach (array_slice($parts, 0, 2) as $p) {
        $out .= mb_strtoupper(mb_substr($p, 0, 1));
    }
    return $out;
}

/** Returns an error message, or null when the password is acceptable. */
function validate_password(string $password): ?string
{
    if (mb_strlen($password) < 8) {
        return 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (mb_strlen($password) > 200) {
        return 'La contraseña es demasiado larga.';
    }
    return null;
}

// ---- Single-use email tokens (only their SHA-256 is stored) -------------------------

function create_token(int $userId, string $purpose): string
{
    q('UPDATE zero_tokens SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL', [now_utc(), $userId, $purpose]);
    $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    q(
        'INSERT INTO zero_tokens (user_id, purpose, token_hash, expires_at) VALUES (?, ?, ?, ?)',
        [$userId, $purpose, hash('sha256', $token), now_utc(TOKEN_TTL[$purpose])],
    );
    return $token;
}

/** Marks a valid token as used and returns its user id, or null. */
function consume_token(string $token, string $purpose): ?int
{
    if (strlen($token) < 20) {
        return null;
    }
    $row = q(
        'SELECT id, user_id FROM zero_tokens WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?',
        [hash('sha256', $token), $purpose, now_utc()],
    )->fetch();
    if (!$row) {
        return null;
    }
    $done = q('UPDATE zero_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL', [now_utc(), $row['id']]);
    return $done->rowCount() === 1 ? (int) $row['user_id'] : null;
}

function send_verification(array $user): void
{
    $link = url('/verificar?token=' . create_token((int) $user['id'], 'verify'));
    send_mail($user['email'], ...verify_email_message($user['name'], $link));
}

// ---- Single sign-on into ZERO apps ---------------------------------------------------

function b64url(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Short-lived ticket the app verifies with the shared secret: base64url(json).base64url(hmac).
 * It only travels for verified emails, so an app can safely link it to an existing account.
 */
function sso_ticket(array $user, string $app): string
{
    $payload = b64url(json_encode([
        'iss' => 'zero',
        'aud' => $app,
        'sub' => (int) $user['id'],
        'email' => $user['email'],
        'name' => $user['name'],
        'iat' => time(),
        'exp' => time() + 120,
        'nonce' => bin2hex(random_bytes(16)),
        'plan' => app_plan_claim((int) $user['id'], $app),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    $sig = b64url(hash_hmac('sha256', $payload, (string) config('sso_secret'), true));
    return "{$payload}.{$sig}";
}

function record_app_open(int $userId, string $app): void
{
    q(
        'INSERT INTO zero_app_access (user_id, app, first_opened_at, last_opened_at) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE last_opened_at = VALUES(last_opened_at)',
        [$userId, $app, now_utc(), now_utc()],
    );
}

function app_access(int $userId): array
{
    $rows = q('SELECT app, first_opened_at, last_opened_at FROM zero_app_access WHERE user_id = ?', [$userId])->fetchAll();
    return array_column($rows, null, 'app');
}
