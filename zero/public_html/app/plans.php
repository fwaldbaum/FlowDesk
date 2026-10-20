<?php
declare(strict_types=1);

/**
 * Paid plans sold at /precios, in CLP with IVA included. 'covers' maps each app to the tier the plan
 * unlocks there; a plan that covers everything another plan covers, at a higher rank, replaces it
 * (the time left on the old plan turns into extra days on the new one).
 */
const PLAN_PERIODS = [
    'month' => ['label' => 'Mensual', 'unit' => 'mes', 'interval' => 'P1M', 'days' => 30],
    'year' => ['label' => 'Anual', 'unit' => 'año', 'interval' => 'P1Y', 'days' => 365],
];

const APP_TIERS = ['free' => 0, 'pro' => 1, 'max' => 2];

function zero_plans(): array
{
    return [
        'flowdesk_pro' => [
            'app' => 'flowdesk',
            'name' => 'FlowDesk Pro',
            'tagline' => 'Para emprendedores que venden todos los días.',
            'rank' => 1,
            'covers' => ['flowdesk' => 'pro'],
            'price' => ['month' => 5990, 'year' => 59900],
            'features' => [
                'Hasta 3 usuarios',
                'Leads ilimitados',
                'Importar y exportar contactos (CSV)',
                'Webhook e integraciones con anuncios y formularios',
                'Formulario web y WhatsApp con plantilla',
            ],
        ],
        'flowdesk_max' => [
            'app' => 'flowdesk',
            'name' => 'FlowDesk Max',
            'tagline' => 'Para empresas con equipo de ventas.',
            'rank' => 2,
            'covers' => ['flowdesk' => 'max'],
            'price' => ['month' => 19990, 'year' => 199900],
            'featured' => true,
            'features' => [
                'Todo lo de Pro',
                'Hasta 15 usuarios',
                'Soporte prioritario por correo y WhatsApp',
                'Ayuda para conectar tus integraciones',
                'Acceso anticipado a reportes y automatizaciones',
            ],
        ],
        'repeat_pro' => [
            'app' => 'repeat',
            'name' => 'Repeat Pro',
            'tagline' => 'Tarjetas de sellos con tu marca y herramientas para que vuelvan más.',
            'rank' => 1,
            'covers' => ['repeat' => 'pro'],
            'price' => ['month' => 6990, 'year' => 69900],
            // Launch offer: the regular price, shown crossed out.
            'list_price' => ['month' => 14990, 'year' => 149900],
            'offer' => 'Oferta de lanzamiento',
            'features' => [
                'Sin el logo de Repeat en tus tarjetas',
                'Ícono de sello a tu medida',
                'Regalo de cumpleaños automático',
                'Horas de sellos dobles',
                'Trae a un amigo: ambos ganan sellos',
                'Exportar clientes a Excel',
            ],
        ],
        'venu_pro' => [
            'app' => 'venu',
            'name' => 'Venu Pro',
            'tagline' => 'Tus eventos con tu dominio, tu marca y más correos.',
            'rank' => 1,
            'covers' => ['venu' => 'pro'],
            'price' => ['month' => 5990, 'year' => 59900],
            // Launch offer: the regular price, shown crossed out.
            'list_price' => ['month' => 22990, 'year' => 229900],
            'offer' => 'Oferta de lanzamiento',
            'features' => [
                'Tu propio dominio',
                'Hasta 500 correos al día',
                'Sin la marca de Venu',
                'Galería, video, cuenta regresiva y preguntas',
                'Eventos ilimitados',
                'Exportar asistentes',
            ],
        ],
        'zero_plus' => [
            'app' => 'zero',
            'name' => 'ZERO Plus',
            'tagline' => 'Todas las aplicaciones de ZERO en una sola suscripción.',
            'rank' => 3,
            'covers' => ['flowdesk' => 'max', '*' => 'max'],
            'price' => ['month' => 29990, 'year' => 299900],
            'features' => [
                'FlowDesk Max, Repeat Pro y Venu Pro incluidos',
                'Cada aplicación nueva de ZERO, sin pagar aparte',
                'Usuarios ilimitados',
                'Sesión de configuración inicial con nuestro equipo',
                'Soporte prioritario',
            ],
        ],
    ];
}

function zero_plan(string $key): ?array
{
    return zero_plans()[$key] ?? null;
}

/** "$5.990" */
function clp(int $amount): string
{
    return '$' . number_format($amount, 0, ',', '.');
}

/** Tier a plan unlocks in an app ('free' when it doesn't cover it). */
function plan_tier(array $plan, string $app): string
{
    return $plan['covers'][$app] ?? $plan['covers']['*'] ?? 'free';
}

/** True when $new makes $old unnecessary: higher rank and at least the same tier in every app $old covers. */
function plan_supersedes(array $new, array $old): bool
{
    if ($new['rank'] <= $old['rank']) {
        return false;
    }
    foreach ($old['covers'] as $app => $tier) {
        if ((APP_TIERS[plan_tier($new, $app)] ?? 0) < (APP_TIERS[$tier] ?? 0)) {
            return false;
        }
    }
    return true;
}

/** Monthly equivalent of the yearly price and the saving against paying 12 months. */
function yearly_saving(array $plan): array
{
    $monthly = $plan['price']['month'];
    $yearly = $plan['price']['year'];
    return [
        'per_month' => (int) round($yearly / 12),
        'percent' => (int) round((1 - $yearly / ($monthly * 12)) * 100),
    ];
}
