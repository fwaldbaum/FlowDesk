<?php
declare(strict_types=1);

define('APP_DIR', __DIR__);

$configFile = APP_DIR . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    exit('Falta app/config.php: copia app/config.example.php como app/config.php y completa los datos.');
}
$GLOBALS['zero_config'] = (require $configFile) + ['contact_email' => 'hola@zerosolutions.cl'];

date_default_timezone_set('America/Santiago');
mb_internal_encoding('UTF-8');

function config(string $key, mixed $default = null): mixed
{
    return $GLOBALS['zero_config'][$key] ?? $default;
}

function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function url(string $path = '/'): string
{
    return rtrim((string) config('app_url', ''), '/') . $path;
}

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
}

function client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/** Only same-site paths are valid redirect targets after signing in. */
function safe_next(?string $next, string $fallback = '/cuenta'): string
{
    if (!$next || $next[0] !== '/' || str_starts_with($next, '//') || str_contains($next, '\\')) {
        return $fallback;
    }
    return $next;
}

function redirect(string $path, int $status = 303): never
{
    header('Location: ' . $path, true, $status);
    exit;
}

// ---- Database -----------------------------------------------------------------

function db(): PDO
{
    static $pdo = null;
    if ($pdo) {
        return $pdo;
    }
    $c = config('db');
    $pdo = new PDO(
        "mysql:host={$c['host']};dbname={$c['name']};charset=utf8mb4",
        $c['user'],
        $c['pass'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ],
    );
    $pdo->exec("SET time_zone = '+00:00'");
    migrate($pdo);
    return $pdo;
}

function q(string $sql, array $params = []): PDOStatement
{
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

/** UTC timestamp for DATETIME columns (the connection runs in UTC). */
function now_utc(int $offsetSeconds = 0): string
{
    return gmdate('Y-m-d H:i:s', time() + $offsetSeconds);
}

/** Shows a UTC DATETIME in Chilean time. */
function local_time(?string $utc, string $format = 'j M Y, H:i'): string
{
    if (!$utc) {
        return '';
    }
    $months = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    $dt = new DateTime($utc, new DateTimeZone('UTC'));
    $dt->setTimezone(new DateTimeZone('America/Santiago'));
    return str_replace($dt->format('M'), $months[(int) $dt->format('n')], $dt->format($format));
}

/**
 * Idempotent schema, applied on the first connection of each request until the stored
 * version matches. New changes go at the end as a new version; never rewrite old ones.
 */
function migrate(PDO $pdo): void
{
    $version = 2;
    try {
        $current = (int) $pdo->query("SELECT v FROM zero_meta WHERE k = 'schema'")->fetchColumn();
        if ($current >= $version) {
            return;
        }
    } catch (PDOException) {
        // First run: zero_meta doesn't exist yet.
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS zero_meta (
        k VARCHAR(40) PRIMARY KEY,
        v VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS zero_users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(190) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email_verified_at DATETIME NULL,
        session_version INT UNSIGNED NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME NULL,
        UNIQUE KEY zero_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS zero_tokens (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        purpose VARCHAR(16) NOT NULL,
        token_hash CHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY zero_tokens_hash (token_hash),
        KEY zero_tokens_user (user_id, purpose),
        CONSTRAINT zero_tokens_user_fk FOREIGN KEY (user_id) REFERENCES zero_users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS zero_attempts (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        bucket VARCHAR(190) NOT NULL,
        created_at DATETIME NOT NULL,
        KEY zero_attempts_bucket (bucket, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Which apps each account has opened, for the account dashboard.
    $pdo->exec("CREATE TABLE IF NOT EXISTS zero_app_access (
        user_id INT UNSIGNED NOT NULL,
        app VARCHAR(40) NOT NULL,
        first_opened_at DATETIME NOT NULL,
        last_opened_at DATETIME NOT NULL,
        PRIMARY KEY (user_id, app),
        CONSTRAINT zero_app_access_user_fk FOREIGN KEY (user_id) REFERENCES zero_users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // ---- v2: paid plans through Flow ----
    $pdo->exec("CREATE TABLE IF NOT EXISTS zero_payments (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        plan VARCHAR(40) NOT NULL,
        period VARCHAR(8) NOT NULL,
        amount INT UNSIGNED NOT NULL,
        currency CHAR(3) NOT NULL DEFAULT 'CLP',
        commerce_order VARCHAR(40) NOT NULL,
        flow_token VARCHAR(120) NULL,
        flow_order BIGINT UNSIGNED NULL,
        status VARCHAR(12) NOT NULL,
        media VARCHAR(60) NULL,
        credit_seconds INT UNSIGNED NOT NULL DEFAULT 0,
        period_end DATETIME NULL,
        detail VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        paid_at DATETIME NULL,
        UNIQUE KEY zero_payments_order (commerce_order),
        UNIQUE KEY zero_payments_token (flow_token),
        KEY zero_payments_user (user_id, created_at),
        CONSTRAINT zero_payments_user_fk FOREIGN KEY (user_id) REFERENCES zero_users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // One row per account and plan; ends_at moves forward with each payment.
    $pdo->exec("CREATE TABLE IF NOT EXISTS zero_subscriptions (
        user_id INT UNSIGNED NOT NULL,
        plan VARCHAR(40) NOT NULL,
        period VARCHAR(8) NOT NULL,
        amount INT UNSIGNED NOT NULL,
        started_at DATETIME NOT NULL,
        ends_at DATETIME NOT NULL,
        replaced_by VARCHAR(40) NULL,
        reminded_for DATETIME NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (user_id, plan),
        CONSTRAINT zero_subscriptions_user_fk FOREIGN KEY (user_id) REFERENCES zero_users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $stmt = $pdo->prepare("INSERT INTO zero_meta (k, v) VALUES ('schema', ?) ON DUPLICATE KEY UPDATE v = VALUES(v)");
    $stmt->execute([(string) $version]);
}

// ---- Session, CSRF and flash messages --------------------------------------------

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name('zero_sid');
    session_set_cookie_params([
        'lifetime' => 60 * 60 * 24 * 30,
        'path' => '/',
        'secure' => is_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.gc_maxlifetime', (string) (60 * 60 * 24 * 30));
    $dir = APP_DIR . '/storage/sessions';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    if (is_writable($dir)) {
        session_save_path($dir);
    }
    session_start();
}

function csrf_token(): string
{
    start_session();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="_csrf" value="' . e(csrf_token()) . '">';
}

function verify_csrf(): void
{
    start_session();
    $sent = $_POST['_csrf'] ?? '';
    if (!is_string($sent) || empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $sent)) {
        http_response_code(419);
        render('error', [
            'title' => 'La página expiró',
            'code' => 419,
            'message' => 'Por seguridad, vuelve atrás, recarga la página e inténtalo de nuevo.',
        ]);
        exit;
    }
}

function flash(string $type, string $message): void
{
    start_session();
    $_SESSION['flash'][] = ['type' => $type, 'message' => $message];
}

function take_flash(): array
{
    start_session();
    $messages = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $messages;
}

/** Keeps submitted values (never passwords) to refill a form after a validation error. */
function old(string $key): string
{
    return e($GLOBALS['zero_old'][$key] ?? '');
}

// ---- Rate limiting (stored in MySQL so it holds across PHP workers) -----------------

/** Returns true when the bucket already has $max hits inside the window. */
function too_many(string $bucket, int $max, int $windowSeconds): bool
{
    if (random_int(1, 50) === 1) {
        q('DELETE FROM zero_attempts WHERE created_at < ?', [now_utc(-86400)]);
    }
    $count = (int) q(
        'SELECT COUNT(*) FROM zero_attempts WHERE bucket = ? AND created_at > ?',
        [$bucket, now_utc(-$windowSeconds)],
    )->fetchColumn();
    if ($count >= $max) {
        return true;
    }
    q('INSERT INTO zero_attempts (bucket, created_at) VALUES (?, ?)', [$bucket, now_utc()]);
    return false;
}

function clear_attempts(string $bucket): void
{
    q('DELETE FROM zero_attempts WHERE bucket = ?', [$bucket]);
}

// ---- Views ----------------------------------------------------------------------

/** Renders app/views/<name>.php inside the layout given by $vars['layout'] (default "site"). */
function render(string $name, array $vars = []): void
{
    extract($vars, EXTR_SKIP);
    ob_start();
    require APP_DIR . "/views/{$name}.php";
    $content = ob_get_clean();
    $layout = $vars['layout'] ?? 'site';
    require APP_DIR . "/views/layouts/{$layout}.php";
}

function partial(string $name, array $vars = []): void
{
    extract($vars, EXTR_SKIP);
    require APP_DIR . "/views/partials/{$name}.php";
}

/** Inline Lucide icon (https://lucide.dev, ISC license). The site follows the no-emoji rule. */
function icon(string $name, int $size = 20, string $class = ''): string
{
    static $paths = null;
    $paths ??= require APP_DIR . '/icons.php';
    $body = $paths[$name] ?? '';
    return '<svg class="icon ' . e($class) . '" width="' . $size . '" height="' . $size . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . $body . '</svg>';
}

require APP_DIR . '/apps.php';
require APP_DIR . '/plans.php';
require APP_DIR . '/flow.php';
require APP_DIR . '/billing.php';
require APP_DIR . '/accounts.php';
require APP_DIR . '/mail.php';
