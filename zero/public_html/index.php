<?php
declare(strict_types=1);

// Local development with `php -S`: let the built-in server return static files.
if (PHP_SAPI === 'cli-server' && is_file(__DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH))) {
    return false;
}

require __DIR__ . '/app/bootstrap.php';

// FlowDesk lives at /flowdesk: hand those requests to the proxy before sessions or CSRF.
$rawPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
if ($rawPath === '/flowdesk' || str_starts_with($rawPath, '/flowdesk/')) {
    require __DIR__ . '/app/flowdesk_proxy.php';
    proxy_flowdesk('/flowdesk');
}

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

$method = $_SERVER['REQUEST_METHOD'];
$path = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/', '/') ?: '/';

// Mercado Pago calls these from its own servers, so they can't carry our CSRF token.
if ($method === 'POST' && !str_starts_with($path, '/pagos/mp/')) {
    verify_csrf();
}

try {
    route($method, $path);
} catch (PDOException $err) {
    error_log('[zero] database: ' . $err->getMessage());
    http_response_code(503);
    render('error', [
        'title' => 'Servicio no disponible',
        'layout' => 'auth', // the site layout itself needs the database
        'code' => 503,
        'message' => 'No pudimos conectar con la base de datos. Inténtalo de nuevo en unos minutos.',
    ]);
}

function route(string $method, string $path): void
{
    switch ("{$method} {$path}") {
        // ---- Public site ----------------------------------------------------------
        case 'GET /':
            render('home', ['title' => 'ZERO Solutions · Software simple para hacer crecer tu negocio', 'nav' => 'home']);
            return;
        case 'GET /productos':
            render('products', ['title' => 'Productos · ZERO Solutions', 'nav' => 'productos']);
            return;
        case 'GET /productos/flowdesk':
            render('flowdesk', ['title' => 'FlowDesk · CRM para pymes · ZERO Solutions', 'nav' => 'productos']);
            return;
        case 'GET /precios':
            render('pricing', [
                'title' => 'Precios · ZERO Solutions',
                'nav' => 'precios',
                'description' => 'Planes de FlowDesk y ZERO Plus, mensuales o anuales, en pesos chilenos con IVA incluido.',
            ]);
            return;
        // ---- Halloween ------------------------------------------------------------
        case 'GET /hallowing':
            render('halloween/page', ['layout' => 'none', 'hw' => hw_settings()]);
            return;
        case 'GET /hallowing/config':
            hw_is_admin()
                ? render('halloween/config', ['layout' => 'none', 'hw' => hw_settings()])
                : render('halloween/login', ['title' => 'Panel de Halloween · ZERO', 'layout' => 'auth', 'error' => null]);
            return;
        case 'POST /hallowing/config/entrar':
            $error = hw_login((string) ($_POST['email'] ?? ''), (string) ($_POST['password'] ?? ''));
            if ($error) {
                http_response_code(422);
                $GLOBALS['zero_old'] = ['email' => (string) ($_POST['email'] ?? '')];
                render('halloween/login', ['title' => 'Panel de Halloween · ZERO', 'layout' => 'auth', 'error' => $error]);
                return;
            }
            redirect('/hallowing/config');
        case 'POST /hallowing/config/salir':
            hw_logout();
            redirect('/hallowing/config');
        case 'POST /hallowing/config':
            hw_save_action();
            return;
        case 'GET /nosotros':
            render('about', ['title' => 'Sobre nosotros · ZERO Solutions', 'nav' => 'nosotros']);
            return;

        // ---- Accounts -------------------------------------------------------------
        case 'GET /registro':
            if (current_user()) {
                redirect(safe_next($_GET['next'] ?? null));
            }
            render('auth/register', ['title' => 'Crear cuenta · ZERO', 'layout' => 'auth']);
            return;
        case 'POST /registro':
            register_action();
            return;
        case 'GET /entrar':
            if (current_user()) {
                redirect(safe_next($_GET['next'] ?? null));
            }
            render('auth/login', ['title' => 'Entrar · ZERO', 'layout' => 'auth']);
            return;
        case 'POST /entrar':
            login_action();
            return;
        case 'POST /salir':
            logout_user();
            redirect('/');
        case 'GET /verificar':
            verify_action();
            return;
        case 'POST /verificar/reenviar':
            resend_verification_action();
            return;
        case 'GET /recuperar':
            render('auth/forgot', ['title' => 'Recuperar contraseña · ZERO', 'layout' => 'auth']);
            return;
        case 'POST /recuperar':
            forgot_action();
            return;
        case 'GET /restablecer':
            render('auth/reset', ['title' => 'Nueva contraseña · ZERO', 'layout' => 'auth', 'token' => (string) ($_GET['token'] ?? '')]);
            return;
        case 'POST /restablecer':
            reset_action();
            return;

        // ---- Account area ---------------------------------------------------------
        case 'GET /cuenta':
            $user = require_login();
            render('account/dashboard', [
                'title' => 'Mi cuenta · ZERO',
                'layout' => 'account',
                'user' => $user,
                'access' => app_access((int) $user['id']),
                'section' => 'apps',
            ]);
            return;
        case 'GET /cuenta/ajustes':
            $user = require_login();
            render('account/settings', ['title' => 'Ajustes · ZERO', 'layout' => 'account', 'user' => $user, 'section' => 'ajustes']);
            return;
        case 'GET /cuenta/plan':
            billing_page();
            return;
        case 'POST /pagar':
            pay_action();
            return;
        case 'POST /pagos/mp/webhook':
            mp_webhook_action();
            return;
        case 'GET /pagos/mp/retorno':
            mp_return_action();
            return;
        case 'POST /cuenta/perfil':
            profile_action();
            return;
        case 'POST /cuenta/contrasena':
            password_action();
            return;
        case 'POST /cuenta/cerrar-sesiones':
            $user = require_login();
            q('UPDATE zero_users SET session_version = session_version + 1 WHERE id = ?', [$user['id']]);
            login_user(find_user_by_email($user['email']));
            flash('success', 'Cerramos tu sesión en todos los demás dispositivos.');
            redirect('/cuenta/ajustes');
    }

    if (admin_route($method, $path)) {
        return;
    }

    if ($method === 'GET' && preg_match('#^/abrir/([a-z0-9-]+)$#', $path, $m)) {
        open_app_action($m[1]);
        return;
    }

    http_response_code(404);
    render('error', ['title' => 'Página no encontrada · ZERO', 'code' => 404, 'message' => 'La página que buscas no existe o cambió de dirección.']);
}

// ---- Actions --------------------------------------------------------------------------

function form_error(string $view, string $title, string $message, array $keep = []): void
{
    http_response_code(422);
    $GLOBALS['zero_old'] = $keep;
    render($view, ['title' => $title, 'layout' => 'auth', 'error' => $message]);
}

function register_action(): void
{
    $name = trim((string) ($_POST['name'] ?? ''));
    $email = normalize_email((string) ($_POST['email'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    $keep = ['name' => $name, 'email' => $email, 'next' => $_POST['next'] ?? ''];
    $title = 'Crear cuenta · ZERO';

    if (mb_strlen($name) < 2 || mb_strlen($name) > 120) {
        form_error('auth/register', $title, 'Escribe tu nombre y apellido.', $keep);
        return;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190) {
        form_error('auth/register', $title, 'Escribe un correo válido.', $keep);
        return;
    }
    if ($msg = validate_password($password)) {
        form_error('auth/register', $title, $msg, $keep);
        return;
    }
    if (too_many('register:' . client_ip(), 10, 3600)) {
        form_error('auth/register', $title, 'Demasiados registros desde esta conexión. Inténtalo más tarde.', $keep);
        return;
    }
    if (find_user_by_email($email)) {
        form_error('auth/register', $title, 'Ya existe una cuenta con ese correo. Entra con tu contraseña.', $keep);
        return;
    }

    q('INSERT INTO zero_users (name, email, password_hash) VALUES (?, ?, ?)', [$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
    $user = find_user_by_email($email);
    login_user($user);
    try {
        send_verification($user);
    } catch (Throwable $err) {
        error_log('[zero] verification email: ' . $err->getMessage());
    }
    flash('success', "Cuenta creada. Te enviamos un correo a {$email} para confirmarla.");
    redirect(safe_next($_POST['next'] ?? null));
}

function login_action(): void
{
    $email = normalize_email((string) ($_POST['email'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    $keep = ['email' => $email, 'next' => $_POST['next'] ?? ''];
    $title = 'Entrar · ZERO';

    if (too_many('login-ip:' . client_ip(), 30, 900) || too_many('login:' . $email, 8, 900)) {
        form_error('auth/login', $title, 'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.', $keep);
        return;
    }
    $user = find_user_by_email($email);
    // Verify against a dummy hash when the account doesn't exist, so timing doesn't reveal it.
    $hash = $user['password_hash'] ?? password_hash('zero-dummy-password', PASSWORD_DEFAULT);
    if (!password_verify($password, $hash) || !$user) {
        form_error('auth/login', $title, 'Correo o contraseña incorrectos.', $keep);
        return;
    }
    if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
        q('UPDATE zero_users SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $user['id']]);
    }
    clear_attempts('login:' . $email);
    login_user($user);
    redirect(safe_next($_POST['next'] ?? null));
}

function verify_action(): void
{
    $userId = consume_token((string) ($_GET['token'] ?? ''), 'verify');
    if (!$userId) {
        render('error', [
            'title' => 'Enlace no válido · ZERO',
            'code' => 400,
            'message' => 'El enlace de confirmación no es válido o ya expiró. Entra a tu cuenta para pedir uno nuevo.',
            'action' => ['label' => 'Ir a mi cuenta', 'href' => '/cuenta'],
        ]);
        return;
    }
    q('UPDATE zero_users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?', [now_utc(), $userId]);
    flash('success', 'Tu correo quedó confirmado. Ya puedes abrir tus aplicaciones.');
    redirect(current_user() ? '/cuenta' : '/entrar');
}

function resend_verification_action(): void
{
    $user = require_login();
    if ($user['email_verified_at']) {
        redirect('/cuenta');
    }
    if (too_many('verify:' . $user['id'], 3, 900)) {
        flash('error', 'Ya te enviamos varios correos. Revisa tu bandeja (y spam) o espera 15 minutos.');
        redirect(safe_next($_POST['next'] ?? null));
    }
    send_verification($user);
    flash('success', "Te enviamos un nuevo correo a {$user['email']}.");
    redirect(safe_next($_POST['next'] ?? null));
}

/** Always answers the same way so it can't reveal which emails have accounts. */
function forgot_action(): void
{
    $email = normalize_email((string) ($_POST['email'] ?? ''));
    if (filter_var($email, FILTER_VALIDATE_EMAIL)
        && !too_many('reset-ip:' . client_ip(), 20, 3600)
        && !too_many('reset:' . $email, 3, 3600)
        && ($user = find_user_by_email($email))
    ) {
        $link = url('/restablecer?token=' . create_token((int) $user['id'], 'reset'));
        send_mail($user['email'], ...reset_password_message($user['name'], $link));
    }
    render('auth/forgot', ['title' => 'Recuperar contraseña · ZERO', 'layout' => 'auth', 'sent' => $email]);
}

function reset_action(): void
{
    $token = (string) ($_POST['token'] ?? '');
    $password = (string) ($_POST['password'] ?? '');
    if ($msg = validate_password($password)) {
        render('auth/reset', ['title' => 'Nueva contraseña · ZERO', 'layout' => 'auth', 'token' => $token, 'error' => $msg]);
        return;
    }
    $userId = consume_token($token, 'reset');
    if (!$userId) {
        render('auth/reset', ['title' => 'Nueva contraseña · ZERO', 'layout' => 'auth', 'token' => '', 'error' => 'El enlace no es válido o ya expiró. Pide uno nuevo.']);
        return;
    }
    // Following the emailed link proves the inbox; bumping session_version signs out other devices.
    q(
        'UPDATE zero_users SET password_hash = ?, session_version = session_version + 1,
            email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?',
        [password_hash($password, PASSWORD_DEFAULT), now_utc(), $userId],
    );
    logout_user();
    flash('success', 'Contraseña actualizada. Entra con tu nueva contraseña.');
    redirect('/entrar');
}

function profile_action(): void
{
    $user = require_login();
    $name = trim((string) ($_POST['name'] ?? ''));
    if (mb_strlen($name) < 2 || mb_strlen($name) > 120) {
        flash('error', 'Escribe tu nombre y apellido.');
    } else {
        q('UPDATE zero_users SET name = ? WHERE id = ?', [$name, $user['id']]);
        flash('success', 'Guardamos tu nombre.');
    }
    redirect('/cuenta/ajustes');
}

function password_action(): void
{
    $user = require_login();
    $current = (string) ($_POST['current'] ?? '');
    $next = (string) ($_POST['password'] ?? '');
    if (!password_verify($current, $user['password_hash'])) {
        flash('error', 'La contraseña actual no es correcta.');
    } elseif ($msg = validate_password($next)) {
        flash('error', $msg);
    } else {
        q(
            'UPDATE zero_users SET password_hash = ?, session_version = session_version + 1 WHERE id = ?',
            [password_hash($next, PASSWORD_DEFAULT), $user['id']],
        );
        // Keep this device signed in with the new session version.
        login_user(find_user_by_email($user['email']));
        flash('success', 'Contraseña cambiada. Cerramos tu sesión en los demás dispositivos.');
    }
    redirect('/cuenta/ajustes');
}

function open_app_action(string $id): void
{
    $app = zero_app($id);
    if (!$app || empty($app['url'])) {
        http_response_code(404);
        render('error', ['title' => 'Aplicación no encontrada · ZERO', 'code' => 404, 'message' => 'Esa aplicación no existe o todavía no está disponible.']);
        return;
    }
    $user = require_login();
    if (!$user['email_verified_at']) {
        flash('error', "Confirma tu correo para abrir {$app['name']}. Revisa tu bandeja de entrada.");
        redirect('/cuenta');
    }
    if (!config('sso_secret')) {
        // Without the shared secret the apps can't trust a ZERO session: send people to the app's own sign-in.
        redirect(rtrim($app['url'], '/') . ($app['login_path'] ?? '/login'));
    }
    record_app_open((int) $user['id'], $id);
    redirect(rtrim($app['url'], '/') . ($app['sso_path'] ?? '/api/auth/zero') . '?ticket=' . rawurlencode(sso_ticket($user, $id)), 302);
}

// ---- Plans and payments -----------------------------------------------------------------

/** The checkout a /precios link asks for, validated: [plan id, period] or null. */
function requested_plan(array $input): ?array
{
    $plan = (string) ($input['plan'] ?? '');
    $period = ['mes' => 'month', 'anual' => 'year', 'month' => 'month', 'year' => 'year'][(string) ($input['periodo'] ?? 'mes')] ?? null;
    return zero_plan($plan) && $period ? [$plan, $period] : null;
}

function billing_page(): void
{
    $user = require_login();
    $checkout = null;
    if ($req = requested_plan($_GET)) {
        [$planKey, $period] = $req;
        $checkout = [
            'key' => $planKey,
            'plan' => zero_plan($planKey),
            'period' => $period,
            'covered' => covering_subscription((int) $user['id'], $planKey),
            'credit_days' => intdiv(upgrade_credit_seconds((int) $user['id'], $planKey, $period), 86400),
        ];
    }
    $order = null;
    if (!empty($_GET['orden'])) {
        $order = q('SELECT * FROM zero_payments WHERE commerce_order = ? AND user_id = ?', [(string) $_GET['orden'], $user['id']])->fetch() ?: null;
    }
    render('account/billing', [
        'title' => 'Mi plan · ZERO',
        'layout' => 'account',
        'user' => $user,
        'section' => 'plan',
        'subscriptions' => active_subscriptions((int) $user['id']),
        'payments' => payment_history((int) $user['id']),
        'checkout' => $checkout,
        'order' => $order,
    ]);
}

function pay_action(): void
{
    $user = require_login();
    $req = requested_plan($_POST);
    if (!$req) {
        redirect('/precios');
    }
    [$planKey, $period] = $req;
    $back = '/cuenta/plan?plan=' . rawurlencode($planKey) . '&periodo=' . ($period === 'year' ? 'anual' : 'mes');
    if (!$user['email_verified_at']) {
        flash('error', 'Confirma tu correo antes de contratar un plan. Revisa tu bandeja de entrada.');
        redirect($back);
    }
    if ($covered = covering_subscription((int) $user['id'], $planKey)) {
        flash('error', "Tu plan {$covered['name']} ya incluye todo lo de " . zero_plan($planKey)['name'] . '.');
        redirect('/cuenta/plan');
    }
    if (!mp_enabled()) {
        flash('error', 'Los pagos todavía no están habilitados. Escríbenos a ' . config('contact_email') . ' y te ayudamos.');
        redirect($back);
    }
    if (too_many('pay:' . $user['id'], 30, 3600)) {
        flash('error', 'Iniciaste demasiados pagos seguidos. Espera unos minutos e inténtalo de nuevo.');
        redirect($back);
    }
    try {
        redirect(start_checkout($user, $planKey, $period));
    } catch (MercadoPagoError $err) {
        error_log('[zero] mercadopago checkout: ' . $err->getMessage());
        flash('error', mp_problem($err));
        redirect($back);
    }
}

/**
 * Mercado Pago's notice (webhook). It only says "payment X changed": we read the payment from the API ourselves and
 * apply it. Answering 200 stops the retries; a 500 makes Mercado Pago try again later.
 */
function mp_webhook_action(): void
{
    $body = json_decode((string) file_get_contents('php://input'), true) ?: [];
    // PHP turns "?data.id=" into data_id. Older notices use ?topic=payment&id=.
    $type = (string) ($_GET['type'] ?? $body['type'] ?? $_GET['topic'] ?? '');
    $id = (string) ($_GET['data_id'] ?? $body['data']['id'] ?? $_GET['id'] ?? '');
    if ($type !== 'payment' || $id === '') {
        exit('ignored'); // merchant_order and other topics: the payment notice is enough
    }
    if (!mp_signature_ok((string) ($_GET['data_id'] ?? $id), (string) ($_SERVER['HTTP_X_REQUEST_ID'] ?? ''), (string) ($_SERVER['HTTP_X_SIGNATURE'] ?? ''))) {
        error_log('[zero] mercadopago webhook with an invalid signature for ' . $id);
        http_response_code(401);
        exit('invalid signature');
    }
    try {
        $payment = settle_mp_payment($id);
    } catch (MercadoPagoError $err) {
        if (in_array($err->getCode(), [400, 404], true)) {
            exit('unknown payment'); // not a payment of this account: retrying won't help
        }
        error_log('[zero] mercadopago webhook: ' . $err->getMessage());
        http_response_code(500);
        exit('error');
    } catch (Throwable $err) {
        error_log('[zero] mercadopago webhook: ' . $err->getMessage());
        http_response_code(500);
        exit('error');
    }
    exit($payment ? 'ok' : 'unknown payment');
}

/**
 * Where Mercado Pago sends the buyer back (?payment_id=&status=&external_reference=). Settle the payment here too in
 * case the notice hasn't arrived, then show the result on the account page.
 */
function mp_return_action(): void
{
    $mpId = (string) ($_GET['payment_id'] ?? $_GET['collection_id'] ?? '');
    $ref = (string) ($_GET['external_reference'] ?? '');
    $payment = null;
    if (preg_match('/^\d+$/', $mpId)) {
        try {
            $payment = settle_mp_payment($mpId);
        } catch (Throwable $err) {
            error_log('[zero] mercadopago return: ' . $err->getMessage());
        }
    }
    $payment ??= $ref !== '' ? (q('SELECT * FROM zero_payments WHERE commerce_order = ?', [$ref])->fetch() ?: null) : null;
    // Came back without paying (closed or cancelled the checkout).
    if ($payment && $payment['status'] === 'pending' && !preg_match('/^\d+$/', $mpId)) {
        q("UPDATE zero_payments SET status = 'cancelled' WHERE id = ? AND status = 'pending'", [$payment['id']]);
    }
    redirect('/cuenta/plan' . ($payment ? '?orden=' . rawurlencode($payment['commerce_order']) : ''));
}

function hw_save_action(): void
{
    if (!hw_is_admin()) {
        redirect('/hallowing/config');
    }
    $current = hw_settings();
    if (($_POST['action'] ?? '') === 'reset') {
        hw_delete_background($current['bg_image']);
        hw_save(hw_defaults());
        flash('success', 'Volvimos a la configuración inicial.');
        redirect('/hallowing/config');
    }
    [$settings, $errors] = hw_from_form($_POST, $current);
    if (!empty($_POST['bg_remove'])) {
        hw_delete_background($current['bg_image']);
        $settings['bg_image'] = '';
    }
    if (($_FILES['bg_file']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        try {
            $settings['bg_image'] = hw_store_background($_FILES['bg_file']);
            hw_delete_background($current['bg_image']);
        } catch (RuntimeException $err) {
            $errors[] = $err->getMessage();
        }
    }
    hw_save($settings);
    foreach ($errors as $error) {
        flash('error', $error);
    }
    flash('success', 'Cambios guardados. Ya se ven en zerosolutions.cl/hallowing.');
    redirect('/hallowing/config');
}
