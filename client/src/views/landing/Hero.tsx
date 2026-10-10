import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight, Check, Clock, CreditCard, Lock, LockKeyhole, MessageCircle, Search, Settings, SquareKanban, Sun,
  Timer, Users, Webhook,
} from 'lucide-react';
import { LogoMark } from '../../components/Logo';
import { ease, spring } from '../../components/motion';
import { STATUS_BY_ID } from '../../lib/constants';
import type { Status } from '../../lib/types';
import { CtaLink, usePrimaryCta } from './shared';

// ---- Live board demo -------------------------------------------------------------

type DemoCard = { id: string; name: string; meta: string; value: string; when: string; live?: boolean };
type DemoBoard = Record<Exclude<Status, 'lost'>, DemoCard[]>;

const INITIAL: DemoBoard = {
  new: [
    { id: 'a', name: 'Andrés Salinas', meta: 'Salinas Arquitectos · LinkedIn', value: '$5.400', when: 'Sin contacto' },
    { id: 'b', name: 'Lucía Paredes', meta: 'Clínica Sonríe · Google Ads', value: '$2.000', when: 'Sin contacto' },
  ],
  contacted: [
    { id: 'c', name: 'Martín Vidal', meta: 'Vidal Transportes · Referido', value: '$8.900', when: 'ayer' },
    { id: 'd', name: 'Isidora Campos', meta: 'Yoga Prana · Instagram', value: '$750', when: 'hace 5 días' },
  ],
  proposal: [
    { id: 'e', name: 'Felipe Araya', meta: 'Araya Contadores · Web', value: '$2.600', when: 'ayer' },
    { id: 'f', name: 'Josefina Lagos', meta: 'Mapuche Arte · Feria', value: '$4.100', when: 'hace 3 días' },
  ],
  won: [{ id: 'g', name: 'Benjamín Rojas', meta: 'Rojas Ferretería · Referido', value: '$12.500', when: 'la semana pasada' }],
};

const INCOMING: DemoCard[] = [
  { id: 'n1', name: 'Valentina Rojas', meta: 'Estudio Norte · Formulario web', value: '$1.800', when: 'justo ahora', live: true },
  { id: 'n2', name: 'Tomás Herrera', meta: 'Herrera Logística · Webhook', value: '$4.200', when: 'justo ahora', live: true },
  { id: 'n3', name: 'Camila Fuentes', meta: 'Café Origen · Instagram Ads', value: '$950', when: 'justo ahora', live: true },
];

/** Cycles through a short story: a lead arrives, a deal moves forward, another one closes. */
function useDemoBoard() {
  const [board, setBoard] = useState<DemoBoard>(INITIAL);
  const [toast, setToast] = useState<DemoCard | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      setBoard((b) => {
        const next: DemoBoard = { new: [...b.new], contacted: [...b.contacted], proposal: [...b.proposal], won: [...b.won] };
        const phase = step % 3;
        if (phase === 1) {
          const card = INCOMING[Math.floor(step / 3) % INCOMING.length]!;
          const fresh = { ...card, id: `${card.id}-${step}` };
          next.new = [fresh, ...next.new.map((c) => ({ ...c, live: false }))].slice(0, 3);
          setToast(fresh);
        } else if (phase === 2 && next.new.length > 1) {
          const moved = next.new.pop()!;
          next.contacted = [{ ...moved, when: 'justo ahora', live: false }, ...next.contacted].slice(0, 3);
        } else if (phase === 0 && next.proposal.length) {
          const won = next.proposal.pop()!;
          next.won = [{ ...won, when: 'justo ahora' }, ...next.won].slice(0, 2);
          const promoted = next.contacted.pop();
          if (promoted) next.proposal = [{ ...promoted, when: 'justo ahora' }, ...next.proposal];
        }
        return next;
      });
    }, 2600);
    return () => window.clearInterval(timer);
  }, [reduced]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  return { board, toast };
}

const SIDEBAR = [
  { icon: Sun, label: 'Hoy' },
  { icon: SquareKanban, label: 'Tablero', active: true },
  { icon: Users, label: 'Contactos' },
  { icon: Settings, label: 'Configuración' },
];

function float(delay: number) {
  return {
    animate: { y: [0, -8, 0] },
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const, delay },
  };
}

function ProductPreview() {
  const { board, toast } = useDemoBoard();
  const columns = (Object.keys(board) as (keyof DemoBoard)[]).map((status) => ({ status, cards: board[status] }));

  return (
    <div aria-hidden className="relative mx-auto max-w-5xl [perspective:2200px]">
      <div className="absolute -inset-x-20 -top-20 bottom-1/3 rounded-[80px] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.28),transparent_65%)] blur-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 48, rotateX: 14 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.2, ease, delay: 0.35 }}
        className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1.5 shadow-[0_50px_140px_-40px_rgba(0,0,0,0.95)] ring-1 ring-black/40 backdrop-blur"
      >
        <div className="relative overflow-hidden rounded-xl border border-line-strong/70 bg-canvas">
          {/* Window chrome */}
          <div className="flex h-9 items-center gap-1.5 border-b border-line bg-surface/60 px-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3a4152]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#3a4152]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#3a4152]" />
            <span className="mx-auto flex h-5 items-center gap-1.5 rounded-md border border-line bg-canvas px-3 text-[10px] text-subtle">
              <Lock size={9} /> FlowDesk · Tablero
            </span>
            <span className="w-12" />
          </div>

          <div className="flex">
            <div className="hidden w-12 shrink-0 flex-col gap-1 border-r border-line p-2 sm:flex lg:w-40">
              <div className="mb-2 flex items-center gap-2 px-1 py-1">
                <LogoMark size={18} />
                <span className="hidden text-[12px] text-fg lg:inline"><b>Flow</b>Desk</span>
              </div>
              {SIDEBAR.map(({ icon: Icon, label, active }) => (
                <span
                  key={label}
                  className={clsx(
                    'flex items-center gap-2 rounded-md px-1.5 py-1.5 text-[11px]',
                    active ? 'border border-line bg-raised text-fg' : 'text-subtle',
                  )}
                >
                  <Icon size={13} className="shrink-0" />
                  <span className="hidden lg:inline">{label}</span>
                  {label === 'Hoy' && (
                    <span className="ml-auto hidden rounded-full bg-red-500/90 px-1.5 text-[9px] font-semibold text-white lg:inline">2</span>
                  )}
                </span>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex h-11 items-center gap-3 border-b border-line px-4">
                <span className="text-[13px] font-semibold text-fg">Tablero</span>
                <span className="hidden items-center gap-1.5 text-2xs text-subtle md:flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> En vivo
                </span>
                <span className="ml-auto hidden h-6 w-40 items-center gap-1.5 rounded-md border border-line px-2 text-2xs text-subtle sm:flex">
                  <Search size={11} /> Buscar leads…
                </span>
                <span className="rounded-md bg-accent px-2 py-1 text-2xs font-medium text-white">+ Nuevo Lead</span>
              </div>
              <LayoutGroup>
                <div className="grid min-h-[300px] grid-cols-2 gap-2.5 p-3 md:grid-cols-4">
                  {columns.map((col, i) => (
                    <div key={col.status} className={clsx('rounded-lg border border-line/70 bg-surface/40 p-1.5', i > 1 && 'hidden md:block')}>
                      <div className="flex items-center gap-1.5 px-1.5 pb-2 pt-1">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_BY_ID[col.status].color }} />
                        <span className="truncate text-2xs font-medium text-fg">{STATUS_BY_ID[col.status].label}</span>
                        <motion.span key={col.cards.length} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="rounded bg-raised px-1 text-[10px] text-muted">
                          {col.cards.length}
                        </motion.span>
                      </div>
                      <div className="space-y-1.5">
                        <AnimatePresence initial={false} mode="popLayout">
                          {col.cards.map((c) => (
                            <motion.div
                              key={c.id}
                              layoutId={c.id}
                              layout
                              initial={{ opacity: 0, y: -12, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={spring}
                              className={clsx(
                                'rounded-md border bg-surface px-2.5 py-2 transition-colors duration-700',
                                c.live ? 'border-accent/70 bg-[#1a1d33]' : 'border-line',
                              )}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <p className="truncate text-[11px] font-medium text-fg">{c.name}</p>
                                {c.live && <span className="shrink-0 text-[9px] font-medium text-accent-soft">Nuevo</span>}
                              </div>
                              <p className="truncate text-[10px] text-muted">{c.meta}</p>
                              <div className="mt-1.5 flex items-center justify-between">
                                <span className="text-[11px] font-medium tabular-nums text-fg">{c.value}</span>
                                <span className="flex items-center gap-0.5 text-[9px] text-subtle">
                                  <Clock size={8} /> {c.when}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              </LayoutGroup>
            </div>
          </div>

          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: spring }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                className="absolute bottom-3 right-3 hidden w-60 items-start xl:right-[calc(50%-7.5rem)] gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 shadow-overlay sm:flex"
              >
                <Webhook size={14} className="mt-0.5 text-accent-soft" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-fg">Nuevo lead vía webhook</p>
                  <p className="truncate text-[10px] text-muted">{toast.name} · {toast.meta.split(' · ')[1]}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Floating callouts: two real features, outside the frame on wide screens */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease, delay: 1.1 }}
        className="absolute -left-20 bottom-20 hidden w-56 xl:block"
      >
        <motion.div {...float(0)} className="rounded-xl border border-line-strong/80 bg-surface/95 p-3 shadow-overlay backdrop-blur">
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease, delay: 1.3 }}
        className="absolute -right-20 top-52 hidden w-56 xl:block"
      >
        <motion.div {...float(1.5)} className="overflow-hidden rounded-xl border border-line-strong/80 bg-[#0b141a] shadow-overlay">
          <div className="flex items-center gap-2 border-b border-white/5 bg-[#1f2c33] px-3 py-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2a3942] text-[8px] font-semibold text-[#e9edef]">VR</span>
            <span className="text-[10px] font-medium text-[#e9edef]">Valentina Rojas</span>
            <MessageCircle size={11} className="ml-auto text-emerald-400" />
          </div>
          <div className="p-3">
            <div className="ml-auto max-w-[90%] rounded-lg rounded-tr-sm bg-[#005c4b] px-2.5 py-1.5 text-[10px] leading-relaxed text-[#e9edef]">
              Hola Valentina, te escribo de Estudio Norte. ¿Tienes unos minutos para conversar?
              <span className="mt-0.5 block text-right text-[8px] text-[#e9edef]/60">ahora</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-28 bg-gradient-to-t from-canvas to-transparent" />
    </div>
  );
}

// ---- Hero --------------------------------------------------------------------

const SOURCES = ['Formularios web', 'WhatsApp', 'Typeform', 'Zapier', 'Make', 'n8n', 'Webflow', 'WordPress', 'Shopify', 'Excel'];

const heroItem = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease } },
};

const CHIPS = [
  { icon: CreditCard, label: 'Sin tarjeta de crédito' },
  { icon: Timer, label: 'Listo en minutos' },
  { icon: LockKeyhole, label: 'Un espacio privado por empresa' },
];

export function Hero() {
  const cta = usePrimaryCta();
  return (
    <section className="relative -mt-16 overflow-hidden pt-16">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-grid absolute inset-x-0 top-0 h-[760px]" />
        <motion.div
          className="absolute left-1/2 top-[-200px] h-[560px] w-[960px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(79,70,229,0.24),transparent)]"
          animate={{ x: ['-50%', '-46%', '-54%', '-50%'], scale: [1, 1.06, 0.97, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-[-140px] top-[140px] h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.14),transparent)]"
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 md:px-6 md:pt-24">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.09 } } }}
        >
          <motion.a
            variants={heroItem}
            href="#funciones"
            className="group mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 py-1 pl-1 pr-3 text-xs text-muted backdrop-blur transition-colors hover:border-line-strong hover:text-fg"
          >
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-medium text-accent-soft">Nuevo</span>
            Vista Hoy, WhatsApp en un clic y formulario para tu web
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
          </motion.a>
          <motion.h1
            variants={heroItem}
            className="text-balance text-[42px] font-semibold leading-[1.04] tracking-[-0.04em] text-fg sm:text-6xl md:text-[72px]"
          >
            Convierte leads en clientes,{' '}
            <span className="bg-gradient-to-r from-[#93A5FF] via-[#A5B4FC] to-[#60A5FA] bg-clip-text text-transparent">
              sin perder ninguno.
            </span>
          </motion.h1>
          <motion.p variants={heroItem} className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted md:text-lg">
            FlowDesk reúne los contactos que llegan desde tu web, formularios y campañas en un tablero claro.
            Haz seguimiento, escríbeles por WhatsApp y lleva cada oportunidad hasta el cierre.
          </motion.p>
          <motion.div variants={heroItem} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CtaLink to={cta.to} size="lg" className="w-full sm:w-auto">
              {cta.label}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </CtaLink>
            <CtaLink to="#como-funciona" variant="secondary" size="lg" className="w-full sm:w-auto">
              Ver cómo funciona
            </CtaLink>
          </motion.div>
          <motion.ul variants={heroItem} className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-subtle">
            {CHIPS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon size={13} className="text-muted" /> {label}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <div className="mt-16 md:mt-20">
          <ProductPreview />
        </div>

        <div className="mt-12 flex flex-col items-center gap-5">
          <p className="text-xs text-subtle">Recibe leads desde</p>
          <div className="relative w-full max-w-4xl overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]">
            <motion.div
              className="flex w-max gap-12"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            >
              {[...SOURCES, ...SOURCES].map((s, i) => (
                <span key={i} className="whitespace-nowrap text-sm font-semibold tracking-tight text-subtle">{s}</span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
