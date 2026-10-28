<?php
declare(strict_types=1);

// Local stand-in for Mercado Pago (Checkout Pro) to test ZERO without an account:
//   php -S 127.0.0.1:9191 zero/tools/mpmock/index.php
// with 'mercadopago' => ['access_token' => 'TEST-mock', 'webhook_secret' => 'mock-secret', 'api_url' => 'http://127.0.0.1:9191']

const TOKEN = 'TEST-mock';
const SECRET = 'mock-secret';
$store = __DIR__ . '/data.json';
$db = is_file($store) ? json_decode((string) file_get_contents($store), true) : ['prefs' => [], 'payments' => [], 'next' => 1000000001];
$save = function () use (&$db, $store) {
    file_put_contents($store, json_encode($db, JSON_PRETTY_PRINT));
};
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$json = function (int $status, array $data) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
};
$authed = fn () => ($_SERVER['HTTP_AUTHORIZATION'] ?? '') === 'Bearer ' . TOKEN;

if ($path === '/checkout/preferences' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$authed()) {
        $json(401, ['message' => 'invalid access token', 'status' => 401]);
    }
    $pref = json_decode((string) file_get_contents('php://input'), true);
    $id = 'pref-' . bin2hex(random_bytes(6));
    $db['prefs'][$id] = $pref;
    $save();
    $json(201, ['id' => $id, 'init_point' => 'http://127.0.0.1:9191/checkout?pref=' . $id]);
}

if (preg_match('#^/v1/payments/(\d+)$#', $path, $m)) {
    if (!$authed()) {
        $json(401, ['message' => 'invalid access token', 'status' => 401]);
    }
    isset($db['payments'][$m[1]]) ? $json(200, $db['payments'][$m[1]]) : $json(404, ['message' => 'Payment not found']);
}

if ($path === '/checkout' && isset($db['prefs'][$_GET['pref'] ?? ''])) {
    $pref = $db['prefs'][$_GET['pref']];
    $item = $pref['items'][0];
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><title>Mercado Pago (simulado)</title><body style="font-family:sans-serif;max-width:420px;margin:40px auto">'
        . '<h1>Mercado Pago (simulado)</h1><p>' . htmlspecialchars($item['title']) . '</p><p><b>$' . number_format($item['unit_price'], 0, ',', '.') . ' ' . $item['currency_id'] . '</b></p>'
        . '<form method="post" action="/checkout/pay"><input type="hidden" name="pref" value="' . htmlspecialchars($_GET['pref']) . '">'
        . '<button name="result" value="approved">Pagar con tarjeta (aprobado)</button> <button name="result" value="rejected">Pagar (rechazado)</button> '
        . '<button name="result" value="tamper">Pagar monto alterado</button></form>'
        . '<p><a href="' . htmlspecialchars($pref['back_urls']['failure'] . '?collection_id=null&collection_status=null&payment_id=null&status=null&external_reference=' . rawurlencode($pref['external_reference']) . '&preference_id=' . $_GET['pref']) . '">Volver al sitio sin pagar</a></p>';
    exit;
}

if ($path === '/checkout/pay' && isset($db['prefs'][$_POST['pref'] ?? ''])) {
    $pref = $db['prefs'][$_POST['pref']];
    $result = (string) $_POST['result'];
    $id = (string) $db['next']++;
    $db['payments'][$id] = [
        'id' => (int) $id,
        'status' => $result === 'rejected' ? 'rejected' : 'approved',
        'status_detail' => $result === 'rejected' ? 'cc_rejected_insufficient_amount' : 'accredited',
        'external_reference' => $pref['external_reference'],
        'transaction_amount' => $pref['items'][0]['unit_price'] - ($result === 'tamper' ? 1000 : 0),
        'currency_id' => $pref['items'][0]['currency_id'],
        'payment_type_id' => 'credit_card',
        'payment_method_id' => 'visa',
    ];
    $save();
    // Signed webhook, like Mercado Pago: x-signature over "id:<id>;request-id:<rid>;ts:<ts>;".
    $rid = bin2hex(random_bytes(8));
    $ts = (string) time();
    $sig = hash_hmac('sha256', "id:{$id};request-id:{$rid};ts:{$ts};", SECRET);
    $ch = curl_init($pref['notification_url'] . (str_contains($pref['notification_url'], '?') ? '&' : '?') . 'data.id=' . $id . '&type=payment');
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20,
        CURLOPT_POSTFIELDS => json_encode(['action' => 'payment.created', 'type' => 'payment', 'data' => ['id' => $id]]),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', "x-request-id: {$rid}", "x-signature: ts={$ts},v1={$sig}"]]);
    $answer = curl_exec($ch);
    file_put_contents(__DIR__ . '/webhooks.log', date('c') . " {$id} -> " . curl_getinfo($ch, CURLINFO_RESPONSE_CODE) . " {$answer}\n", FILE_APPEND);
    curl_close($ch);
    $status = $db['payments'][$id]['status'];
    $back = $pref['back_urls'][$status === 'approved' ? 'success' : 'failure'];
    header('Location: ' . $back . '?collection_id=' . $id . '&collection_status=' . $status . '&payment_id=' . $id . '&status=' . $status
        . '&external_reference=' . rawurlencode($pref['external_reference']) . '&payment_type=credit_card&preference_id=' . $_POST['pref'], true, 302);
    exit;
}

$json(404, ['message' => 'not found']);
