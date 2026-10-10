import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Clock, MessageCircle, Sun, Webhook } from 'lucide-react';
import { STATUS_BY_ID } from '../lib/constants';
import { ease, softSpring } from './motion';

const LEADS = [
  { name: 'Valentina Rojas', meta: 'Estudio Norte · Formulario web', value: '$1.800' },
  { name: 'Tomás Herrera', meta: 'Herrera Logística · Webhook', value: '$4.200' },
  { name: 'Camila Fuentes', meta: 'Café Origen · Instagram Ads', value: '$950' },
  { name: 'Diego Morales', meta: 'Morales Dental · Google Ads', value: '$3.100' },
  { name: 'Lucía Paredes', meta: 'Clínica Sonríe · Referido', value: '$2.000' },
];

const POINTS = [
  { icon: Webhook, text: 'Los leads de tu web y tus campañas llegan solos al tablero.' },
  { icon: Sun, text: 'La vista Hoy te dice a quién contactar y qué está vencido.' },
  { icon: MessageCircle, text: 'WhatsApp en un clic, con el historial de cada conversación.' },
];

/** Decorative side panel for the auth screens on wide viewports. */
export function AuthShowcase() {
  const reduced = useReducedMotion();
  const [head, setHead] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setHead((h) => h + 1), 2800);
    return () => window.clearInterval(t);
  }, [reduced]);

  const visible = [0, 1, 2].map((i) => {
    const n = head - i;
    return { key: n, lead: LEADS[((n % LEADS.length) + LEADS.length) % LEADS.length]!, fresh: i === 0 && head > 0 };
  });

  return (
    <div className="relative flex h-full flex-col justify-center overflow-hidden px-12 py-16 xl:px-20">
      <div aria-hidden className="bg-grid absolute inset-0 opacity-60" />
      <div aria-hidden className="absolute -right-32 top-1/4 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(79,70,229,0.22),transparent)]" />

      <motion.div
        className="relative max-w-md"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease, delay: 0.15 }}
      >
        <h2 className="text-balance text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-fg">
          Cada lead en su lugar,{' '}
          <span className="bg-gradient-to-r from-[#A5B4FC] to-[#60A5FA] bg-clip-text text-transparent">cada seguimiento a tiempo.</span>
        </h2>

        <div className="relative mt-10 h-[300px]">
          {/* Column with arriving leads */}
          <div className="absolute left-0 top-0 w-[300px] rounded-xl border border-line-strong/70 bg-canvas/90 p-2 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur">
            <div className="flex items-center gap-1.5 px-1.5 pb-2 pt-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_BY_ID.new.color }} />
              <span className="text-[11px] font-medium text-fg">Nuevo Lead</span>
              <span className="ml-auto flex items-center gap-1 text-[10px] text-subtle">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> En vivo
              </span>
            </div>
            <div className="space-y-1.5">
              <AnimatePresence initial={false} mode="popLayout">
                {visible.map(({ key, lead, fresh }) => (
                  <motion.div
                    key={key}
                    layout
                    initial={{ opacity: 0, y: -14, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={softSpring}
                    className={clsx(
                      'rounded-md border px-2.5 py-2 transition-colors duration-700',
                      fresh ? 'border-accent/70 bg-[#1a1d33]' : 'border-line bg-surface',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="truncate text-[11.5px] font-medium text-fg">{lead.name}</p>
                      {fresh && <span className="text-[9px] font-medium text-accent-soft">Nuevo</span>}
                    </div>
                    <p className="truncate text-[10px] text-muted">{lead.meta}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-medium tabular-nums text-fg">{lead.value}</span>
                      <span className="flex items-center gap-0.5 text-[9px] text-subtle"><Clock size={8} /> justo ahora</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Today card */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.5 }}
            className="absolute right-0 top-40 w-56 rounded-xl border border-line-strong/80 bg-surface/95 p-3 shadow-overlay backdrop-blur"
          >
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-fg">
              <Sun size={12} className="text-amber-300" /> Para hoy
            </p>
            {[
              { t: 'Llamar a Martín Vidal', done: true },
              { t: 'Enviar propuesta a Felipe', overdue: true },
            ].map((r) => (
              <div key={r.t} className="flex items-center gap-2 border-t border-line/60 py-1.5 first:border-0">
                <span
                  className={clsx(
                    'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border',
                    r.done ? 'border-emerald-400 bg-emerald-400 text-canvas' : 'border-line-strong',
                  )}
                >
                  {r.done && <Check size={9} strokeWidth={3} />}
                </span>
                <span className={clsx('truncate text-[10px]', r.done ? 'text-subtle line-through' : 'text-fg')}>{r.t}</span>
                {r.overdue && <span className="ml-auto shrink-0 rounded-full bg-red-500/15 px-1.5 text-[9px] text-red-300">Vencido</span>}
              </div>
            ))}
          </motion.div>
        </div>

        <ul className="mt-4 space-y-3.5">
          {POINTS.map(({ icon: Icon, text }, i) => (
            <motion.li
              key={text}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.6 + i * 0.08 }}
              className="flex items-start gap-3 text-sm leading-relaxed text-muted"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-accent-soft">
                <Icon size={13} />
              </span>
              {text}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
