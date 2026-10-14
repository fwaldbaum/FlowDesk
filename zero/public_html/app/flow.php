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

final class FlowError extends RuntimeException
{
}

function flow_config(): array
{
    $c = config('flow', []) + ['api_key' => '', 'secret_key' => '', 'sandbox' => true, 'api_url' => ''];
    $c['api_key'] = trim((string) $c['api_key']);
    $c['secret_key'] = trim((string) $c['secret_key']);
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
        throw new FlowError("No pudimos conectar con Flow ({$netError}).");
    }
    $data = json_decode((string) $body, true);
    if ($status !== 200 || !is_array($data)) {
        $detail = is_array($data) ? ($data['message'] ?? '') : substr((string) $body, 0, 200);
        throw new FlowError("Flow respondió {$status} en {$service}: {$detail}");
    }
    return $data;
}

/** Creates the payment order; returns [checkout URL, token, flowOrder]. */
function flow_create_payment(array $order): array
{
    $data = flow_call('POST', 'payment/create', $order);
    if (empty($data['url']) || empty($data['token'])) {
        throw new FlowError('Flow no devolvió la dirección de pago.');
    }
    return [$data['url'] . '?token=' . rawurlencode($data['token']), (string) $data['token'], (int) ($data['flowOrder'] ?? 0)];
}

function flow_payment_status(string $token): array
{
    return flow_call('GET', 'payment/getStatus', ['token' => $token]);
}
