import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useInView, useReducedMotion } from 'motion/react';
import { useAuth } from '../../auth/AuthContext';
import { Reveal } from '../../components/motion';

/** Primary call to action adapts to where the visitor is in the funnel. */
export function usePrimaryCta() {
  const { status } = useAuth();
  if (status === 'authenticated') return { to: '/app', label: 'Ir al tablero' };
  return { to: '/registro', label: 'Crear cuenta gratis' };
}

export function CtaLink({ to, children, variant = 'primary', size = 'md', className }: {
  to: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const cls = clsx(
    'group inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all active:scale-[0.98]',
    size === 'sm' && 'h-8 px-3 text-[13px]',
    size === 'md' && 'h-10 px-4 text-sm',
    size === 'lg' && 'h-11 px-5 text-[15px]',
    variant === 'primary'
      ? 'bg-accent text-white shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_8px_24px_-8px_rgba(79,70,229,0.8)] hover:bg-accent-hover'
      : 'border border-line bg-surface/80 text-fg backdrop-blur hover:border-line-strong hover:bg-raised',
    className,
  );
  return to.startsWith('#') ? (
    <a href={to} className={cls}>{children}</a>
  ) : (
    <Link to={to} className={cls}>{children}</Link>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 text-xs font-medium text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-accent-soft" />
      {children}
    </p>
  );
}

export function SectionHeading({ eyebrow, title, body, align = 'center' }: {
  eyebrow: string;
  title: ReactNode;
  body?: string;
  align?: 'center' | 'left';
}) {
  return (
    <Reveal className={clsx('mb-14 max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-balance text-3xl font-semibold tracking-[-0.025em] text-fg md:text-[44px] md:leading-[1.1]">
        {title}
      </h2>
      {body && (
        <p className={clsx('mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-muted md:text-base', align === 'center' && 'mx-auto')}>
          {body}
        </p>
      )}
    </Reveal>
  );
}

/**
 * Cycles 0..steps-1 every `ms` while the element is on screen. With reduced motion it
 * holds on `restingStep` so illustrations still show a meaningful frame.
 */
export function useLoop<T extends HTMLElement = HTMLDivElement>(steps: number, ms: number, restingStep = steps - 1) {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { margin: '-80px' });
  const reduced = useReducedMotion();
  const [step, setStep] = useState(reduced ? restingStep : 0);

  useEffect(() => {
    if (reduced) {
      setStep(restingStep);
      return;
    }
    if (!inView) return;
    const t = window.setInterval(() => setStep((s) => (s + 1) % steps), ms);
    return () => window.clearInterval(t);
  }, [inView, reduced, steps, ms, restingStep]);

  return [step, ref] as const;
}

/** Mini window frame used by the product illustrations. */
export function MiniWindow({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <div className={clsx('overflow-hidden rounded-lg border border-line bg-canvas shadow-[0_20px_50px_-24px_rgba(0,0,0,0.9)]', className)}>
      {title && (
        <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-line-strong" />
          <span className="h-2 w-2 rounded-full bg-line-strong" />
          <span className="h-2 w-2 rounded-full bg-line-strong" />
          <span className="ml-2 truncate text-[10px] text-subtle">{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}
