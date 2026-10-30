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
        'venu' => [
            'name' => 'Venu',
            'category' => 'Entradas y eventos',
            'summary' => 'Crea la página de tu evento, vende entradas con Flow o Stripe y controla el ingreso con QR.',
            'url' => $urls['venu'] ?? null,
            'color' => '#7C3AED',
            // Venu's own landing page is its product page.
            'page' => $urls['venu'] ?? null,
            'sso_path' => '/auth/zero',
            'login_path' => '/',
        ],
        'pido' => [
            'name' => 'Pido',
            'category' => 'Autoservicio para restaurantes',
            'summary' => 'Tu tótem de pedidos en una tablet: tus clientes piden, pagan con QR y retiran con su número.',
            'url' => $urls['pido'] ?? null,
            'color' => '#FF5A1F',
            // Pido's own landing page is its product page.
            'page' => $urls['pido'] ?? null,
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
    if ($id === 'venu') {
        $gid = 'vn' . bin2hex(random_bytes(3));
        $body = str_replace('vn-', $gid . '-', '<defs> <linearGradient id="vn-l" gradientUnits="userSpaceOnUse" x1="23" y1="20" x2="48" y2="80"><stop offset="0" stop-color="#2563EB"/><stop offset="1" stop-color="#7C3AED"/></linearGradient> <linearGradient id="vn-r" gradientUnits="userSpaceOnUse" x1="77" y1="20" x2="52" y2="80"><stop offset="0" stop-color="#EC4899"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient> <clipPath id="vn-cl"><path clip-rule="evenodd" d="M-10 -10H110V110H-10ZM16.48 20.00a5.0 5.0 0 1 0 10.0 0a5.0 5.0 0 1 0 -10.0 0Z"/></clipPath> <clipPath id="vn-cg"><path clip-rule="evenodd" d="M-10 -10H110V110H-10ZM72.79 13.35L87.30 20.12A10.6 10.6 0 0 1 92.42 34.20L92.42 34.20L71.29 79.52A10.6 10.6 0 0 1 57.21 84.65L57.21 84.65L42.70 77.88A10.6 10.6 0 0 1 37.58 63.80L37.58 63.80L58.71 18.48A10.6 10.6 0 0 1 72.79 13.35Z"/></clipPath> <clipPath id="vn-cr"><path clip-rule="evenodd" d="M-10 -10H110V110H-10ZM73.52 20.00a5.0 5.0 0 1 0 10.0 0a5.0 5.0 0 1 0 -10.0 0Z"/></clipPath> </defs> <g clip-path="url(#vn-cg)"><g clip-path="url(#vn-cl)"><path d="M14.23 23.38L28.73 16.62A7 7 0 0 1 38.03 20.00L38.03 20.00L59.16 65.32A7 7 0 0 1 55.77 74.62L55.77 74.62L41.27 81.38A7 7 0 0 1 31.97 78.00L31.97 78.00L10.84 32.68A7 7 0 0 1 14.23 23.38Z" fill="url(#vn-l)"/></g></g> <g clip-path="url(#vn-cr)"><path d="M71.27 16.62L85.77 23.38A7 7 0 0 1 89.16 32.68L89.16 32.68L68.03 78.00A7 7 0 0 1 58.73 81.38L58.73 81.38L44.23 74.62A7 7 0 0 1 40.84 65.32L40.84 65.32L61.97 20.00A7 7 0 0 1 71.27 16.62Z" fill="url(#vn-r)"/></g>');
        return '<svg width="' . $size . '" height="' . $size . '" viewBox="0 0 100 100" fill="none" aria-hidden="true">' . $body . '</svg>';
    }
    if ($id === 'pido') {
        return '<svg width="' . $size . '" height="' . $size . '" viewBox="0 0 100 100" fill="none" aria-hidden="true"><rect width="100" height="100" rx="24" fill="#FF5A1F"/><path d="M50.2 17.3a25.5 25.5 0 1 1 -9.6 49.1L29.6 78.9c-1.9 1.9-5.2.6-5.2-2.1V42.8a25.8 25.8 0 0 1 25.8-25.5Z" fill="#fff"/><circle cx="50.2" cy="43" r="13.6" fill="#FF5A1F"/><path d="M40.2 50.6 37.8 57.4c-.2.6.3 1 .9.8l6.9-2.4Z" fill="#FF5A1F" stroke="#FF5A1F" stroke-width="1" stroke-linejoin="round"/><circle cx="50.2" cy="42.6" r="4.5" stroke="#fff" stroke-width="2.6"/><path d="M45.5 49.2a8.1 8.1 0 1 1 9.4 0" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/></svg>';
    }
    return icon('layout-grid', $size);
}
