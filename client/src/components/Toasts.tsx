import clsx from 'clsx';
import { CircleAlert, CircleCheck, Webhook, X } from 'lucide-react';
import { useStore } from '../store/AppStore';

const ICONS = {
  default: null,
  success: <CircleCheck size={16} className="text-emerald-400" />,
  error: <CircleAlert size={16} className="text-red-400" />,
  webhook: <Webhook size={16} className="text-accent-soft" />,
};

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 rounded-lg border border-line bg-surface px-3.5 py-3 shadow-overlay"
        >
          {ICONS[t.tone ?? 'default'] && <span className="mt-px">{ICONS[t.tone ?? 'default']}</span>}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-fg">{t.title}</p>
            {t.description && <p className="mt-0.5 truncate text-xs text-muted">{t.description}</p>}
          </div>
          {t.action && (
            <button
              onClick={() => {
                t.action!.onClick();
                dismissToast(t.id);
              }}
              className={clsx('text-xs font-medium text-accent-soft hover:text-fg')}
            >
              {t.action.label}
            </button>
          )}
          <button aria-label="Cerrar" onClick={() => dismissToast(t.id)} className="text-subtle hover:text-fg">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
