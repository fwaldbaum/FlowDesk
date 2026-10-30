<?php
declare(strict_types=1);

/**
 * Platform admin at /admin for the emails in config 'admin_emails' (confirmed accounts only).
 * Repeat (rp_*) and Venu (vn_*) share ZERO's database, so they are read and managed here directly;
 * FlowDesk runs elsewhere and keeps its own admin, which /admin only links to.
 * Every change is written to zero_admin_actions.
 */

const ADMIN_PAGE_SIZE = 50;

function admin_emails(): array
{
    return array_map('normalize_email', (array) config('admin_emails', ['facundo@zerosolutions.cl']));
}

function is_admin(?array $user): bool
{
    return $user !== null && !empty($user['email_verified_at']) && in_array(normalize_email($user['email']), admin_emails(), true);
}

function require_admin(): array
{
    $user = require_login();
    if (!is_admin($user)) {
        http_response_code(404);
        render('error', ['title' => 'Página no encontrada · ZERO', 'code' => 404, 'message' => 'La página que buscas no existe o cambió de dirección.']);
        exit;
    }
    header('Cache-Control: no-store');
    return $user;
}

function admin_log(array $admin, string $action, string $target, string $detail = ''): void
{
    q(
        'INSERT INTO zero_admin_actions (admin_id, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?)',
        [$admin['id'], $action, mb_substr($target, 0, 190), mb_substr($detail, 0, 500), now_utc()],
    );
}

/** True when an app's tables exist in this database (an app may not be installed yet). */
function app_installed(string $table): bool
{
    static $cache = [];
    return $cache[$table] ??= (bool) q(
        'SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
        [$table],
    )->fetchColumn();
}

/** Escapes LIKE wildcards in a search term. */
function like(string $term): string
{
    return '%' . addcslashes($term, '%_\\') . '%';
}

/** Tier stored in an app's users table ('free' once expired). */
function stored_tier(?string $plan, ?string $until): string
{
    if (!$plan || $plan === 'free') {
        return 'free';
    }
    return $until === null || $until > now_utc() ? $plan : 'free';
}

/** Link to the FlowDesk admin, through the ZERO proxy. */
function flowdesk_admin_url(): string
{
    return rtrim((string) (config('apps', [])['flowdesk'] ?? url('/flowdesk')), '/') . '/app/admin';
}

function repeat_card_url(string $slug): string
{
    return rtrim((string) (config('apps', [])['repeat'] ?? ''), '/') . '/c/' . rawurlencode($slug);
}

function venu_org_url(string $slug): string
{
    $base = (string) (config('apps', [])['venu'] ?? '');
    $parts = parse_url($base);
    if (empty($parts['host'])) {
        return $base;
    }
    return ($parts['scheme'] ?? 'https') . '://' . $slug . '.' . $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : '');
}

// ---- Overview -----------------------------------------------------------------------------

function admin_overview(): array
{
    $month = gmdate('Y-m-01 00:00:00');
    $stats = [
        'accounts' => (int) q('SELECT COUNT(*) FROM zero_users')->fetchColumn(),
        'confirmed' => (int) q('SELECT COUNT(*) FROM zero_users WHERE email_verified_at IS NOT NULL')->fetchColumn(),
        'new_week' => (int) q('SELECT COUNT(*) FROM zero_users WHERE created_at > ?', [now_utc(-7 * 86400)])->fetchColumn(),
        'active_subs' => (int) q('SELECT COUNT(*) FROM zero_subscriptions WHERE ends_at > ?', [now_utc()])->fetchColumn(),
        'revenue_month' => (int) q("SELECT COALESCE(SUM(amount), 0) FROM zero_payments WHERE status = 'paid' AND paid_at >= ?", [$month])->fetchColumn(),
        'revenue_total' => (int) q("SELECT COALESCE(SUM(amount), 0) FROM zero_payments WHERE status = 'paid'")->fetchColumn(),
        'review' => (int) q("SELECT COUNT(*) FROM zero_payments WHERE status = 'mismatch'")->fetchColumn(),
    ];
    $apps = [];
    if (app_installed('rp_businesses')) {
        $apps['repeat'] = [
            'Negocios' => (int) q('SELECT COUNT(*) FROM rp_businesses')->fetchColumn(),
            'Clientes con tarjeta' => (int) q('SELECT COUNT(*) FROM rp_customers')->fetchColumn(),
            'Sellos en 30 días' => (int) q("SELECT COALESCE(SUM(amount), 0) FROM rp_events WHERE type = 'stamp' AND undone_at IS NULL AND created_at > ?", [now_utc(-30 * 86400)])->fetchColumn(),
            'Con Pro' => (int) q("SELECT COUNT(*) FROM rp_users WHERE plan <> 'free' AND (plan_expires_at IS NULL OR plan_expires_at > ?)", [now_utc()])->fetchColumn(),
        ];
    }
    if (app_installed('vn_orgs')) {
        $apps['venu'] = [
            'Organizadores' => (int) q('SELECT COUNT(*) FROM vn_orgs')->fetchColumn(),
            'Eventos publicados' => (int) q("SELECT COUNT(*) FROM vn_events WHERE status = 'published'")->fetchColumn(),
            'Entradas emitidas' => (int) q('SELECT COUNT(*) FROM vn_tickets')->fetchColumn(),
            'Ventas pagadas' => clp((int) q("SELECT COALESCE(SUM(total), 0) FROM vn_orders WHERE status = 'paid'")->fetchColumn()),
        ];
    }
    if (app_installed('pd_stores')) {
        $sold = "'paid', 'preparing', 'ready', 'delivered'";
        $apps['pido'] = [
            'Restaurantes' => (int) q('SELECT COUNT(*) FROM pd_stores')->fetchColumn(),
            'Tótems activos' => (int) q('SELECT COUNT(*) FROM pd_kiosks WHERE active = 1 AND last_seen_at > ?', [now_utc(-7 * 86400)])->fetchColumn(),
            'Pedidos en 30 días' => (int) q("SELECT COUNT(*) FROM pd_orders WHERE status IN ({$sold}) AND paid_at > ?", [now_utc(-30 * 86400)])->fetchColumn(),
            'Ventas pagadas' => clp((int) q("SELECT COALESCE(SUM(total), 0) FROM pd_orders WHERE status IN ({$sold})")->fetchColumn()),
        ];
    }
    $payments = q(
        'SELECT p.*, u.name, u.email FROM zero_payments p JOIN zero_users u ON u.id = p.user_id
          WHERE p.status <> \'pending\' ORDER BY p.created_at DESC LIMIT 8',
    )->fetchAll();
    $signups = q('SELECT id, name, email, email_verified_at, created_at FROM zero_users ORDER BY created_at DESC LIMIT 6')->fetchAll();
    return compact('stats', 'apps', 'payments', 'signups');
}

// ---- ZERO accounts ----------------------------------------------------------------------

function admin_accounts(string $search, int $page): array
{
    $where = '';
    $params = [];
    if ($search !== '') {
        $where = 'WHERE u.name LIKE ? OR u.email LIKE ?';
        $params = [like($search), like($search)];
    }
    $total = (int) q("SELECT COUNT(*) FROM zero_users u {$where}", $params)->fetchColumn();
    $offset = max(0, ($page - 1) * ADMIN_PAGE_SIZE);
    $rows = q(
        "SELECT u.*,
                (SELECT GROUP_CONCAT(s.plan) FROM zero_subscriptions s WHERE s.user_id = u.id AND s.ends_at > ?) AS plans,
                (SELECT GROUP_CONCAT(a.app) FROM zero_app_access a WHERE a.user_id = u.id) AS apps
           FROM zero_users u {$where}
          ORDER BY u.created_at DESC LIMIT " . ADMIN_PAGE_SIZE . " OFFSET {$offset}",
        array_merge([now_utc()], $params),
    )->fetchAll();
    return ['rows' => $rows, 'total' => $total, 'pages' => max(1, (int) ceil($total / ADMIN_PAGE_SIZE))];
}

function admin_account(int $id): ?array
{
    $account = q('SELECT * FROM zero_users WHERE id = ?', [$id])->fetch();
    if (!$account) {
        return null;
    }
    $email = $account['email'];
    $apps = [];
    if (app_installed('rp_users')) {
        $apps['repeat'] = q(
            'SELECT u.plan, u.plan_expires_at, u.last_login_at, b.name AS space, b.slug,
                    (SELECT COUNT(*) FROM rp_customers c WHERE c.business_id = b.id) AS customers
               FROM rp_users u LEFT JOIN rp_businesses b ON b.owner_id = u.id WHERE u.email = ? LIMIT 1',
            [$email],
        )->fetch() ?: null;
    }
    if (app_installed('vn_users')) {
        $apps['venu'] = q(
            'SELECT u.plan, u.plan_expires_at, u.last_login_at, o.name AS space, o.slug,
                    (SELECT COUNT(*) FROM vn_events e WHERE e.org_id = o.id) AS events
               FROM vn_users u LEFT JOIN vn_orgs o ON o.owner_id = u.id WHERE u.email = ? LIMIT 1',
            [$email],
        )->fetch() ?: null;
    }
    if (app_installed('pd_users')) {
        $apps['pido'] = q(
            'SELECT u.plan, u.plan_expires_at, u.last_login_at, s.name AS space, NULL AS slug,
                    (SELECT COUNT(*) FROM pd_kiosks k WHERE k.store_id = s.id) AS kiosks
               FROM pd_users u LEFT JOIN pd_stores s ON s.owner_id = u.id WHERE u.email = ? LIMIT 1',
            [$email],
        )->fetch() ?: null;
    }
    return [
        'account' => $account,
        'access' => app_access($id),
        'subscriptions' => q('SELECT * FROM zero_subscriptions WHERE user_id = ? ORDER BY ends_at DESC', [$id])->fetchAll(),
        'payments' => payment_history($id),
        'apps' => $apps,
        'log' => q(
            'SELECT l.*, a.name AS admin_name FROM zero_admin_actions l LEFT JOIN zero_users a ON a.id = l.admin_id
              WHERE l.target = ? ORDER BY l.created_at DESC LIMIT 20',
            ['account:' . $id],
        )->fetchAll(),
    ];
}

/** Gives (or extends) a plan without a payment. The apps get it through the usual signed push. */
function admin_grant_plan(array $admin, array $account, string $planKey, int $days): void
{
    $plan = zero_plan($planKey);
    if (!$plan || $days < 1 || $days > 3650) {
        throw new InvalidArgumentException('Elige un plan y entre 1 y 3650 días.');
    }
    $userId = (int) $account['id'];
    $current = q('SELECT ends_at FROM zero_subscriptions WHERE user_id = ? AND plan = ?', [$userId, $planKey])->fetchColumn();
    $base = new DateTimeImmutable($current && $current > now_utc() ? "{$current} UTC" : 'now', new DateTimeZone('UTC'));
    $endsAt = $base->modify("+{$days} days")->format('Y-m-d H:i:s');
    q(
        'INSERT INTO zero_subscriptions (user_id, plan, period, amount, started_at, ends_at, updated_at) VALUES (?, ?, ?, 0, ?, ?, ?)
         ON DUPLICATE KEY UPDATE started_at = IF(ends_at > VALUES(updated_at), started_at, VALUES(started_at)),
             ends_at = VALUES(ends_at), replaced_by = NULL, updated_at = VALUES(updated_at)',
        [$userId, $planKey, $days >= 365 ? 'year' : 'month', now_utc(), $endsAt, now_utc()],
    );
    admin_log($admin, 'plan.grant', 'account:' . $userId, "{$plan['name']}: {$days} días, hasta " . local_time($endsAt, 'j M Y'));
    push_app_plans(q('SELECT * FROM zero_users WHERE id = ?', [$userId])->fetch());
}

/**
 * Ends a plan now. Apps only accept plan changes that move forward, so Repeat and Venu (same database)
 * are set to the account's remaining tier directly; FlowDesk keeps it until it expires there.
 */
function admin_end_plan(array $admin, array $account, string $planKey): void
{
    $userId = (int) $account['id'];
    $changed = q('UPDATE zero_subscriptions SET ends_at = ?, updated_at = ? WHERE user_id = ? AND plan = ? AND ends_at > ?', [now_utc(), now_utc(), $userId, $planKey, now_utc()])->rowCount();
    if (!$changed) {
        throw new InvalidArgumentException('Ese plan ya no estaba activo.');
    }
    foreach (['repeat' => 'rp_users', 'venu' => 'vn_users', 'pido' => 'pd_users'] as $app => $table) {
        if (!app_installed($table)) {
            continue;
        }
        $left = app_tier($userId, $app);
        q("UPDATE {$table} SET plan = ?, plan_expires_at = ? WHERE email = ?", [$left['tier'], $left['tier'] === 'free' ? null : $left['ends_at'], $account['email']]);
    }
    admin_log($admin, 'plan.end', 'account:' . $userId, (zero_plan($planKey)['name'] ?? $planKey) . ' terminado');
}

// ---- Repeat and Venu ------------------------------------------------------------------------

function admin_repeat(string $search): array
{
    if (!app_installed('rp_businesses')) {
        return [];
    }
    $where = $search !== '' ? 'WHERE b.name LIKE ? OR u.email LIKE ? OR b.slug LIKE ?' : '';
    return q(
        "SELECT b.id, b.name, b.slug, b.category, b.created_at, u.email, u.name AS owner, u.plan, u.plan_expires_at, u.last_login_at,
                z.id AS zero_id,
                (SELECT COUNT(*) FROM rp_customers c WHERE c.business_id = b.id) AS customers,
                (SELECT COALESCE(SUM(e.amount), 0) FROM rp_events e WHERE e.business_id = b.id AND e.type = 'stamp' AND e.undone_at IS NULL AND e.created_at > ?) AS stamps_30d,
                (SELECT MAX(e.created_at) FROM rp_events e WHERE e.business_id = b.id) AS last_activity
           FROM rp_businesses b JOIN rp_users u ON u.id = b.owner_id LEFT JOIN zero_users z ON z.email = u.email
          {$where} ORDER BY b.created_at DESC LIMIT 200",
        array_merge([now_utc(-30 * 86400)], $search !== '' ? [like($search), like($search), like($search)] : []),
    )->fetchAll();
}

function admin_venu(string $search): array
{
    if (!app_installed('vn_orgs')) {
        return ['orgs' => [], 'events' => []];
    }
    $where = $search !== '' ? 'WHERE o.name LIKE ? OR u.email LIKE ? OR o.slug LIKE ?' : '';
    $params = $search !== '' ? [like($search), like($search), like($search)] : [];
    $orgs = q(
        "SELECT o.id, o.name, o.slug, o.created_at, u.email, u.name AS owner, u.plan, u.plan_expires_at, z.id AS zero_id,
                (SELECT COUNT(*) FROM vn_events e WHERE e.org_id = o.id) AS events,
                (SELECT COUNT(*) FROM vn_events e WHERE e.org_id = o.id AND e.status = 'published') AS published,
                (SELECT COALESCE(SUM(r.total), 0) FROM vn_orders r WHERE r.org_id = o.id AND r.status = 'paid') AS sales,
                (SELECT COUNT(*) FROM vn_tickets t JOIN vn_events e ON e.id = t.event_id WHERE e.org_id = o.id) AS tickets
           FROM vn_orgs o JOIN vn_users u ON u.id = o.owner_id LEFT JOIN zero_users z ON z.email = u.email
          {$where} ORDER BY o.created_at DESC LIMIT 200",
        $params,
    )->fetchAll();
    $events = q(
        "SELECT e.id, e.title, e.slug, e.status, e.starts_at, o.name AS org, o.slug AS org_slug,
                (SELECT COUNT(*) FROM vn_tickets t WHERE t.event_id = e.id) AS tickets
           FROM vn_events e JOIN vn_orgs o ON o.id = e.org_id JOIN vn_users u ON u.id = o.owner_id
          " . ($search !== '' ? 'WHERE e.title LIKE ? OR o.name LIKE ? OR u.email LIKE ?' : '') . "
          ORDER BY e.starts_at DESC LIMIT 100",
        $params,
    )->fetchAll();
    return ['orgs' => $orgs, 'events' => $events];
}

function admin_pido(string $search): array
{
    if (!app_installed('pd_stores')) {
        return [];
    }
    $sold = "'paid', 'preparing', 'ready', 'delivered'";
    $where = $search !== '' ? 'WHERE s.name LIKE ? OR u.email LIKE ?' : '';
    return q(
        "SELECT s.id, s.name, s.created_at, u.email, u.plan, u.plan_expires_at, z.id AS zero_id,
                (SELECT COUNT(*) FROM pd_kiosks k WHERE k.store_id = s.id AND k.active = 1) AS kiosks,
                (SELECT MAX(k.last_seen_at) FROM pd_kiosks k WHERE k.store_id = s.id) AS last_seen,
                (SELECT COUNT(*) FROM pd_products p WHERE p.store_id = s.id) AS products,
                (SELECT COUNT(*) FROM pd_orders o WHERE o.store_id = s.id AND o.status IN ({$sold}) AND o.paid_at > ?) AS orders_30d,
                (SELECT COALESCE(SUM(o.total), 0) FROM pd_orders o WHERE o.store_id = s.id AND o.status IN ({$sold})) AS sales
           FROM pd_stores s JOIN pd_users u ON u.id = s.owner_id LEFT JOIN zero_users z ON z.email = u.email
          {$where} ORDER BY s.created_at DESC LIMIT 200",
        array_merge([now_utc(-30 * 86400)], $search !== '' ? [like($search), like($search)] : []),
    )->fetchAll();
}

/** Takes an event off the public site (it stays as a draft the organizer can fix and republish). */
function admin_unpublish_event(array $admin, int $eventId): string
{
    $event = q('SELECT e.id, e.title, o.name AS org FROM vn_events e JOIN vn_orgs o ON o.id = e.org_id WHERE e.id = ?', [$eventId])->fetch();
    if (!$event) {
        throw new InvalidArgumentException('Ese evento no existe.');
    }
    q("UPDATE vn_events SET status = 'draft', updated_at = ? WHERE id = ? AND status = 'published'", [now_utc(), $eventId]);
    admin_log($admin, 'venu.unpublish', 'venu-event:' . $eventId, "{$event['title']} ({$event['org']})");
    return $event['title'];
}

function admin_actions_log(int $limit = 200): array
{
    return q(
        'SELECT l.*, a.name AS admin_name, a.email AS admin_email FROM zero_admin_actions l
           LEFT JOIN zero_users a ON a.id = l.admin_id ORDER BY l.created_at DESC LIMIT ' . $limit,
    )->fetchAll();
}

/** Human label for a log row's target ("account:12" links to that account). */
function admin_target(string $target): array
{
    [$kind, $id] = array_pad(explode(':', $target, 2), 2, '');
    if ($kind === 'account') {
        $name = q('SELECT email FROM zero_users WHERE id = ?', [(int) $id])->fetchColumn();
        return [$name ?: "Cuenta #{$id}", '/admin/cuentas/' . (int) $id];
    }
    if ($kind === 'venu-event') {
        return ["Evento de Venu #{$id}", null];
    }
    return [$target, null];
}

// ---- Routes -----------------------------------------------------------------------------

function admin_route(string $method, string $path): bool
{
    if ($path !== '/admin' && !str_starts_with($path, '/admin/')) {
        return false;
    }
    $admin = require_admin();
    $search = mb_substr(trim((string) ($_GET['q'] ?? '')), 0, 80);
    $base = ['layout' => 'account', 'user' => $admin, 'section' => 'admin'];

    if ($method === 'GET' && $path === '/admin') {
        render('admin/overview', $base + admin_overview() + ['title' => 'Administración · ZERO', 'tab' => 'overview']);
        return true;
    }
    if ($method === 'GET' && $path === '/admin/cuentas') {
        $page = max(1, (int) ($_GET['p'] ?? 1));
        render('admin/accounts', $base + admin_accounts($search, $page) + ['title' => 'Cuentas · Administración', 'tab' => 'accounts', 'search' => $search, 'page' => $page]);
        return true;
    }
    if (preg_match('#^/admin/cuentas/(\d+)(?:/([a-z-]+))?$#', $path, $m)) {
        $data = admin_account((int) $m[1]);
        if (!$data) {
            return false;
        }
        $account = $data['account'];
        $back = '/admin/cuentas/' . $account['id'];
        if ($method === 'GET' && empty($m[2])) {
            render('admin/account', $base + $data + ['title' => $account['name'] . ' · Administración', 'tab' => 'accounts']);
            return true;
        }
        if ($method !== 'POST') {
            return false;
        }
        try {
            switch ($m[2] ?? '') {
                case 'plan':
                    admin_grant_plan($admin, $account, (string) ($_POST['plan'] ?? ''), (int) ($_POST['days'] ?? 0));
                    flash('success', 'Plan activado. Las aplicaciones ya lo recibieron.');
                    break;
                case 'terminar-plan':
                    admin_end_plan($admin, $account, (string) ($_POST['plan'] ?? ''));
                    flash('success', 'Plan terminado.');
                    break;
                case 'confirmar':
                    q('UPDATE zero_users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?', [now_utc(), $account['id']]);
                    admin_log($admin, 'account.verify', 'account:' . $account['id'], 'Correo confirmado a mano');
                    flash('success', 'Correo confirmado.');
                    break;
                case 'cerrar-sesiones':
                    q('UPDATE zero_users SET session_version = session_version + 1 WHERE id = ?', [$account['id']]);
                    admin_log($admin, 'account.signout', 'account:' . $account['id'], 'Sesiones cerradas');
                    if ((int) $account['id'] === (int) $admin['id']) {
                        login_user(find_user_by_email($admin['email']));
                    }
                    flash('success', 'Cerramos todas las sesiones de esta cuenta en ZERO.');
                    break;
                default:
                    return false;
            }
        } catch (InvalidArgumentException $err) {
            flash('error', $err->getMessage());
        }
        redirect($back);
    }
    if ($method === 'GET' && $path === '/admin/repeat') {
        render('admin/repeat', $base + ['title' => 'Repeat · Administración', 'tab' => 'repeat', 'search' => $search, 'rows' => admin_repeat($search), 'installed' => app_installed('rp_businesses')]);
        return true;
    }
    if ($method === 'GET' && $path === '/admin/venu') {
        render('admin/venu', $base + admin_venu($search) + ['title' => 'Venu · Administración', 'tab' => 'venu', 'search' => $search, 'installed' => app_installed('vn_orgs')]);
        return true;
    }
    if ($method === 'GET' && $path === '/admin/pido') {
        render('admin/pido', $base + ['title' => 'Pido · Administración', 'tab' => 'pido', 'search' => $search, 'rows' => admin_pido($search), 'installed' => app_installed('pd_stores')]);
        return true;
    }
    if ($method === 'POST' && preg_match('#^/admin/venu/eventos/(\d+)/despublicar$#', $path, $m)) {
        try {
            flash('success', '«' . admin_unpublish_event($admin, (int) $m[1]) . '» ya no está publicado. El organizador lo ve como borrador.');
        } catch (InvalidArgumentException $err) {
            flash('error', $err->getMessage());
        }
        redirect('/admin/venu');
    }
    if ($method === 'GET' && $path === '/admin/registro') {
        render('admin/log', $base + ['title' => 'Registro · Administración', 'tab' => 'log', 'rows' => admin_actions_log()]);
        return true;
    }
    return false;
}
