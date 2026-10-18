<?php
declare(strict_types=1);

/**
 * Plan purchases through Flow. Each purchase is a prepaid period (month or year): paying again extends it,
 * and buying a higher plan turns the time left on the plan it replaces into extra days. The paid tier is
 * pushed to each app right away and also travels in every sign-in ticket, so apps catch up even if the
 * push fails.
 */

/** Active plans of an account, keyed by plan id. */
function active_subscriptions(int $userId): array
{
    $rows = q(
        'SELECT * FROM zero_subscriptions WHERE user_id = ? AND ends_at > ? ORDER BY ends_at DESC',
        [$userId, now_utc()],
    )->fetchAll();
    return array_filter(array_column($rows, null, 'plan'), fn ($row) => zero_plan($row['plan']) !== null);
}

/** Best tier the account has in an app: ['tier' => 'pro', 'ends_at' => '...', 'plan' => 'flowdesk_pro'] or tier 'free'. */
function app_tier(int $userId, string $app): array
{
    $best = ['tier' => 'free', 'ends_at' => null, 'plan' => null];
    foreach (active_subscriptions($userId) as $key => $sub) {
        $tier = plan_tier(zero_plan($key), $app);
        $better = APP_TIERS[$tier] <=> APP_TIERS[$best['tier']];
        if ($better > 0 || ($better === 0 && $tier !== 'free' && $sub['ends_at'] > $best['ends_at'])) {
            $best = ['tier' => $tier, 'ends_at' => $sub['ends_at'], 'plan' => $key];
        }
    }
    return $best;
}

/** An active plan that already includes $planKey, which makes buying it pointless. */
function covering_subscription(int $userId, string $planKey): ?array
{
    $plan = zero_plan($planKey);
    foreach (active_subscriptions($userId) as $key => $sub) {
        if (plan_supersedes(zero_plan($key), $plan)) {
            return $sub + ['name' => zero_plan($key)['name']];
        }
    }
    return null;
}

/** Days of credit that active lower plans would add to $planKey bought for $period. */
function upgrade_credit_seconds(int $userId, string $planKey, string $period): int
{
    $plan = zero_plan($planKey);
    $newRate = $plan['price'][$period] / (PLAN_PERIODS[$period]['days'] * 86400);
    $seconds = 0;
    foreach (active_subscriptions($userId) as $key => $sub) {
        if (!plan_supersedes($plan, zero_plan($key))) {
            continue;
        }
        $left = max(0, strtotime($sub['ends_at'] . ' UTC') - time());
        $oldRate = (int) $sub['amount'] / (PLAN_PERIODS[$sub['period']]['days'] * 86400);
        $seconds += (int) floor($left * $oldRate / $newRate);
    }
    return $seconds;
}

/** Creates the order and returns Flow's checkout URL. Throws FlowError or returns a message for the user. */
function start_checkout(array $user, string $planKey, string $period): string
{
    $plan = zero_plan($planKey);
    $amount = $plan['price'][$period];
    $commerceOrder = 'pending-' . bin2hex(random_bytes(8));
    q(
        'INSERT INTO zero_payments (user_id, plan, period, amount, currency, commerce_order, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [$user['id'], $planKey, $period, $amount, 'CLP', $commerceOrder, 'created'],
    );
    $id = (int) db()->lastInsertId();
    // Readable in Flow's dashboard and unique even if a test database is reset.
    $commerceOrder = sprintf('ZS%06d-%s', $id, bin2hex(random_bytes(3)));
    q('UPDATE zero_payments SET commerce_order = ? WHERE id = ?', [$commerceOrder, $id]);

    try {
        [$checkout, $token, $flowOrder] = flow_create_payment([
            'commerceOrder' => $commerceOrder,
            'subject' => "{$plan['name']} · " . PLAN_PERIODS[$period]['label'],
            'currency' => 'CLP',
            'amount' => $amount,
            'email' => $user['email'],
            'paymentMethod' => 9,
            'urlConfirmation' => url('/pagos/flow/confirmacion'),
            'urlReturn' => url('/pagos/flow/retorno'),
            'optional' => json_encode(['plan' => $planKey, 'period' => $period, 'account' => (int) $user['id']]),
            'timeout' => 3600,
        ]);
    } catch (FlowError $err) {
        q("UPDATE zero_payments SET status = 'error', detail = ? WHERE id = ?", [mb_substr($err->getMessage(), 0, 250), $id]);
        throw $err;
    }
    q("UPDATE zero_payments SET status = 'pending', flow_token = ?, flow_order = ? WHERE id = ?", [$token, $flowOrder ?: null, $id]);
    return $checkout;
}

/**
 * Asks Flow for the real status of a payment token and records it. Safe to call any number of times
 * (Flow's confirmation and the buyer's return both land here). Returns the payment row, or null when
 * the token isn't ours.
 */
function settle_payment(string $token): ?array
{
    $payment = q('SELECT * FROM zero_payments WHERE flow_token = ?', [$token])->fetch();
    if (!$payment) {
        return null;
    }
    if ($payment['status'] === 'paid') {
        return $payment;
    }
    $flow = flow_payment_status($token);
    $status = (int) ($flow['status'] ?? 0);
    $matches = (string) ($flow['commerceOrder'] ?? '') === $payment['commerce_order']
        && (int) round((float) ($flow['amount'] ?? 0)) === (int) $payment['amount']
        && strtoupper((string) ($flow['currency'] ?? 'CLP')) === $payment['currency'];

    if ($status === FLOW_PAID && !$matches) {
        error_log("[zero] flow payment {$payment['id']} does not match its order: " . json_encode($flow));
        q("UPDATE zero_payments SET status = 'mismatch', detail = ? WHERE id = ?", [mb_substr(json_encode($flow), 0, 250), $payment['id']]);
    } elseif ($status === FLOW_PAID) {
        apply_payment((int) $payment['id'], (string) ($flow['paymentData']['media'] ?? ''));
    } elseif ($status === FLOW_REJECTED || $status === FLOW_CANCELLED) {
        q('UPDATE zero_payments SET status = ? WHERE id = ? AND status <> ?', [$status === FLOW_REJECTED ? 'rejected' : 'cancelled', $payment['id'], 'paid']);
    }
    return q('SELECT * FROM zero_payments WHERE id = ?', [$payment['id']])->fetch();
}

/** Marks the payment paid and extends the plan, exactly once. */
function apply_payment(int $paymentId, string $media): void
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $payment = q('SELECT * FROM zero_payments WHERE id = ? FOR UPDATE', [$paymentId])->fetch();
        if (!$payment || $payment['status'] === 'paid') {
            $pdo->commit();
            return;
        }
        $userId = (int) $payment['user_id'];
        $plan = zero_plan($payment['plan']);
        $credit = upgrade_credit_seconds($userId, $payment['plan'], $payment['period']);

        $current = q('SELECT ends_at FROM zero_subscriptions WHERE user_id = ? AND plan = ? FOR UPDATE', [$userId, $payment['plan']])->fetchColumn();
        $base = new DateTimeImmutable($current && $current > now_utc() ? "{$current} UTC" : 'now', new DateTimeZone('UTC'));
        $endsAt = $base->add(new DateInterval(PLAN_PERIODS[$payment['period']]['interval']))->modify("+{$credit} seconds");

        // Plans replaced by this one end now; their remaining value is already in $credit.
        foreach (active_subscriptions($userId) as $key => $sub) {
            if (plan_supersedes($plan, zero_plan($key))) {
                q('UPDATE zero_subscriptions SET ends_at = ?, replaced_by = ?, updated_at = ? WHERE user_id = ? AND plan = ?', [now_utc(), $payment['plan'], now_utc(), $userId, $key]);
            }
        }
        q(
            'INSERT INTO zero_subscriptions (user_id, plan, period, amount, started_at, ends_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE started_at = IF(ends_at > VALUES(updated_at), started_at, VALUES(started_at)),
                 period = VALUES(period), amount = VALUES(amount), ends_at = VALUES(ends_at),
                 replaced_by = NULL, updated_at = VALUES(updated_at)',
            [$userId, $payment['plan'], $payment['period'], $payment['amount'], now_utc(), $endsAt->format('Y-m-d H:i:s'), now_utc()],
        );
        q(
            "UPDATE zero_payments SET status = 'paid', paid_at = ?, media = ?, credit_seconds = ?, period_end = ? WHERE id = ?",
            [now_utc(), mb_substr($media, 0, 60) ?: null, $credit, $endsAt->format('Y-m-d H:i:s'), $paymentId],
        );
        $pdo->commit();
    } catch (Throwable $err) {
        $pdo->rollBack();
        throw $err;
    }

    $user = q('SELECT * FROM zero_users WHERE id = ?', [$userId])->fetch();
    try {
        send_mail($user['email'], ...payment_receipt_message($user['name'], $plan['name'], $payment, $endsAt->format('Y-m-d H:i:s')));
    } catch (Throwable $err) {
        error_log('[zero] receipt email: ' . $err->getMessage());
    }
    push_app_plans($user);
}

// ---- Telling the apps ------------------------------------------------------------------

/** The plan claim an app receives (in sign-in tickets and pushes). */
function app_plan_claim(int $userId, string $app): array
{
    $best = app_tier($userId, $app);
    return [
        'tier' => $best['tier'],
        'exp' => $best['ends_at'] ? strtotime($best['ends_at'] . ' UTC') : null,
    ];
}

/** Sends the current paid tier to each app (server to server, signed with the shared secret). */
function push_app_plans(array $user): void
{
    $secret = (string) config('sso_secret');
    if ($secret === '' || !$user['email_verified_at']) {
        return;
    }
    $targets = array_filter([
        'flowdesk' => rtrim((string) config('flowdesk_upstream', ''), '/') . '/api/zero/plan',
        'repeat' => !empty(config('apps', [])['repeat']) ? rtrim(config('apps')['repeat'], '/') . '/zero/plan' : null,
    ], fn ($url) => $url && str_starts_with($url, 'http'));
    foreach ($targets as $app => $endpoint) {
        $body = json_encode(['app' => $app, 'email' => $user['email'], 'iat' => time()] + app_plan_claim((int) $user['id'], $app));
        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'X-Zero-Signature: ' . hash_hmac('sha256', $body, $secret)],
        ]);
        $answer = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        if ($status !== 200) {
            // Not fatal: the next sign-in ticket carries the same plan.
            error_log("[zero] {$app} plan push answered {$status}: " . substr((string) $answer, 0, 200));
        }
    }
}

function payment_history(int $userId): array
{
    return q(
        "SELECT * FROM zero_payments WHERE user_id = ? AND status IN ('paid', 'rejected', 'mismatch')
         ORDER BY created_at DESC LIMIT 24",
        [$userId],
    )->fetchAll();
}
