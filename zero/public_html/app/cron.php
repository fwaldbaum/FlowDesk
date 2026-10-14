<?php
declare(strict_types=1);

/**
 * Daily tasks. cPanel > Cron Jobs, once a day:
 *   php /home/<cuenta>/public_html/app/cron.php
 * Emails a renewal reminder 5 days before a plan ends (once per end date).
 */
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require __DIR__ . '/bootstrap.php';

$due = q(
    'SELECT s.*, u.name, u.email FROM zero_subscriptions s JOIN zero_users u ON u.id = s.user_id
      WHERE s.ends_at > ? AND s.ends_at <= ? AND s.replaced_by IS NULL
        AND (s.reminded_for IS NULL OR s.reminded_for <> s.ends_at)',
    [now_utc(), now_utc(5 * 86400)],
)->fetchAll();

foreach ($due as $sub) {
    $plan = zero_plan($sub['plan']);
    if (!$plan) {
        continue;
    }
    $link = url('/cuenta/plan?plan=' . rawurlencode($sub['plan']) . '&periodo=' . ($sub['period'] === 'year' ? 'anual' : 'mes'));
    if (send_mail($sub['email'], ...renewal_reminder_message($sub['name'], $plan['name'], $sub['ends_at'], $link))) {
        q('UPDATE zero_subscriptions SET reminded_for = ends_at WHERE user_id = ? AND plan = ?', [$sub['user_id'], $sub['plan']]);
    }
}
echo count($due) . " recordatorio(s)\n";
