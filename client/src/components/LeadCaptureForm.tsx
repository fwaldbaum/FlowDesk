import { useState, type CSSProperties, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleCheck, LoaderCircle } from 'lucide-react';
import type { FormSettings } from '../lib/types';
import { LogoMark } from './Logo';
import { ease, spring } from './motion';

type PublicSettings = Omit<FormSettings, 'source'>;

const THEMES = {
  light: { bg: '#FFFFFF', text: '#111827', muted: '#6B7280', border: '#E5E7EB', input: '#FFFFFF', subtle: '#9CA3AF' },
  dark: { bg: '#161B26', text: '#F3F4F6', muted: '#9AA3B2', border: '#262D3D', input: '#0B0F17', subtle: '#687185' },
};

/**
 * The lead form that customers embed on their websites. `onSubmit` is omitted in the
 * Settings preview, where submitting just shows the success state.
 */
export function LeadCaptureForm({ settings, onSubmit, preview = false }: {
  settings: PublicSettings;
  onSubmit?: (data: Record<string, string>) => Promise<void>;
  preview?: boolean;
}) {
  const t = THEMES[settings.theme];
  const [values, setValues] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const vars = {
    '--fd-bg': t.bg,
    '--fd-text': t.text,
    '--fd-muted': t.muted,
    '--fd-border': t.border,
    '--fd-input': t.input,
    '--fd-accent': settings.accent,
  } as CSSProperties;

  const set = (key: string) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!onSubmit) {
      setState('done');
      return;
    }
    setState('sending');
    try {
      await onSubmit(values);
      setState('done');
    } catch (err) {
      setError((err as Error).message);
      setState('idle');
    }
  };

  const inputClass =
    'w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-[border-color,box-shadow] placeholder:opacity-60 focus-visible:ring-0 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--fd-accent)_25%,transparent)] focus:[border-color:var(--fd-accent)]';
  const inputStyle = { background: 'var(--fd-input)', borderColor: 'var(--fd-border)', color: 'var(--fd-text)' };
  const labelClass = 'mb-1.5 block text-xs font-medium';

  return (
    <div
      style={{ ...vars, background: 'var(--fd-bg)', color: 'var(--fd-text)', borderColor: 'var(--fd-border)' }}
      className="w-full overflow-hidden rounded-2xl border p-6 font-sans shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)] sm:p-7"
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === 'done' ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease } }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-10 text-center"
          >
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: { ...spring, delay: 0.05 } }}
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: `color-mix(in srgb, ${settings.accent} 15%, transparent)`, color: settings.accent }}
            >
              <CircleCheck size={28} />
            </motion.span>
            <p className="text-base font-semibold">{settings.success}</p>
            {preview && (
              <button type="button" onClick={() => setState('idle')} className="mt-4 text-xs underline" style={{ color: t.muted }}>
                Ver el formulario otra vez
              </button>
            )}
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }} className="space-y-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{settings.title}</h1>
              {settings.description && (
                <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--fd-muted)' }}>{settings.description}</p>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="fd-name">Nombre</label>
              <input id="fd-name" className={inputClass} style={inputStyle} value={values.name ?? ''} onChange={set('name')} autoComplete="name" required minLength={2} />
            </div>
            <div>
              <label className={labelClass} htmlFor="fd-email">Correo</label>
              <input id="fd-email" type="email" className={inputClass} style={inputStyle} value={values.email ?? ''} onChange={set('email')} autoComplete="email" required />
            </div>
            {(settings.fields.phone || settings.fields.company) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {settings.fields.phone && (
                  <div className={settings.fields.company ? '' : 'sm:col-span-2'}>
                    <label className={labelClass} htmlFor="fd-phone">Teléfono</label>
                    <input id="fd-phone" type="tel" className={inputClass} style={inputStyle} value={values.phone ?? ''} onChange={set('phone')} autoComplete="tel" required />
                  </div>
                )}
                {settings.fields.company && (
                  <div className={settings.fields.phone ? '' : 'sm:col-span-2'}>
                    <label className={labelClass} htmlFor="fd-company">Empresa</label>
                    <input id="fd-company" className={inputClass} style={inputStyle} value={values.company ?? ''} onChange={set('company')} autoComplete="organization" />
                  </div>
                )}
              </div>
            )}
            {settings.fields.message && (
              <div>
                <label className={labelClass} htmlFor="fd-message">Mensaje</label>
                <textarea id="fd-message" rows={3} className={`${inputClass} resize-y`} style={inputStyle} value={values.message ?? ''} onChange={set('message')} />
              </div>
            )}
            {/* Honeypot: hidden from people, irresistible to bots. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={values.website ?? ''}
              onChange={set('website')}
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />
            {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={state === 'sending'}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-70"
              style={{ background: settings.accent }}
            >
              {state === 'sending' && <LoaderCircle size={16} className="animate-spin" />}
              {settings.button}
            </motion.button>
            <p className="flex items-center justify-center gap-1.5 pt-1 text-[11px]" style={{ color: t.subtle }}>
              <LogoMark size={12} /> Formulario con FlowDesk
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
