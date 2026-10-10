import { type MouseEvent, type ReactNode } from 'react';
import clsx from 'clsx';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import {
  Check, CircleCheck, FileSpreadsheet, FileText, Lock, Mail, MessageCircle, MousePointer2, Phone, ShieldCheck,
  SquareKanban, Sun, Upload, Webhook, Zap,
} from 'lucide-react';
import { Reveal, spring } from '../../components/motion';
import { STATUS_BY_ID } from '../../lib/constants';
import type { Status } from '../../lib/types';
import { MiniWindow, SectionHeading, useLoop } from './shared';

/** Card with a product illustration on top and copy below; soft highlight follows the cursor. */
function BentoCard({ icon: Icon, title, body, children, className, art = 'h-60' }: {
  icon: typeof Sun;
  title: string;
  body: string;
  children?: ReactNode;
  className?: string;
  art?: string;
}) {
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
  };
  return (
    <Reveal className={clsx('h-full', className)} y={14}>
      <div
        onMouseMove={onMove}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface/50 transition-colors hover:border-line-strong"
      >
        <div className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:radial-gradient(420px_circle_at_var(--x)_var(--y),rgba(99,102,241,0.10),transparent_60%)]" />
        {children && (
          <div aria-hidden className={clsx('relative z-10 overflow-hidden border-b border-line/60 bg-canvas/40', art)}>
            <div className="bg-grid absolute inset-0 opacity-60" />
            {children}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface/80 to-transparent" />
          </div>
        )}
        <div className="relative z-10 p-6">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-fg">
            <Icon size={16} strokeWidth={1.75} className="text-accent-soft" />
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
        </div>
      </div>
    </Reveal>
  );
}

// ---- Illustrations --------------------------------------------------------------

const KANBAN_COLUMNS: Status[] = ['new', 'contacted', 'proposal'];
const KANBAN_STATIC: Record<string, string[]> = {
  new: ['Lucía Paredes'],
  contacted: ['Martín Vidal', 'Isidora Campos'],
  proposal: ['Josefina Lagos'],
};

function KanbanArt() {
  const [step, ref] = useLoop(3, 1800, 1);
  const target = KANBAN_COLUMNS[step]!;
  return (
    <div ref={ref} className="absolute inset-0 flex items-start justify-center px-6 pt-7">
      <LayoutGroup>
        <div className="grid w-full max-w-xl grid-cols-3 gap-3">
          {KANBAN_COLUMNS.map((status) => (
            <div key={status} className="rounded-lg border border-line/70 bg-surface/60 p-2">
              <p className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-medium text-fg">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_BY_ID[status].color }} />
                {STATUS_BY_ID[status].label}
              </p>
              <div className="space-y-1.5">
                {status === target && (
                  <motion.div
                    layoutId="kanban-moving"
                    transition={spring}
                    className="relative rotate-[-1.5deg] rounded-md border border-accent/70 bg-[#1a1d33] px-2 py-1.5 shadow-[0_10px_24px_-10px_rgba(79,70,229,0.7)]"
                  >
                    <p className="text-[10px] font-medium text-fg">Valentina Rojas</p>
                    <p className="text-[9px] text-muted">$1.800 · Formulario web</p>
                    <MousePointer2 size={14} className="absolute -bottom-2 -right-2 fill-white text-white drop-shadow" />
                  </motion.div>
                )}
                {KANBAN_STATIC[status]!.map((n) => (
                  <motion.div layout key={n} className="rounded-md border border-line bg-surface px-2 py-1.5">
                    <p className="text-[10px] font-medium text-fg">{n}</p>
                    <div className="mt-1 h-1.5 w-2/3 rounded-full bg-raised" />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
}

const REMINDERS = [
  { t: 'Llamar a Martín Vidal', who: 'Vidal Transportes', overdue: true },
  { t: 'Enviar propuesta', who: 'Araya Contadores' },
  { t: 'Confirmar reunión', who: 'Estudio Norte' },
];

function TodayArt() {
  const [step, ref] = useLoop(5, 1100, 1);
  const done = Math.min(step, REMINDERS.length);
  return (
    <div ref={ref} className="absolute inset-0 flex items-start justify-center px-5 pt-6">
      <MiniWindow className="w-full max-w-xs">
        <div className="flex items-center gap-1.5 border-b border-line px-3 py-2 text-[10px] font-semibold text-fg">
          <Sun size={11} className="text-amber-300" /> Para hoy
          <span className="ml-auto rounded bg-raised px-1.5 text-[9px] tabular-nums text-muted">{REMINDERS.length - done}</span>
        </div>
        {REMINDERS.map((r, i) => {
          const isDone = i < done;
          return (
            <div key={r.t} className="flex items-center gap-2.5 border-b border-line/50 px-3 py-2 last:border-0">
              <motion.span
                animate={isDone ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                className={clsx(
                  'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors',
                  isDone ? 'border-emerald-400 bg-emerald-400 text-canvas' : 'border-line-strong',
                )}
              >
                {isDone && <Check size={9} strokeWidth={3} />}
              </motion.span>
              <div className="min-w-0 flex-1">
                <p className={clsx('truncate text-[10px] transition-colors', isDone ? 'text-subtle line-through' : 'text-fg')}>{r.t}</p>
                <p className="truncate text-[9px] text-subtle">{r.who}</p>
              </div>
              {r.overdue && !isDone && <span className="rounded-full bg-red-500/15 px-1.5 text-[8px] text-red-300">Vencido</span>}
            </div>
          );
        })}
        <AnimatePresence>
          {done === REMINDERS.length && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center gap-1.5 overflow-hidden bg-emerald-500/10 py-1.5 text-[10px] font-medium text-emerald-300"
            >
              <CircleCheck size={11} /> Todo al día
            </motion.p>
          )}
        </AnimatePresence>
      </MiniWindow>
    </div>
  );
}

function WhatsAppArt() {
  const [step, ref] = useLoop(4, 1300, 3);
  return (
    <div ref={ref} className="absolute inset-0 flex flex-col items-center gap-2.5 px-5 pt-6">
      <div className="w-full max-w-xs rounded-lg border border-line bg-surface px-3 py-2">
        <p className="text-[10px] font-medium text-fg">Valentina Rojas</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {[
            { icon: MessageCircle, label: 'WhatsApp', on: step >= 1 },
            { icon: Phone, label: 'Llamar' },
            { icon: Mail, label: 'Correo' },
          ].map(({ icon: Icon, label, on }) => (
            <motion.span
              key={label}
              animate={on && step === 1 ? { scale: [1, 0.92, 1] } : {}}
              className={clsx(
                'flex items-center justify-center gap-1 rounded border py-1 text-[9px] transition-colors',
                on ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : 'border-line text-muted',
              )}
            >
              <Icon size={9} /> {label}
            </motion.span>
          ))}
        </div>
      </div>
      <div className="w-full max-w-xs overflow-hidden rounded-lg border border-line bg-[#0b141a]">
        <div className="min-h-[62px] p-2.5">
          <AnimatePresence>
            {step >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={spring}
                className="ml-auto max-w-[92%] rounded-lg rounded-tr-sm bg-[#005c4b] px-2.5 py-1.5 text-[9.5px] leading-relaxed text-[#e9edef]"
              >
                Hola Valentina, te escribo de Estudio Norte. ¿Tienes unos minutos para conversar?
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {step >= 3 && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-[9.5px] text-muted"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-line-strong" /> Contactado por WhatsApp · justo ahora
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function FormArt() {
  const [step, ref] = useLoop(5, 1100, 4);
  const field = (label: string, value: string, filled: boolean) => (
    <div>
      <p className="mb-0.5 text-[8px] font-medium text-gray-500">{label}</p>
      <div className="flex h-5 items-center rounded border border-gray-200 bg-white px-1.5 text-[9px] text-gray-800">
        {filled && (
          <motion.span initial={{ width: 0 }} animate={{ width: 'auto' }} className="overflow-hidden whitespace-nowrap">
            {value}
          </motion.span>
        )}
      </div>
    </div>
  );
  return (
    <div ref={ref} className="absolute inset-0 flex flex-col items-center gap-2.5 px-5 pt-5">
      <MiniWindow title="tusitio.cl/contacto" className="w-full max-w-xs bg-white">
        <div className="space-y-1.5 bg-[#F6F7F9] p-3">
          {step >= 3 ? (
            <motion.p
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-[78px] flex-col items-center justify-center gap-1 text-[10px] font-semibold text-gray-800"
            >
              <CircleCheck size={16} className="text-[#10B981]" /> ¡Gracias! Te contactaremos pronto.
            </motion.p>
          ) : (
            <>
              {field('Nombre', 'Paula Ríos', step >= 1)}
              {field('Correo', 'paula@rios.cl', step >= 2)}
              <motion.div
                animate={step === 2 ? { scale: [1, 0.96, 1] } : {}}
                transition={{ delay: 0.6 }}
                className="flex h-5 items-center justify-center rounded bg-[#10B981] text-[9px] font-semibold text-white"
              >
                Enviar
              </motion.div>
            </>
          )}
        </div>
      </MiniWindow>
      <AnimatePresence>
        {step >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-accent/60 bg-[#1a1d33] px-3 py-2"
          >
            <FileText size={12} className="text-accent-soft" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-fg">Paula Ríos</p>
              <p className="text-[9px] text-muted">Formulario web · Nuevo Lead</p>
            </div>
            <span className="text-[8px] font-medium text-accent-soft">Nuevo</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const CSV_ROWS = [
  ['Juan Pérez', 'juan@perez.cl', '$1.200.000'],
  ['Rosa Díaz', 'rosa@diaz.cl', '$850.000'],
  ['Luis Mora', 'luis@mora.cl', '$430.000'],
  ['Juan Pérez', 'JUAN@perez.cl', '—'],
];

function ImportArt() {
  const [step, ref] = useLoop(4, 1300, 3);
  const progress = [0, 0.45, 1, 1][step]!;
  return (
    <div ref={ref} className="absolute inset-0 flex flex-col items-center gap-2.5 px-5 pt-5">
      <MiniWindow className="w-full max-w-xs">
        <div className="flex items-center gap-1.5 border-b border-line px-3 py-1.5 text-[10px] text-fg">
          <FileSpreadsheet size={11} className="text-emerald-400" /> clientes.csv
          <span className="ml-auto text-[9px] text-subtle">4 filas</span>
        </div>
        <table className="w-full text-left text-[9px]">
          <tbody>
            {CSV_ROWS.map((r, i) => {
              const dup = i === 3;
              return (
                <tr
                  key={i}
                  className={clsx(
                    'border-b border-line/40 transition-colors last:border-0',
                    step >= 3 && (dup ? 'text-subtle line-through' : 'text-emerald-300/90'),
                    step < 3 && 'text-muted',
                  )}
                >
                  {r.map((c, j) => <td key={j} className="truncate px-3 py-1">{c}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </MiniWindow>
      <div className="w-full max-w-xs">
        <div className="h-1 overflow-hidden rounded-full bg-line">
          <motion.div className="h-full rounded-full bg-accent" animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.9 }} />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted">
          {step >= 3 ? (
            <>
              <CircleCheck size={11} className="text-emerald-400" /> 3 leads importados · 1 duplicado omitido
            </>
          ) : (
            <>
              <Upload size={11} /> {step === 0 ? 'Columnas detectadas automáticamente' : 'Importando…'}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function WebhookArt() {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-5">
      <div className="w-full max-w-xs rounded-lg border border-line bg-canvas font-mono text-[9.5px] leading-5">
        <p className="border-b border-line px-3 py-1.5 text-subtle">
          <span className="mr-1.5 rounded bg-accent/15 px-1 font-semibold text-accent-soft">POST</span>/api/webhooks/lead
        </p>
        <p className="px-3 pt-1.5 text-fg/80"><span className="text-accent-soft">"name"</span>: <span className="text-emerald-300/90">"Tomás Herrera"</span>,</p>
        <p className="px-3 text-fg/80"><span className="text-accent-soft">"source"</span>: <span className="text-emerald-300/90">"Zapier"</span></p>
        <p className="flex items-center gap-1.5 px-3 pb-1.5 pt-1 text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> 201 Created
        </p>
      </div>
    </div>
  );
}

function RealtimeArt() {
  const [step, ref] = useLoop(2, 1600, 1);
  return (
    <div ref={ref} className="absolute inset-0 flex items-center justify-center gap-3 px-5">
      {['Tú', 'Tu equipo'].map((who, i) => (
        <div key={who} className="w-32 rounded-lg border border-line bg-canvas p-2">
          <p className="mb-1.5 flex items-center gap-1 text-[9px] text-subtle">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {who}
          </p>
          <div className="space-y-1">
            <AnimatePresence>
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.18 } }}
                  exit={{ opacity: 0 }}
                  className="rounded border border-accent/60 bg-[#1a1d33] px-1.5 py-1 text-[9px] text-fg"
                >
                  Camila Fuentes
                </motion.div>
              )}
            </AnimatePresence>
            <div className="h-5 rounded border border-line bg-surface" />
            <div className="h-5 rounded border border-line bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SecurityArt() {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-5">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full border border-accent/30"
          animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
        />
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10 text-accent-soft">
          <Lock size={26} />
        </span>
      </div>
    </div>
  );
}

// ---- Section ------------------------------------------------------------------

export function Bento() {
  return (
    <section id="funciones" className="scroll-mt-16 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Funciones"
          title={
            <>
              Todo lo que necesitas para vender.{' '}
              <span className="text-muted">Nada que estorbe.</span>
            </>
          }
          body="Herramientas simples que se usan todos los días, pensadas para quienes venden sin un equipo de operaciones."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <BentoCard
            className="md:col-span-2 lg:col-span-4"
            icon={SquareKanban}
            title="Tablero Kanban"
            body="Arrastra cada lead entre Nuevo, En Contacto, Propuesta, Ganado y Perdido. Todo tu pipeline, con valores, de un vistazo."
          >
            <KanbanArt />
          </BentoCard>
          <BentoCard
            className="lg:col-span-2"
            icon={Sun}
            title="Vista Hoy"
            body="Recordatorios vencidos, leads nuevos sin atender y los que se están enfriando: tu lista del día."
          >
            <TodayArt />
          </BentoCard>
          <BentoCard
            className="lg:col-span-2"
            icon={MessageCircle}
            title="WhatsApp en un clic"
            body="Abre el chat con un mensaje listo y el contacto queda registrado en el historial del lead."
          >
            <WhatsAppArt />
          </BentoCard>
          <BentoCard
            className="lg:col-span-2"
            icon={FileText}
            title="Formulario para tu web"
            body="Diséñalo, copia el código y pégalo en Wix, WordPress o Shopify. Cada envío es un lead."
          >
            <FormArt />
          </BentoCard>
          <BentoCard
            className="lg:col-span-2"
            icon={FileSpreadsheet}
            title="Importa tu Excel"
            body="Sube tu planilla en CSV: detectamos las columnas solas y omitimos los duplicados."
          >
            <ImportArt />
          </BentoCard>
          <BentoCard
            className="lg:col-span-2"
            art="h-40"
            icon={Webhook}
            title="Webhook y automatizaciones"
            body="Conecta Zapier, Make, n8n o Typeform con una URL y una clave por empresa."
          >
            <WebhookArt />
          </BentoCard>
          <BentoCard
            className="lg:col-span-2"
            art="h-40"
            icon={Zap}
            title="Tiempo real"
            body="Cada cambio aparece en las pantallas de todo el equipo, sin refrescar."
          >
            <RealtimeArt />
          </BentoCard>
          <BentoCard
            className="lg:col-span-2"
            art="h-40"
            icon={ShieldCheck}
            title="Privado y seguro"
            body="Un espacio aislado por empresa, correos verificados y contraseñas cifradas."
          >
            <SecurityArt />
          </BentoCard>
        </div>
      </div>
    </section>
  );
}
