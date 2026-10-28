<?php
declare(strict_types=1);

/**
 * Mercado Pago Checkout Pro. A purchase creates a "preference" (what is being sold and where to come back) and
 * the buyer pays on Mercado Pago's page. We never trust what the browser or the notice says: every payment is
 * fetched again from the API with our Access Token before a plan is activated.
 * Docs: https://www.mercadopago.cl/developers/es/docs/checkout-pro
 */

/** getCode() is Mercado Pago's HTTP status (0 when it couldn't be reached); getMessage() is its own message. */
final class MercadoPagoError extends RuntimeException
{
}

function mp_config(): array
{
    $c = config('mercadopago', []) + ['access_token' => '', 'webhook_secret' => '', 'api_url' => ''];
    // Pasted keys often carry spaces or line breaks.
    $c['access_token'] = preg_replace('/\s+/', '', (string) $c['access_token']);
    $c['webhook_secret'] = preg_replace('/\s+/', '', (string) $c['webhook_secret']);
    $c['api_url'] = rtrim((string) ($c['api_url'] ?: 'https://api.mercadopago.com'), '/');
    $c['test'] = str_starts_with($c['access_token'], 'TEST-');
    return $c;
}

function mp_enabled(): bool
{
    return mp_config()['access_token'] !== '' && function_exists('curl_init');
}

function mp_call(string $method, string $path, ?array $body = null): array
{
    $c = mp_config();
    $headers = ['Authorization: Bearer ' . $c['access_token'], 'Accept: application/json'];
    $ch = curl_init($c['api_url'] . $path);
    $options = [CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_TIMEOUT => 30];
    if ($method === 'POST') {
        $headers[] = 'Content-Type: application/json';
        $headers[] = 'X-Idempotency-Key: ' . bin2hex(random_bytes(16));
        $options[CURLOPT_POST] = true;
        $options[CURLOPT_POSTFIELDS] = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    curl_setopt_array($ch, $options + [CURLOPT_HTTPHEADER => $headers]);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $netError = $raw === false ? curl_error($ch) : '';
    curl_close($ch);

    if ($raw === false) {
        throw new MercadoPagoError("sin conexión ({$netError})", 0);
    }
    $data = json_decode((string) $raw, true);
    if ($status < 200 || $status >= 300 || !is_array($data)) {
        $detail = is_array($data) ? ($data['message'] ?? $data['error'] ?? '') : substr((string) $raw, 0, 200);
        throw new MercadoPagoError(trim("{$path} {$status} {$detail}"), $status);
    }
    return $data;
}

/** Creates the checkout; returns [preference id, URL of Mercado Pago's payment page]. */
function mp_create_preference(array $preference): array
{
    $data = mp_call('POST', '/checkout/preferences', $preference);
    if (empty($data['id']) || empty($data['init_point'])) {
        throw new MercadoPagoError('checkout/preferences sin init_point', 200);
    }
    return [(string) $data['id'], (string) $data['init_point']];
}

function mp_payment(string $id): array
{
    if (!preg_match('/^\d{1,20}$/', $id)) {
        throw new MercadoPagoError('id de pago inválido', 400);
    }
    return mp_call('GET', '/v1/payments/' . $id);
}

/**
 * Checks the x-signature header of a notice: "ts=<time>,v1=<hmac>", where v1 is the HMAC-SHA256 (with the secret
 * of "Webhooks" in the Mercado Pago app) of "id:<data.id>;request-id:<x-request-id>;ts:<ts>;". With no secret
 * configured every notice is accepted, which is still safe because payments are always re-read from the API.
 */
function mp_signature_ok(string $dataId, string $requestId, string $header): bool
{
    $secret = mp_config()['webhook_secret'];
    if ($secret === '') {
        return true;
    }
    $parts = [];
    foreach (explode(',', $header) as $piece) {
        [$k, $v] = array_map('trim', explode('=', $piece, 2) + [1 => '']);
        $parts[$k] = $v;
    }
    if (empty($parts['ts']) || empty($parts['v1'])) {
        return false;
    }
    $manifest = ($dataId !== '' ? 'id:' . (ctype_alnum($dataId) ? strtolower($dataId) : $dataId) . ';' : '')
        . ($requestId !== '' ? "request-id:{$requestId};" : '')
        . "ts:{$parts['ts']};";
    return hash_equals(hash_hmac('sha256', $manifest, $secret), $parts['v1']);
}

/** How the buyer paid, for the receipt: "Tarjeta de crédito visa". */
function mp_media(array $payment): string
{
    $type = [
        'credit_card' => 'Tarjeta de crédito', 'debit_card' => 'Tarjeta de débito', 'prepaid_card' => 'Tarjeta prepago',
        'account_money' => 'Dinero en Mercado Pago', 'bank_transfer' => 'Transferencia', 'ticket' => 'Pago en efectivo',
    ][$payment['payment_type_id'] ?? ''] ?? 'Mercado Pago';
    $method = (string) ($payment['payment_method_id'] ?? '');
    return trim($type . ($method !== '' && $method !== 'account_money' ? ' ' . $method : ''));
}

/** What to tell the person when Mercado Pago refuses or can't be reached, with its own detail for support. */
function mp_problem(MercadoPagoError $err): string
{
    $hint = match (true) {
        $err->getCode() === 0 => 'No pudimos conectar con Mercado Pago. Inténtalo de nuevo en unos minutos.',
        in_array($err->getCode(), [401, 403], true) => 'Mercado Pago no aceptó las credenciales de la tienda: revisa el access_token en config.php.',
        default => 'Mercado Pago no pudo crear el pago.',
    };
    return $hint . ' Detalle: ' . mb_substr($err->getMessage(), 0, 160);
}
