<?php
declare(strict_types=1);

/**
 * Flow (flow.cl) payment API v3. Every call is signed: parameters sorted by name, concatenated as
 * name+value, HMAC-SHA256 with the secret key, sent as "s". Docs: https://developers.flow.cl/api
 */
const FLOW_PENDING = 1;
const FLOW_PAID = 2;
const FLOW_REJECTED = 3;
const FLOW_CANCELLED = 4;

/** getCode() is Flow's HTTP status (0 when Flow couldn't be reached); getMessage() is Flow's own message. */
final class FlowError extends RuntimeException
{
}

function flow_config(): array
{
    $c = config('flow', []) + ['api_key' => '', 'secret_key' => '', 'sandbox' => true, 'api_url' => ''];
    // Pasted keys often carry spaces or line breaks, and 'false' typed in quotes would read as true.
    $c['api_key'] = preg_replace('/\s+/', '', (string) $c['api_key']);
    $c['secret_key'] = preg_replace('/\s+/', '', (string) $c['secret_key']);
    $c['sandbox'] = filter_var($c['sandbox'], FILTER_VALIDATE_BOOLEAN);
    $c['api_url'] = rtrim((string) ($c['api_url'] ?: ($c['sandbox'] ? 'https://sandbox.flow.cl/api' : 'https://www.flow.cl/api')), '/');
    return $c;
}

function flow_enabled(): bool
{
    $c = flow_config();
    return $c['api_key'] !== '' && $c['secret_key'] !== '' && function_exists('curl_init');
}

function flow_sign(array $params, string $secret): string
{
    ksort($params, SORT_STRING);
    $data = '';
    foreach ($params as $name => $value) {
        $data .= $name . $value;
    }
    return hash_hmac('sha256', $data, $secret);
}

function flow_call(string $method, string $service, array $params): array
{
    $c = flow_config();
    $params['apiKey'] = $c['api_key'];
    $params['s'] = flow_sign($params, $c['secret_key']);

    $url = "{$c['api_url']}/{$service}";
    $ch = curl_init($method === 'GET' ? $url . '?' . http_build_query($params) : $url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    }
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $netError = $body === false ? curl_error($ch) : '';
    curl_close($ch);

    if ($body === false) {
        throw new FlowError("sin conexión ({$netError})", 0);
    }
    $data = json_decode((string) $body, true);
    if ($status !== 200 || !is_array($data)) {
        $detail = is_array($data) ? ($data['message'] ?? '') : substr((string) $body, 0, 200);
        throw new FlowError(trim("{$service} {$status} {$detail}"), $status);
    }
    return $data;
}

/** Creates the payment order; returns [checkout URL, token, flowOrder]. */
function flow_create_payment(array $order): array
{
    $data = flow_call('POST', 'payment/create', $order);
    if (empty($data['url']) || empty($data['token'])) {
        throw new FlowError('payment/create sin url de pago', 200);
    }
    return [$data['url'] . '?token=' . rawurlencode($data['token']), (string) $data['token'], (int) ($data['flowOrder'] ?? 0)];
}

function flow_payment_status(string $token): array
{
    return flow_call('GET', 'payment/getStatus', ['token' => $token]);
}

/** What to tell the person when Flow refuses or can't be reached, with Flow's own detail for support. */
function flow_problem(FlowError $err): string
{
    $hint = match (true) {
        $err->getCode() === 0 => 'No pudimos conectar con Flow. Inténtalo de nuevo en unos minutos.',
        $err->getCode() === 401 => 'Flow no aceptó las claves de la tienda: revisa api_key, secret_key y sandbox en config.php.',
        default => 'Flow rechazó el pago.',
    };
    return $hint . ' Detalle: ' . mb_substr($err->getMessage(), 0, 160);
}
