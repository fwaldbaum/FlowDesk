<?php
/**
 * Catalog of ZERO apps. Each one with a 'url' opens through single sign-on (/abrir/<id>).
 * Adding a product here makes it appear on the site and in every account dashboard.
 */
function zero_apps(): array
{
    $urls = config('apps', []);
    return [
        'flowdesk' => [
            'name' => 'FlowDesk',
            'category' => 'CRM y ventas',
            'summary' => 'Ordena a tus clientes en un tablero, haz seguimiento a tiempo y vende más.',
            'url' => $urls['flowdesk'] ?? null,
            'color' => '#4F46E5',
        ],
    ];
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
    return icon('layout-grid', $size);
}
