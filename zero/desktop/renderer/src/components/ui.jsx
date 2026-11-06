import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export const cx = (...p) => p.filter(Boolean).join(' ');

/** Flaticon UIcons (regular rounded). `name` is the part after "fi-rr-", e.g. "home". */
export function Icon({ name, brand, className, size }) {
  return <i aria-hidden="true" className={cx('fi', brand ? `fi-brands-${brand}` : `fi-rr-${name}`, className)} style={size ? { fontSize: size } : undefined} />;
}

export function Spinner({ className }) {
  return <Icon name="spinner" className={cx('animate-spin', className)} />;
}

export function Button({ variant = 'primary', size = 'md', icon, loading, className, children, ...props }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cx(
        'inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' && 'h-9 px-3.5 text-[13px]',
        size === 'md' && 'h-11 px-5 text-sm',
        size === 'lg' && 'h-12 px-6 text-[15px]',
        variant === 'primary' && 'bg-blue text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,.9)] hover:bg-blue-deep',
        variant === 'secondary' && 'border border-line bg-card text-ink hover:border-blue/40 hover:text-blue',
        variant === 'ghost' && 'text-sub hover:bg-raised hover:text-ink',
        variant === 'danger' && 'border border-rose-500/25 bg-rose-500/[0.07] text-rose-600 hover:bg-rose-500/[0.12] dark:text-rose-300',
        className,
      )}
    >
      {loading ? <Spinner /> : icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
}

export function Card({ className, children, ...props }) {
  return (
    <div {...props} className={cx('rounded-2xl border border-line bg-card shadow-card', className)}>
      {children}
    </div>
  );
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-[13px] font-semibold text-sub">{label}</span>}
      {children}
      {(error || hint) && <span className={cx('mt-1.5 block text-xs', error ? 'text-rose-500' : 'text-mute')}>{error || hint}</span>}
    </label>
  );
}

export const inputCls =
  'h-11 w-full rounded-xl border border-line bg-card px-3.5 text-sm text-ink placeholder:text-mute outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10';

export function Input({ icon, className, ...props }) {
  if (!icon) return <input {...props} className={cx(inputCls, className)} />;
  return (
    <span className="relative block">
      <Icon name={icon} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
      <input {...props} className={cx(inputCls, 'pl-10', className)} />
    </span>
  );
}

export function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative block">
      <Icon name="lock" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
      <input {...props} type={show ? 'text' : 'password'} className={cx(inputCls, 'pl-10 pr-11')} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-mute hover:text-ink" aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
        <Icon name={show ? 'eye-crossed' : 'eye'} />
      </button>
    </span>
  );
}

export function Badge({ tone = 'neutral', icon, children, className }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold',
        tone === 'neutral' && 'bg-raised text-sub',
        tone === 'blue' && 'bg-blue-soft text-blue dark:bg-blue/15 dark:text-blue-300',
        tone === 'ok' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
        tone === 'warn' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
        tone === 'bad' && 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
        tone === 'gold' && 'bg-gradient-to-r from-amber-400/20 to-orange-400/20 text-amber-700 dark:text-amber-300',
        className,
      )}
    >
      {icon && <Icon name={icon} />}
      {children}
    </span>
  );
}

export function PageTitle({ title, sub, action }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">{title}</h1>
        {sub && <p className="mt-1 text-sm text-sub">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-raised text-xl text-mute">
        <Icon name={icon} />
      </span>
      <p className="font-display text-lg font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-sub">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---- Toasts ---------------------------------------------------------------------------------------------------

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l.slice(-2), { id, message, tone }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-2">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              className={cx('pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lift', t.tone === 'bad' ? 'border-rose-500/30 bg-card text-rose-600 dark:text-rose-300' : 'border-line bg-card text-ink')}
            >
              <Icon name={t.tone === 'bad' ? 'exclamation' : t.tone === 'info' ? 'info' : 'check-circle'} className={t.tone === 'bad' ? 'text-rose-500' : t.tone === 'info' ? 'text-blue' : 'text-emerald-500'} />
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

// ---- Dialogs ---------------------------------------------------------------------------------------------------

export function Modal({ open, onClose, title, children, width = 'max-w-md' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-6 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cx('w-full rounded-2xl border border-line bg-card p-6 shadow-lift', width)}
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-mute hover:bg-raised hover:text-ink" aria-label="Cerrar">
                <Icon name="cross-small" size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const ConfirmCtx = createContext(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const confirm = useCallback((opts) => new Promise((resolve) => setState({ ...opts, resolve })), []);
  const close = (v) => {
    state?.resolve(v);
    setState(null);
  };
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Modal open={Boolean(state)} onClose={() => close(false)} title={state?.title}>
        <p className="text-sm leading-relaxed text-sub">{state?.body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => close(false)}>
            Cancelar
          </Button>
          <Button variant={state?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
            {state?.confirm || 'Confirmar'}
          </Button>
        </div>
      </Modal>
    </ConfirmCtx.Provider>
  );
}

export const platformLabel = (p) => ({ win32: 'Windows', darwin: 'macOS', linux: 'Linux' })[p] || 'Computador';
export const platformIcon = (p) => (p === 'win32' ? { brand: 'windows' } : p === 'darwin' ? { brand: 'apple' } : { name: 'computer' });

export function timeAgo(iso) {
  if (!iso) return 'nunca';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `hace ${Math.floor(diff / 86400)} días`;
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
