import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import {
  ArrowRight, Bell, Briefcase, Building2, ChevronDown, Clock, FileSpreadsheet, FileText, Lightbulb,
  MessageCircle, Search, Settings, ShieldCheck, SquareKanban, Sun, Users, Webhook, Zap,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Logo, LogoMark } from '../components/Logo';
import { ease, Reveal, spring } from '../components/motion';
import { STATUS_BY_ID } from '../lib/constants';
import type { Status } from '../lib/types';

/** Primary call to action adapts to where the visitor is in the funnel. */
function usePrimaryCta() {
  const { status } = useAuth();
  if (status === 'authenticated') return { to: '/app', label: 'Ir al tablero' };
  return { to: '/registro', label: 'Crear cuenta gratis' };
}

function CtaLink({ to, children, variant = 'primary', className }: {
  to: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}) {
  const cls = clsx(
    'group inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-all active:scale-[0.98]',
    variant === 'primary'
      ? 'bg-accent text-white shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_8px_24px_-8px_rgba(79,70,229,0.8)] hover:bg-accent-hover'
      : 'border border-line bg-surface/80 text-fg backdrop-blur hover:border-line-strong hover:bg-raised',
    className,
  );
  return to.startsWith('#') ? <a href={to} className={cls}>{children}</a> : <Link to={to} className={cls}>{children}</Link>;
}

function Nav() {
  const { status } = useAuth();
  const authed = status === 'authenticated';
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header
      className={clsx(
        'sticky top-0 z-30 border-b transition-colors duration-300',
        scrolled ? 'border-line/70 bg-canvas/80 backdrop-blur-md' : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 md:px-6">
        <Link to="/" aria-label="FlowDesk, inicio">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-5 text-[13px] text-muted md:flex">
          <a href="#funciones" className="transition-colors hover:text-fg">Funciones</a>
          <a href="#como-funciona" className="transition-colors hover:text-fg">Cómo funciona</a>
          <a href="#para-quien" className="transition-colors hover:text-fg">Para quién</a>
          <a href="#preguntas" className="transition-colors hover:text-fg">Preguntas</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {authed ? (
            <CtaLink to="/app" className="h-8 px-3 text-[13px]">
              Ir al tablero <ArrowRight size={14} />
            </CtaLink>
          ) : (
            <>
              <Link to="/login" className="px-2 text-[13px] font-medium text-muted transition-colors hover:text-fg">
                Iniciar sesión
              </Link>
              <CtaLink to="/registro" className="h-8 px-3 text-[13px]">Crear cuenta</CtaLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ---- Live product demo (decorative) --------------------------------------------

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

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  return { board, toast };
}

function AppPreview() {
  const { board, toast } = useDemoBoard();
  const columns = (Object.keys(board) as (keyof DemoBoard)[]).map((status) => ({ status, cards: board[status] }));

  return (
    <div aria-hidden className="relative mx-auto max-w-5xl [perspective:2000px]">
      <div className="absolute -inset-x-16 -top-16 bottom-1/3 rounded-[64px] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.25),transparent_65%)] blur-2xl" />
      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.1, ease, delay: 0.35 }}
        className="relative overflow-hidden rounded-xl border border-line-strong/80 bg-canvas shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] ring-1 ring-white/[0.03]"
      >
        <div className="flex">
          <div className="hidden w-12 shrink-0 flex-col items-center gap-3 border-r border-line py-3 sm:flex">
            <LogoMark size={20} />
            <span className="mt-2 p-1.5 text-subtle"><Sun size={14} /></span>
            <span className="rounded-md bg-raised p-1.5 text-fg"><SquareKanban size={14} /></span>
            <span className="p-1.5 text-subtle"><Users size={14} /></span>
            <span className="p-1.5 text-subtle"><Settings size={14} /></span>
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
              className="absolute bottom-3 right-3 hidden w-60 items-start gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 shadow-overlay sm:flex"
            >
              <Webhook size={14} className="mt-0.5 text-accent-soft" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-fg">Nuevo lead vía webhook</p>
                <p className="truncate text-[10px] text-muted">{toast.name} · {toast.meta.split(' · ')[1]}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-canvas to-transparent" />
    </div>
  );
}

// ---- Content ---------------------------------------------------------------------

const AUDIENCES = [
  { icon: Lightbulb, title: 'Emprendedores', body: 'Deja de perder consultas entre WhatsApp, correo y notas sueltas. Todo llega a un solo lugar.' },
  { icon: Briefcase, title: 'Agencias y freelancers', body: 'Sigue cada propuesta enviada y sabe qué cliente necesita una llamada hoy.' },
  { icon: Building2, title: 'Servicios profesionales', body: 'Clínicas, estudios y consultoras: registra cada conversación y no olvides ningún seguimiento.' },
  { icon: Users, title: 'Pymes con equipo comercial', body: 'Todo el equipo trabaja sobre el mismo tablero, actualizado en tiempo real.' },
];

const FEATURES = [
  { icon: SquareKanban, title: 'Tablero Kanban', body: 'Arrastra cada lead entre Nuevo, En Contacto, Propuesta, Ganado y Perdido. Todo el pipeline de un vistazo.' },
  { icon: Sun, title: 'Vista Hoy', body: 'Recordatorios vencidos, leads nuevos sin atender y los que se están enfriando. Tu lista del día, sin pensar.' },
  { icon: MessageCircle, title: 'WhatsApp en un clic', body: 'Abre el chat con un mensaje listo y el contacto queda registrado en el historial del lead.' },
  { icon: FileText, title: 'Formulario para tu web', body: 'Diseña tu formulario, copia el código y pégalo en Wix, WordPress o Shopify. Cada envío es un lead.' },
  { icon: Webhook, title: 'Webhook y automatizaciones', body: 'Conecta Zapier, Make, n8n o Typeform con una URL. Los leads aparecen al instante.' },
  { icon: FileSpreadsheet, title: 'Importa tu Excel', body: 'Sube tu planilla en CSV, detectamos las columnas solas y omitimos los duplicados.' },
  { icon: Bell, title: 'Notas y recordatorios', body: 'Historial de cada conversación y recordatorios con fecha para que nadie quede esperando.' },
  { icon: Zap, title: 'Tiempo real', body: 'Cada cambio aparece en todas las pantallas del equipo, sin refrescar.' },
  { icon: ShieldCheck, title: 'Privado y seguro', body: 'Un espacio aislado por empresa, correos verificados y contraseñas cifradas.' },
];

const STEPS = [
  { title: 'Conecta tus fuentes', body: 'Pega el formulario en tu web o apunta Zapier, Make o n8n al webhook. ¿Ya tienes una planilla? Impórtala.' },
  { title: 'Atiende lo urgente', body: 'Abre «Hoy»: recordatorios, leads nuevos y los que se enfrían. Escríbeles por WhatsApp en un clic.' },
  { title: 'Cierra y mide', body: 'Mueve cada oportunidad por el tablero y sigue tu pipeline abierto, lo ganado y tu tasa de cierre.' },
];

const FAQ = [
  { q: '¿Mis datos están seguros?', a: 'Cada empresa tiene un espacio privado: solo tú y las personas que invites ven tus leads. Las contraseñas se guardan cifradas y verificamos el correo de cada cuenta.' },
  { q: '¿Puedo traer mis contactos de Excel o Google Sheets?', a: 'Sí. Exporta la hoja como CSV y súbela en Contactos → Importar. Detectamos las columnas automáticamente y omitimos los duplicados.' },
  { q: '¿Cómo capturo los leads de mi sitio web?', a: 'Personaliza el formulario en Configuración, copia el código y pégalo en tu web. También puedes usar el webhook con Zapier, Make, n8n o Typeform.' },
  { q: '¿Puedo trabajar con mi equipo?', a: 'Sí. Agrega a tu equipo desde Configuración → Equipo; todos ven el mismo tablero actualizado en tiempo real.' },
  { q: '¿Funciona en el celular?', a: 'Sí. FlowDesk se adapta a cualquier pantalla, así que puedes revisar «Hoy» y escribirle a un lead por WhatsApp desde el teléfono.' },
];

const SOURCES = ['Formularios web', 'WhatsApp', 'Typeform', 'Zapier', 'Make', 'n8n', 'Webflow', 'WordPress', 'Shopify', 'Excel'];

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-accent-soft">{eyebrow}</p>
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-fg md:text-4xl">{title}</h2>
      {body && <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-muted">{body}</p>}
    </Reveal>
  );
}

/** Feature tile with a soft highlight that follows the cursor. */
function SpotlightCard({ children }: { children: ReactNode }) {
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
  };
  return (
    <div
      onMouseMove={onMove}
      className="group relative h-full overflow-hidden bg-canvas p-6 transition-colors md:p-7"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:radial-gradient(320px_circle_at_var(--x)_var(--y),rgba(99,102,241,0.12),transparent_60%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}

function CodeSample() {
  const k = (s: string) => <span className="text-accent-soft">"{s}"</span>;
  const v = (s: string) => <span className="text-emerald-300/90">"{s}"</span>;
  const rows: [string, string][] = [
    ['name', 'Valentina Rojas'],
    ['email', 'valentina@estudionorte.cl'],
    ['phone', '+56 9 5555 0101'],
    ['source', 'Formulario web'],
    ['notes', 'Quiere cotizar el plan anual'],
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent-soft">POST</span>
        <code className="truncate font-mono text-xs text-muted">/api/webhooks/lead</code>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-6 text-fg/90">
        {'{\n'}
        {rows.map(([key, val], i) => (
          <motion.span
            key={key}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.12 }}
          >
            {'  '}
            {k(key)}: {v(val)}
            {i < rows.length - 1 ? ',' : ''}
            {'\n'}
          </motion.span>
        ))}
        {'}'}
      </pre>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.9 }}
        className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-xs"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="font-mono text-emerald-400">201 Created</span>
        <span className="text-subtle">· aparece al instante en Nuevo Lead</span>
      </motion.div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-[15px] font-medium text-fg"
      >
        {q}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease }} className="text-subtle">
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-8 text-sm leading-relaxed text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const heroItem = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease } },
};

export function LandingPage() {
  const cta = usePrimaryCta();

  return (
    <div className="min-h-full overflow-x-hidden bg-canvas text-fg">
      <Nav />

      <main>
        {/* Hero */}
        <section className="relative -mt-14 overflow-hidden pt-14">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="bg-grid absolute inset-x-0 top-0 h-[720px]" />
            <motion.div
              className="absolute left-1/2 top-[-180px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(79,70,229,0.22),transparent)]"
              animate={{ x: ['-50%', '-46%', '-54%', '-50%'], scale: [1, 1.06, 0.97, 1] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute right-[-120px] top-[120px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.14),transparent)]"
              animate={{ y: [0, 30, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 md:px-6 md:pt-24">
            <motion.div
              className="mx-auto max-w-4xl text-center"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.09 } } }}
            >
              <motion.p
                variants={heroItem}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs text-muted backdrop-blur"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-soft opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-soft" />
                </span>
                Nuevo: vista Hoy, WhatsApp en un clic y formulario para tu web
              </motion.p>
              <motion.h1
                variants={heroItem}
                className="text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.035em] text-fg sm:text-5xl md:text-[64px]"
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
                <CtaLink to={cta.to} className="w-full sm:w-auto">
                  {cta.label}
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </CtaLink>
                <CtaLink to="#como-funciona" variant="secondary" className="w-full sm:w-auto">
                  Ver cómo funciona
                </CtaLink>
              </motion.div>
              <motion.p variants={heroItem} className="mt-5 text-xs text-subtle">
                Sin tarjeta de crédito · Configuración en minutos · Tus datos en un espacio privado
              </motion.p>
            </motion.div>

            <div className="mt-16 md:mt-20">
              <AppPreview />
            </div>

            <div className="mt-14 flex flex-col items-center gap-5">
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

        {/* Features */}
        <section id="funciones" className="scroll-mt-14 border-t border-line/60 py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <SectionHeading
              eyebrow="Funciones"
              title="Todo lo necesario. Nada que estorbe."
              body="Una herramienta rápida y sobria, pensada para usarse todos los días."
            />
            <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }, i) => (
                <Reveal key={title} delay={(i % 3) * 0.06} y={10} className="h-full">
                  <SpotlightCard>
                    <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-accent-soft">
                      <Icon size={17} strokeWidth={1.75} />
                    </span>
                    <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                  </SpotlightCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="scroll-mt-14 border-t border-line/60 py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
            <div>
              <Reveal>
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-accent-soft">Cómo funciona</p>
                <h2 className="text-balance text-3xl font-semibold tracking-tight text-fg md:text-4xl">
                  De formulario a cliente en tres pasos
                </h2>
              </Reveal>
              <ol className="relative mt-10 space-y-8 before:absolute before:bottom-3 before:left-[13px] before:top-3 before:w-px before:bg-line">
                {STEPS.map((step, i) => (
                  <Reveal key={step.title} delay={0.1 + i * 0.12}>
                    <li className="relative flex gap-4">
                      <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-strong bg-canvas font-mono text-xs text-muted">
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="text-[15px] font-semibold text-fg">{step.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>
            <Reveal delay={0.15}>
              <CodeSample />
            </Reveal>
          </div>
        </section>

        {/* Audience */}
        <section id="para-quien" className="scroll-mt-14 border-t border-line/60 py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <SectionHeading
              eyebrow="Para quién"
              title="Hecho para quienes venden sin un equipo de operaciones"
              body="Si hoy tus clientes potenciales viven en una hoja de cálculo, el correo y el chat, FlowDesk es para ti."
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {AUDIENCES.map(({ icon: Icon, title, body }, i) => (
                <Reveal key={title} delay={i * 0.07}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={spring}
                    className="h-full rounded-xl border border-line bg-surface/60 p-5 transition-colors hover:border-line-strong"
                  >
                    <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-raised text-fg">
                      <Icon size={17} strokeWidth={1.75} />
                    </span>
                    <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="preguntas" className="scroll-mt-14 border-t border-line/60 py-24">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <SectionHeading eyebrow="Preguntas frecuentes" title="Lo que suelen preguntarnos" />
            <Reveal className="border-t border-line">
              {FAQ.map((f) => <FaqItem key={f.q} {...f} />)}
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden border-t border-line/60 py-24">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[-240px] mx-auto h-[420px] max-w-3xl rounded-full bg-[radial-gradient(closest-side,rgba(79,70,229,0.2),transparent)]" />
          <Reveal className="relative mx-auto max-w-3xl px-4 text-center md:px-6">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-fg md:text-5xl">Ordena tu pipeline hoy</h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
              Crea tu cuenta, conecta tu primer formulario y empieza a dar seguimiento a cada oportunidad.
            </p>
            <div className="mt-8 flex justify-center">
              <CtaLink to={cta.to}>
                {cta.label} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </CtaLink>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <Logo />
            <p className="mt-2 text-xs text-subtle">CRM ligero para emprendedores y pequeñas empresas.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
            <a href="#funciones" className="hover:text-fg">Funciones</a>
            <a href="#como-funciona" className="hover:text-fg">Cómo funciona</a>
            <a href="#preguntas" className="hover:text-fg">Preguntas</a>
            <Link to="/login" className="hover:text-fg">Iniciar sesión</Link>
            <span className="text-subtle">© {new Date().getFullYear()} FlowDesk</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
