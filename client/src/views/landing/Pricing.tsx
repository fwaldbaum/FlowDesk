import { ArrowRight, Check } from 'lucide-react';
import clsx from 'clsx';
import { Reveal } from '../../components/motion';
import { money } from '../../lib/format';
import { PLAN_LIMITS, PLAN_PRICES } from '../../lib/plans';
import { ZERO_PRICING_URL } from '../../lib/zero';
import { ClickSpark } from './fx';
import { CtaLink, SectionHeading, spotlightHandlers, usePrimaryCta } from './shared';

export function Pricing() {
  const cta = usePrimaryCta();
  const plans = [
    {
      name: 'Gratis',
      tagline: 'Para empezar a ordenar tus contactos.',
      price: '$0',
      per: 'para siempre',
      note: null as string | null,
      features: ['1 usuario', `Hasta ${PLAN_LIMITS.free.leads} leads`, 'Tablero, vista Hoy y notas', 'Formulario web y WhatsApp'],
      action: { to: cta.to, label: cta.to === '/app' ? 'Ir al tablero' : 'Crear cuenta gratis', external: false },
      featured: false,
    },
    {
      name: 'Pro',
      tagline: 'Para emprendedores que venden todos los días.',
      price: money(PLAN_PRICES.pro.month),
      per: '/ mes',
      note: `o ${money(PLAN_PRICES.pro.year)} al año`,
      features: [`Hasta ${PLAN_LIMITS.pro.users} usuarios`, 'Leads ilimitados', 'Importar y exportar contactos (CSV)', 'Webhook e integraciones con anuncios y formularios', 'WhatsApp con tu propia plantilla'],
      action: { to: ZERO_PRICING_URL, label: 'Elegir Pro', external: true },
      featured: false,
    },
    {
      name: 'Max',
      tagline: 'Para empresas con equipo de ventas.',
      price: money(PLAN_PRICES.max.month),
      per: '/ mes',
      note: `o ${money(PLAN_PRICES.max.year)} al año`,
      features: ['Todo lo de Pro', `Hasta ${PLAN_LIMITS.max.users} usuarios`, 'Soporte prioritario por correo y WhatsApp', 'Ayuda para conectar tus integraciones'],
      action: { to: ZERO_PRICING_URL, label: 'Elegir Max', external: true },
      featured: true,
    },
  ];

  return (
    <section id="precios" className="scroll-mt-16 border-t border-line/60 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Precios"
          title="Empieza gratis y crece cuando lo necesites"
          body="Precios en pesos chilenos con IVA incluido. Los planes se pagan con Mercado Pago desde tu cuenta ZERO, sin renovación automática."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.08}>
              <div
                className={clsx(
                  'relative flex h-full flex-col rounded-2xl border bg-surface/60 p-6 md:p-7',
                  plan.featured ? 'star-border border-transparent bg-surface' : 'border-line',
                )}
                {...spotlightHandlers()}
              >
                <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(320px_circle_at_var(--mx,-999px)_var(--my,-999px),rgba(99,102,241,0.12),transparent_70%)]" />
                {plan.featured && (
                  <span className="absolute -top-3 right-6 rounded-full border border-line-strong bg-raised px-2.5 py-0.5 text-[11px] font-medium text-accent-soft">
                    Para equipos
                  </span>
                )}
                <h3 className="text-lg font-semibold text-fg">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-[-0.03em] text-fg">{plan.price}</span>
                  <span className="text-sm text-subtle">{plan.per}</span>
                </div>
                <p className="mt-1 h-5 text-xs text-subtle">{plan.note}</p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm text-muted">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check size={16} className="mt-0.5 shrink-0 text-accent-soft" /> {f}
                    </li>
                  ))}
                </ul>
                <ClickSpark className="mt-7">
                  {plan.action.external ? (
                    <a
                      href={plan.action.to}
                      className={clsx(
                        'group inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all active:scale-[0.98]',
                        plan.featured ? 'bg-accent text-white hover:bg-accent-hover' : 'border border-line bg-surface/80 text-fg hover:border-line-strong hover:bg-raised',
                      )}
                    >
                      {plan.action.label} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </a>
                  ) : (
                    <CtaLink to={plan.action.to} variant="secondary" className="w-full">{plan.action.label}</CtaLink>
                  )}
                </ClickSpark>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
