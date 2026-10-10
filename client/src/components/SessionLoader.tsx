import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';
import { Check, Lightbulb, LoaderCircle } from 'lucide-react';
import { LogoMark } from './Logo';
import { ease } from './motion';

/** Every fact describes something FlowDesk really does; keep it that way. */
const FACTS = [
  'Puedes recibir leads desde cualquier herramienta con el webhook: Zapier, Make, n8n o tu propio código.',
  'El formulario para tu web trae protección antispam incluida, sin captchas que espanten a tus clientes.',
  'La vista Hoy junta tus recordatorios vencidos, los leads nuevos sin atender y los que se están enfriando.',
  'Con un clic en WhatsApp se abre el chat con un mensaje listo y el contacto queda en el historial del lead.',
  'Tu mensaje de WhatsApp puede incluir {nombre} y {empresa_cliente}: FlowDesk los completa con los datos de cada lead.',
  'Al importar tu planilla CSV, FlowDesk omite los contactos repetidos por correo o teléfono.',
  'Si alguien de tu equipo mueve un lead, todos lo ven al instante, sin recargar la página.',
  'Tus leads viven en un espacio privado: solo tú y las personas que invites pueden verlos.',
  'Puedes exportar todos tus contactos a CSV cuando quieras. Tus datos son tuyos.',
  'Las contraseñas se guardan con hash scrypt: nadie puede leerlas, ni siquiera nosotros.',
  'Cada oportunidad avanza por cinco etapas: Nuevo Lead, En Contacto, Propuesta Enviada, Ganado y Perdido.',
];

const MIN_DURATION = 3200;

/**
 * Full-screen hand-off shown right after signing in or creating an account. It stays up for
 * at least MIN_DURATION (so the fact can be read) and until `prepare` has finished.
 */
export function SessionLoader({ title, steps, prepare, onDone }: {
  title: string;
  steps: string[];
  prepare?: () => Promise<unknown>;
  onDone: () => void;
}) {
  const reduced = useReducedMotion();
  const [fact] = useState(() => FACTS[Math.floor(Math.random() * FACTS.length)]!);
  const [done, setDone] = useState(0);

  useEffect(() => {
    const per = MIN_DURATION / (steps.length + 0.5);
    const timers = steps.map((_, i) => window.setTimeout(() => setDone(i + 1), per * (i + 1)));
    let alive = true;
    Promise.all([
      new Promise((r) => window.setTimeout(r, MIN_DURATION)),
      (prepare?.() ?? Promise.resolve()).catch(() => undefined),
    ]).then(() => alive && onDone());
    return () => {
      alive = false;
      timers.forEach((t) => window.clearTimeout(t));
    };
    // Runs once per hand-off; props are stable for its lifetime.
  }, []);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-canvas px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[520px]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          className="h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(79,70,229,0.22),transparent)]"
          animate={reduced ? undefined : { scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative w-full max-w-sm text-center">
        <div className="relative mx-auto mb-8 h-20 w-20">
          <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
            <circle cx="40" cy="40" r="37" fill="none" stroke="#262D3D" strokeWidth="2" />
            <motion.circle
              cx="40"
              cy="40"
              r="37"
              fill="none"
              stroke="#818CF8"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: MIN_DURATION / 1000, ease: [0.4, 0, 0.2, 1] }}
            />
          </svg>
          <motion.div
            className="absolute inset-[10px] flex items-center justify-center rounded-2xl border border-line-strong bg-surface shadow-[0_0_50px_-10px_rgba(99,102,241,0.6)]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <LogoMark size={30} />
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.1 }}
          className="text-xl font-semibold tracking-tight text-fg"
        >
          {title}
        </motion.h1>

        <ul className="mx-auto mt-6 w-fit space-y-2.5 text-left">
          {steps.map((s, i) => {
            const state = i < done ? 'done' : i === done ? 'active' : 'idle';
            return (
              <motion.li
                key={s}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease, delay: 0.2 + i * 0.08 }}
                className={clsx(
                  'flex items-center gap-2.5 text-sm transition-colors duration-300',
                  state === 'idle' ? 'text-subtle' : state === 'active' ? 'text-fg' : 'text-muted',
                )}
              >
                <span
                  className={clsx(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300',
                    state === 'done' ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300' : 'border-line-strong text-accent-soft',
                  )}
                >
                  {state === 'done' ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                      <Check size={11} strokeWidth={3} />
                    </motion.span>
                  ) : state === 'active' ? (
                    <LoaderCircle size={11} className="animate-spin" />
                  ) : null}
                </span>
                {s}
              </motion.li>
            );
          })}
        </ul>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.45 }}
          className="mt-10 rounded-xl border border-line bg-surface/80 p-4 text-left backdrop-blur"
        >
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent-soft">
            <Lightbulb size={12} /> ¿Sabías que…?
          </p>
          <p className="text-[13px] leading-relaxed text-muted">{fact}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
