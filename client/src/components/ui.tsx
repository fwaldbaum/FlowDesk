import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import { STATUS_BY_ID } from '../lib/constants';
import { initials } from '../lib/format';
import type { Status } from '../lib/types';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover border border-white/10 shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_4px_14px_-6px_rgba(79,70,229,0.7)]',
  secondary: 'bg-raised text-fg border border-line hover:border-line-strong hover:bg-[#222839]',
  ghost: 'text-muted hover:text-fg hover:bg-raised',
  danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }
>(function Button({ variant = 'secondary', size = 'md', className, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-medium transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});

export function IconButton({
  className,
  label,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-raised hover:text-fg',
        className,
      )}
      {...props}
    />
  );
}

export function StatusDot({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={clsx('inline-block h-2 w-2 shrink-0 rounded-full', className)}
      style={{ backgroundColor: STATUS_BY_ID[status].color }}
    />
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-raised/60 px-2 py-0.5 text-xs text-fg/90">
      <StatusDot status={status} className="h-1.5 w-1.5" />
      {STATUS_BY_ID[status].label}
    </span>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-raised font-medium text-muted',
        size === 'sm' && 'h-6 w-6 text-2xs',
        size === 'md' && 'h-8 w-8 text-xs',
        size === 'lg' && 'h-10 w-10 text-sm',
      )}
    >
      {initials(name)}
    </span>
  );
}
