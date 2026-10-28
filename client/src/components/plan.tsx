import { useEffect, type ReactNode } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ExternalLink, Lock, Sparkles, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api';
import { PLAN_LIMITS, PLAN_NAMES } from '../lib/plans';
import { ZERO_PRICING_URL } from '../lib/zero';
import type { Plan } from '../lib/types';
import { useStore } from '../store/AppStore';
import { dialogMotion, overlayMotion } from './motion';
import { IconButton } from './ui';

export function usePlan() {
  const { user } = useAuth();
  const plan: Plan = user?.plan ?? 'free';
  return { plan, paid: plan !== 'free', limits: PLAN_LIMITS[plan] };
}

/** The server answers 402 PLAN_REQUIRED when the plan doesn't include something. */
export const isPlanError = (err: unknown): err is ApiError =>
  err instanceof ApiError && err.code === 'PLAN_REQUIRED';

export function PlanBadge({ plan, className }: { plan: Plan; className?: string }) {
  if (plan === 'free') return null;
  return (
    <span
      title={`FlowDesk ${PLAN_NAMES[plan]}`}
      className={clsx(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase leading-4 tracking-wide',
        plan === 'max' ? 'bg-accent text-white' : 'border border-accent/40 bg-accent/10 text-accent-soft',
        className,
      )}
    >
      <Sparkles size={10} strokeWidth={2.25} />
      {PLAN_NAMES[plan]}
    </span>
  );
}

/** Marks a control that needs Pro. */
export function ProTag() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded border border-line px-1 text-[10px] font-semibold uppercase leading-4 text-subtle">
      <Lock size={9} strokeWidth={2.5} /> Pro
    </span>
  );
}

const PRO_FEATURES = [
  'Hasta 3 usuarios (15 con Max)',
  'Leads ilimitados',
  'Importar y exportar contactos (CSV)',
  'Webhook e integraciones con anuncios y formularios',
  'Mensaje de WhatsApp con tu plantilla',
];

/** Opened through askUpgrade(reason) from anywhere in the app. */
export function UpgradeDialog() {
  const { upgradeReason, askUpgrade } = useStore();
  const close = () => askUpgrade(null);

  useEffect(() => {
    if (!upgradeReason) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && askUpgrade(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [upgradeReason, askUpgrade]);

  return (
    <AnimatePresence>
      {upgradeReason && (
        <motion.div
          key="upgrade"
          {...overlayMotion}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-[12vh] backdrop-blur-[2px]"
        >
          <div className="fixed inset-0" onClick={close} />
          <motion.div
            {...dialogMotion}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-title"
            className="relative w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-overlay"
          >
            <IconButton label="Cerrar" onClick={close} className="absolute right-3 top-3">
              <X size={16} />
            </IconButton>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent-soft">
              <Sparkles size={17} />
            </span>
            <h2 id="upgrade-title" className="mt-3 text-base font-semibold tracking-tight text-fg">
              Disponible con FlowDesk Pro
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{upgradeReason}</p>
            <ul className="mt-4 space-y-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-fg/90">
                  <Check size={14} className="mt-0.5 shrink-0 text-accent-soft" /> {f}
                </li>
              ))}
            </ul>
            <a
              href={ZERO_PRICING_URL}
              target="_blank"
              rel="noreferrer"
              onClick={close}
              className="mt-5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-accent text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Ver planes <ExternalLink size={13} className="opacity-70" />
            </a>
            <p className="mt-2.5 text-center text-2xs text-subtle">
              Se contrata en tu cuenta ZERO, con el mismo correo que usas aquí.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Inline notice inside a section whose feature needs Pro. */
export function UpgradeNote({ children, className = 'mb-4' }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex flex-col gap-3 rounded-lg border border-accent/30 bg-accent/[0.06] px-3 py-2.5 sm:flex-row sm:items-center', className)}>
      <p className="flex min-w-0 flex-1 items-start gap-2 text-xs leading-relaxed text-muted">
        <Lock size={13} className="mt-0.5 shrink-0 text-accent-soft" />
        <span>{children}</span>
      </p>
      <a
        href={ZERO_PRICING_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-7 shrink-0 items-center gap-1.5 self-start rounded-md bg-accent px-2.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover sm:self-auto"
      >
        <Sparkles size={13} /> Ver planes
      </a>
    </div>
  );
}
