<?php
declare(strict_types=1);

/**
 * Serves FlowDesk at zerosolutions.cl/flowdesk. The hosting can't run Node, so every request under the
 * prefix is forwarded to FlowDesk's deployment (method, headers, body, cookies) and the answer comes back
 * with root-relative paths moved under the prefix: Location headers and the app's index.html.
 * With the shared secret, FlowDesk trusts the visitor IP and public URL this proxy reports.
 */
function proxy_flowdesk(string $prefix): never
{
    $upstream = rtrim((string) config('flowdesk_upstream', ''), '/');
    if ($upstream === '' || !function_exists('curl_init')) {
        http_response_code(503);
        exit('FlowDesk no está disponible en este momento.');
    }

    $uri = $_SERVER['REQUEST_URI'] ?? $prefix;
    $rest = substr($uri, strlen($prefix));
    if ($rest === '' || $rest[0] === '?') {
        header('Location: ' . $prefix . '/' . $rest, true, 301);
        exit;
    }

    $skip = ['host', 'connection', 'content-length', 'accept-encoding', 'te', 'upgrade', 'keep-alive',
        'proxy-connection', 'transfer-encoding', 'expect', 'x-forwarded-for', 'x-forwarded-host',
        'x-forwarded-proto', 'x-real-ip', 'cookie'];
    $headers = [];
    foreach (getallheaders() as $name => $value) {
        $lower = strtolower((string) $name);
        if (in_array($lower, $skip, true) || str_starts_with($lower, 'x-zero-')) {
            continue;
        }
        $headers[] = "{$name}: {$value}";
    }
    // Forward FlowDesk's cookies only; the ZERO session stays on this server.
    $cookies = array_filter(
        array_map('trim', explode(';', (string) ($_SERVER['HTTP_COOKIE'] ?? ''))),
        fn (string $c) => $c !== '' && !str_starts_with($c, 'zero_sid='),
    );
    if ($cookies) {
        $headers[] = 'Cookie: ' . implode('; ', $cookies);
    }
    $host = preg_replace('/[^a-z0-9.-]/i', '', explode(':', (string) ($_SERVER['HTTP_HOST'] ?? ''))[0]);
    $headers[] = 'X-Zero-Host: ' . ($host ?: 'zerosolutions.cl');
    $headers[] = 'X-Zero-Prefix: ' . $prefix;
    $headers[] = 'X-Zero-Client-IP: ' . client_ip();
    if ($secret = (string) config('sso_secret')) {
        $headers[] = 'X-Zero-Proxy: ' . $secret;
    }
    $headers[] = 'Expect:';

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $responseHeaders = [];
    $ch = curl_init($upstream . $rest);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_ENCODING => '', // accept compressed answers; curl hands back the decoded body
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_HEADERFUNCTION => function ($ch, string $line) use (&$responseHeaders): int {
            if (str_starts_with($line, 'HTTP/')) {
                $responseHeaders = []; // keep only the final response (skips "100 Continue")
            } elseif (trim($line) !== '') {
                $responseHeaders[] = rtrim($line, "\r\n");
            }
            return strlen($line);
        },
    ]);
    if ($method === 'HEAD') {
        curl_setopt($ch, CURLOPT_NOBODY, true);
    } elseif ($method !== 'GET') {
        curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
    }
    $body = curl_exec($ch);
    if ($body === false) {
        error_log('[zero] flowdesk proxy: ' . curl_error($ch));
        http_response_code(502);
        exit('No pudimos conectar con FlowDesk. Inténtalo de nuevo en unos segundos.');
    }
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $type = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    http_response_code($status);
    $drop = ['content-length', 'content-encoding', 'transfer-encoding', 'connection', 'keep-alive'];
    foreach ($responseHeaders as $line) {
        [$name, $value] = array_map('trim', explode(':', $line, 2) + [1 => '']);
        $lower = strtolower($name);
        if (in_array($lower, $drop, true)) {
            continue;
        }
        if ($lower === 'location') {
            $value = flowdesk_location($value, $upstream, $prefix);
        }
        header("{$name}: {$value}", $lower !== 'set-cookie');
    }

    if (str_contains($type, 'text/html') && is_string($body)) {
        $body = flowdesk_html($body, $prefix);
    }
    header('Content-Length: ' . strlen((string) $body));
    echo $body;
    exit;
}

/** Keeps redirects inside the prefix: upstream URLs and root paths both land under /flowdesk. */
function flowdesk_location(string $location, string $upstream, string $prefix): string
{
    if (str_starts_with($location, $upstream)) {
        $location = substr($location, strlen($upstream)) ?: '/';
    }
    if (str_starts_with($location, '/') && !str_starts_with($location, '//')
        && $location !== $prefix && !str_starts_with($location, $prefix . '/')) {
        return $prefix . $location;
    }
    return $location;
}

/** The app's index.html: tell it its base path and move root-relative asset URLs under the prefix. */
function flowdesk_html(string $html, string $prefix): string
{
    $html = preg_replace('/\b(src|href)="\/(?!\/)/', '$1="' . $prefix . '/', $html) ?? $html;
    $script = '<script>window.__FD_BASE__=' . json_encode($prefix, JSON_UNESCAPED_SLASHES) . '</script>';
    return preg_replace('/<head([^>]*)>/i', '<head$1>' . $script, $html, 1) ?? $html;
}
