import { useEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { AlarmClock, FileSpreadsheet, FileText, Mail, MessageCircle, Phone, Webhook } from 'lucide-react';
import { ease, spring } from '../../components/motion';
import { STATUS_BY_ID } from '../../lib/constants';
import { SectionHeading } from './shared';

const DURATION = 6500;

const STEPS = [
  {
    title: 'Conecta tus fuentes',
    body: 'Pega el formulario en tu web, apunta Zapier o Make al webhook, o importa tu planilla. Todo cae en «Nuevo Lead».',
  },
  {
    title: 'Atiende lo urgente',
    body: 'Abre «Hoy»: recordatorios, leads nuevos y los que se enfrían. Escríbeles por WhatsApp en un clic.',
  },
  {
    title: 'Cierra y mide',
    body: 'Mueve cada oportunidad por el tablero y sigue tu pipeline abierto, lo ganado y tu tasa de cierre.',
  },
];

function Panel({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease } }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
      className="absolute inset-0 flex items-center justify-center p-6"
    >
      {children}
    </motion.div>
  );
}

function ConnectVisual() {
  const sources = [
    { icon: FileText, label: 'Formulario web' },
    { icon: Webhook, label: 'Zapier · Make' },
    { icon: FileSpreadsheet, label: 'Planilla CSV' },
  ];
  const leads = ['Paula Ríos', 'Tomás Herrera', 'Rosa Díaz'];
  return (
    <div className="grid w-full max-w-md grid-cols-[1fr_auto_1fr] items-center gap-4">
      <div className="space-y-2.5">
        {sources.map(({ icon: Icon, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.1 + i * 0.1 } }}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-[11px] text-fg"
          >
            <Icon size={13} className="text-accent-soft" /> {label}
          </motion.div>
        ))}
      </div>
      <div className="relative h-28 w-12">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute left-0 h-1.5 w-1.5 rounded-full bg-accent-soft"
            style={{ top: `${20 + i * 30}%` }}
            animate={{ left: ['0%', '100%'], opacity: [0, 1, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.45, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <div className="rounded-lg border border-line/70 bg-surface/60 p-2">
        <p className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-medium text-fg">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_BY_ID.new.color }} /> Nuevo Lead
        </p>
        <div className="space-y-1.5">
          {leads.map((n, i) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0, transition: { ...spring, delay: 0.5 + i * 0.35 } }}
              className="rounded-md border border-line bg-surface px-2 py-1.5"
            >
              <p className="text-[10px] font-medium text-fg">{n}</p>
              <p className="text-[9px] text-subtle">justo ahora</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AttendVisual() {
  const items = [
    { t: 'Enviar cotización', who: 'Sofía Martínez · Panadería La Espiga', tag: 'Vencido hace 1 hora', red: true },
    { t: 'Hacer seguimiento de la propuesta', who: 'Felipe Araya · Araya Contadores', tag: '15:30' },
    { t: 'Confirmar reunión', who: 'Valentina Rojas · Estudio Norte', tag: 'mañana' },
  ];
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-[12px] font-semibold text-fg">
        <AlarmClock size={14} className="text-muted" /> Para hoy
        <span className="rounded bg-raised px-1.5 text-[10px] text-muted">3</span>
      </div>
      {items.map((r, i) => (
        <motion.div
          key={r.t}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0, transition: { delay: 0.1 + i * 0.12 } }}
          className="flex items-center gap-3 border-b border-line/60 px-4 py-2.5 last:border-0"
        >
          <span className="h-4 w-4 shrink-0 rounded-full border border-line-strong" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-fg">{r.t}</p>
            <p className="truncate text-[10px] text-subtle">{r.who}</p>
          </div>
          <span className={clsx('hidden shrink-0 rounded-full px-2 py-0.5 text-[9px] sm:inline', r.red ? 'bg-red-500/10 text-red-300' : 'bg-raised text-muted')}>
            {r.tag}
          </span>
          <span className="flex gap-1">
            {[MessageCircle, Phone, Mail].map((Icon, j) => (
              <span
                key={j}
                className={clsx(
                  'flex h-6 w-6 items-center justify-center rounded-md border',
                  i === 0 && j === 0 ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : 'border-line text-muted',
                )}
              >
                <Icon size={11} />
              </span>
            ))}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function MeasureVisual() {
  const stages = [
    { id: 'new' as const, count: 9 },
    { id: 'contacted' as const, count: 6 },
    { id: 'proposal' as const, count: 4 },
    { id: 'won' as const, count: 2 },
  ];
  const max = 9;
  return (
    <div className="w-full max-w-md space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Pipeline abierto', value: '$26.150' },
          { label: 'Ganado', value: '$12.500' },
          { label: 'Tasa de cierre', value: '50%' },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08 } }}
            className="rounded-lg border border-line bg-surface px-3 py-2"
          >
            <p className="text-[9px] text-muted">{k.label}</p>
            <p className="mt-0.5 text-[15px] font-semibold tracking-tight text-fg">{k.value}</p>
          </motion.div>
        ))}
      </div>
      <div className="rounded-lg border border-line bg-surface p-3">
        <p className="mb-2 text-[10px] font-medium text-fg">Leads por etapa</p>
        <div className="space-y-1.5">
          {stages.map((s, i) => (
            <div key={s.id} className="grid grid-cols-[112px_1fr_20px] items-center gap-2">
              <span className="truncate text-[10px] text-muted">{STATUS_BY_ID[s.id].label}</span>
              <span className="relative h-2">
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-r bg-accent-soft"
                  initial={{ width: 0 }}
                  animate={{ width: `${(s.count / max) * 100}%`, transition: { duration: 0.8, ease, delay: 0.2 + i * 0.1 } }}
                />
              </span>
              <span className="text-right text-[10px] tabular-nums text-fg">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const VISUALS = [ConnectVisual, AttendVisual, MeasureVisual];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0); // restarts the progress bar
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-120px' });
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!inView || reduced) return;
    const t = window.setTimeout(() => {
      setActive((a) => (a + 1) % STEPS.length);
      setCycle((c) => c + 1);
    }, DURATION);
    return () => window.clearTimeout(t);
  }, [active, cycle, inView, reduced]);

  const select = (i: number) => {
    setActive(i);
    setCycle((c) => c + 1);
  };
  const Visual = VISUALS[active]!;

  return (
    <section id="como-funciona" className="scroll-mt-16 border-t border-line/60 py-24 md:py-32">
      <div ref={ref} className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Cómo funciona"
          title="De formulario a cliente en tres pasos"
          body="Sin configuraciones eternas: conecta, atiende y cierra desde el primer día."
        />
        <div className="grid items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <ol className="flex flex-col gap-2">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <button
                  onClick={() => select(i)}
                  aria-current={active === i}
                  className={clsx(
                    'relative w-full overflow-hidden rounded-xl border p-5 text-left transition-colors',
                    active === i ? 'border-line-strong bg-surface' : 'border-transparent hover:bg-surface/50',
                  )}
                >
                  <div className="flex gap-4">
                    <span
                      className={clsx(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs transition-colors',
                        active === i ? 'border-accent/60 bg-accent/15 text-accent-soft' : 'border-line-strong text-subtle',
                      )}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h3 className={clsx('text-[15px] font-semibold transition-colors', active === i ? 'text-fg' : 'text-muted')}>{s.title}</h3>
                      <AnimatePresence initial={false}>
                        {active === i && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease }}
                            className="overflow-hidden pt-1.5 text-sm leading-relaxed text-muted"
                          >
                            {s.body}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  {active === i && !reduced && (
                    <motion.span
                      key={cycle}
                      className="absolute bottom-0 left-0 h-0.5 bg-accent"
                      initial={{ width: '0%' }}
                      animate={{ width: inView ? '100%' : '0%' }}
                      transition={{ duration: DURATION / 1000, ease: 'linear' }}
                    />
                  )}
                </button>
              </li>
            ))}
          </ol>

          <div className="relative min-h-[340px] overflow-hidden rounded-2xl border border-line bg-canvas/60">
            <div aria-hidden className="bg-grid absolute inset-0 opacity-70" />
            <div aria-hidden className="absolute -top-24 left-1/2 h-64 w-[480px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(79,70,229,0.16),transparent)]" />
            <AnimatePresence mode="wait">
              <Panel key={active}>
                <Visual />
              </Panel>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
