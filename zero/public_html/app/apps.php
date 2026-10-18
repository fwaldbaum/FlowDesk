<?php
/**
 * Catalog of ZERO apps. Each one with a 'url' opens through single sign-on (/abrir/<id>).
 * Adding a product here makes it appear on the site and in every account dashboard.
 */
function zero_apps(): array
{
    $urls = config('apps', []);
    // An app shows up on the site and in accounts only once its address is set in config.php.
    return array_filter([
        'flowdesk' => [
            'name' => 'FlowDesk',
            'category' => 'CRM y ventas',
            'summary' => 'Ordena a tus clientes en un tablero, haz seguimiento a tiempo y vende más.',
            'url' => $urls['flowdesk'] ?? null,
            'color' => '#4F46E5',
            'page' => '/productos/flowdesk',
            'sso_path' => '/api/auth/zero',
            'login_path' => '/login',
        ],
        'repeat' => [
            'name' => 'Repeat',
            'category' => 'Fidelización',
            'summary' => 'Tarjetas de sellos digitales en el celular de tus clientes, para que vuelvan una y otra vez.',
            'url' => $urls['repeat'] ?? null,
            'color' => '#5B3FE0',
            // Repeat's own landing page is its product page.
            'page' => $urls['repeat'] ?? null,
            'sso_path' => '/auth/zero',
            'login_path' => '/',
        ],
    ], fn (array $app) => !empty($app['url']));
}

function zero_app(string $id): ?array
{
    return zero_apps()[$id] ?? null;
}

/** Brand mark for an app tile. */
function app_mark(string $id, int $size = 28): string
{
    if ($id === 'flowdesk') {
        $gid = 'fd' . bin2hex(random_bytes(3));
        return '<svg width="' . $size . '" height="' . $size . '" viewBox="0 0 32 32" fill="none" aria-hidden="true"><defs><linearGradient id="' . $gid . '" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#3B82F6"/><stop offset="1" stop-color="#6366F1"/></linearGradient></defs><g stroke="url(#' . $gid . ')" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 26V13a7 7 0 0 1 7-7h5"/><path d="M5 16.5h7.5"/><path d="M17 6a10 10 0 0 1 0 20h-4.5V12"/></g></svg>';
    }
    if ($id === 'repeat') {
        $gid = 'rp' . bin2hex(random_bytes(3));
        $body = str_replace('rp-g', $gid, '<defs> <linearGradient id="rp-g" x1="14" y1="10" x2="86" y2="92" gradientUnits="userSpaceOnUse"> <stop stop-color="#2563EB"/><stop offset="1" stop-color="#5B3FE0"/> </linearGradient> </defs> <path d="M85.23 36.76 A38 38 0 1 1 60.47 14.47" stroke="url(#rp-g)" stroke-width="9" stroke-linecap="round"/> <path d="M71.05 17.50 L62.13 5.06 L56.89 23.33 Z" fill="url(#rp-g)" stroke="url(#rp-g)" stroke-width="3" stroke-linejoin="round"/> <path d="M55.49 30.52 Q63.44 27.72 64.99 36.01 Q73.28 37.56 70.48 45.51 Q76.88 51.00 70.48 56.49 Q73.28 64.44 64.99 65.99 Q63.44 74.28 55.49 71.48 Q50.00 77.88 44.51 71.48 Q36.56 74.28 35.01 65.99 Q26.72 64.44 29.52 56.49 Q23.12 51.00 29.52 45.51 Q26.72 37.56 35.01 36.01 Q36.56 27.72 44.51 30.52 Q50.00 24.12 55.49 30.52Z" fill="url(#rp-g)"/> <circle cx="50" cy="51" r="13.5" fill="none" stroke="#fff" stroke-width="3.6"/> <path d="M41.5 51.5l6 6L80 22" stroke="#fff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/> <path d="M41.5 51.5l6 6L80 22" stroke="url(#rp-g)" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>');
        return '<svg width="' . $size . '" height="' . $size . '" viewBox="0 0 100 100" fill="none" aria-hidden="true">' . $body . '</svg>';
    }
    return icon('layout-grid', $size);
}
