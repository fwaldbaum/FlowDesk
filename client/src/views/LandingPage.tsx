import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  ArrowRight, Bell, Briefcase, Building2, Clock, Lightbulb, Search, Settings, ShieldCheck,
  SquareKanban, Users, Webhook, Zap,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Logo, LogoMark } from '../components/Logo';
import { STATUS_BY_ID } from '../lib/constants';
import type { Status } from '../lib/types';

/** Primary call to action adapts to where the visitor is in the funnel. */
function usePrimaryCta() {
  const { status, setupRequired } = useAuth();
  if (status === 'authenticated') return { to: '/app', label: 'Ir al tablero' };
  if (setupRequired) return { to: '/registro', label: 'Crear mi espacio' };
  return { to: '/login', label: 'Iniciar sesión' };
}

function CtaLink({ to, children, variant = 'primary', className }: {
  to: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}) {
  const cls = clsx(
    'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors',
    variant === 'primary'
      ? 'bg-accent text-white hover:bg-accent-hover'
      : 'border border-line bg-surface text-fg hover:border-line-strong hover:bg-raised',
    className,
  );
  return to.startsWith('#') ? <a href={to} className={cls}>{children}</a> : <Link to={to} className={cls}>{children}</Link>;
}

function Nav() {
  const { status, setupRequired } = useAuth();
  const authed = status === 'authenticated';
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 md:px-6">
        <Link to="/" aria-label="FlowDesk, inicio">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-5 text-[13px] text-muted md:flex">
          <a href="#para-quien" className="transition-colors hover:text-fg">Para quién</a>
          <a href="#funciones" className="transition-colors hover:text-fg">Funciones</a>
          <a href="#como-funciona" className="transition-colors hover:text-fg">Cómo funciona</a>
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
              {setupRequired && (
                <CtaLink to="/registro" className="h-8 px-3 text-[13px]">Empezar</CtaLink>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ---- Product preview (static, decorative) -------------------------------------

const PREVIEW: { status: Status; total: string; cards: { name: string; meta: string; value: string; when: string; live?: boolean }[] }[] = [
  {
    status: 'new',
    total: '$9.200',
    cards: [
      { name: 'Valentina Rojas', meta: 'Estudio Norte · Formulario web', value: '$1.800', when: 'justo ahora', live: true },
      { name: 'Andrés Salinas', meta: 'Salinas Arquitectos · LinkedIn', value: '$5.400', when: 'Sin contacto' },
      { name: 'Lucía Paredes', meta: 'Clínica Sonríe · Google Ads', value: '$2.000', when: 'Sin contacto' },
    ],
  },
  {
    status: 'contacted',
    total: '$9.650',
    cards: [
      { name: 'Martín Vidal', meta: 'Vidal Transportes · Referido', value: '$8.900', when: 'ayer' },
      { name: 'Isidora Campos', meta: 'Yoga Prana · Instagram', value: '$750', when: 'hace 5 días' },
    ],
  },
  {
    status: 'proposal',
    total: '$6.700',
    cards: [
      { name: 'Felipe Araya', meta: 'Araya Contadores · Web', value: '$2.600', when: 'ayer' },
      { name: 'Josefina Lagos', meta: 'Mapuche Arte · Feria', value: '$4.100', when: 'hace 3 días' },
    ],
  },
  {
    status: 'won',
    total: '$12.500',
    cards: [{ name: 'Benjamín Rojas', meta: 'Rojas Ferretería · Referido', value: '$12.500', when: 'la semana pasada' }],
  },
];

function AppPreview() {
  return (
    <div aria-hidden className="relative mx-auto max-w-5xl">
      {/* Single, faint glow to lift the frame off the background */}
      <div className="absolute -inset-x-10 -top-10 bottom-1/2 rounded-[48px] bg-accent/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-xl border border-line-strong/80 bg-canvas shadow-overlay">
        <div className="flex">
          <div className="hidden w-12 shrink-0 flex-col items-center gap-3 border-r border-line py-3 sm:flex">
            <LogoMark size={20} />
            <span className="mt-2 rounded-md bg-raised p-1.5 text-fg"><SquareKanban size={14} /></span>
            <span className="p-1.5 text-subtle"><Users size={14} /></span>
            <span className="p-1.5 text-subtle"><Settings size={14} /></span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex h-11 items-center gap-3 border-b border-line px-4">
              <span className="text-[13px] font-semibold text-fg">Tablero</span>
              <span className="hidden text-2xs text-subtle md:inline">Pipeline abierto $25.550 / Ganado $12.500</span>
              <span className="ml-auto hidden h-6 w-40 items-center gap-1.5 rounded-md border border-line px-2 text-2xs text-subtle sm:flex">
                <Search size={11} /> Buscar leads…
              </span>
              <span className="rounded-md bg-accent px-2 py-1 text-2xs font-medium text-white">+ Nuevo Lead</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 p-3 md:grid-cols-4">
              {PREVIEW.map((col, i) => (
                <div key={col.status} className={clsx('rounded-lg border border-line/70 bg-surface/40 p-1.5', i > 1 && 'hidden md:block')}>
                  <div className="flex items-center gap-1.5 px-1.5 pb-2 pt-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_BY_ID[col.status].color }} />
                    <span className="truncate text-2xs font-medium text-fg">{STATUS_BY_ID[col.status].label}</span>
                    <span className="rounded bg-raised px-1 text-[10px] text-muted">{col.cards.length}</span>
                    <span className="ml-auto text-[10px] text-subtle">{col.total}</span>
                  </div>
                  <div className="space-y-1.5">
                    {col.cards.map((c) => (
                      <div
                        key={c.name}
                        className={clsx(
                          'rounded-md border bg-surface px-2.5 py-2',
                          c.live ? 'border-accent/70 bg-[#1a1d33]' : 'border-line',
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-[11px] font-medium text-fg">{c.name}</p>
                          {c.live && <span className="shrink-0 text-[9px] font-medium text-accent-soft">Webhook</span>}
                        </div>
                        <p className="truncate text-[10px] text-muted">{c.meta}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[11px] font-medium tabular-nums text-fg">{c.value}</span>
                          <span className="flex items-center gap-0.5 text-[9px] text-subtle">
                            <Clock size={8} /> {c.when}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Realtime toast */}
        <div className="absolute bottom-3 right-3 hidden w-60 items-start gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 shadow-overlay sm:flex">
          <Webhook size={14} className="mt-0.5 text-accent-soft" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-fg">Nuevo lead vía webhook</p>
            <p className="truncate text-[10px] text-muted">Valentina Rojas · Formulario web</p>
          </div>
        </div>
      </div>
      {/* Fade into the page */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-canvas to-transparent" />
    </div>
  );
}

// ---- Content -----------------------------------------------------------------

const AUDIENCES = [
  {
    icon: Lightbulb,
    title: 'Emprendedores',
    body: 'Deja de perder consultas entre WhatsApp, correo y notas sueltas. Todo llega a un solo lugar.',
  },
  {
    icon: Briefcase,
    title: 'Agencias y freelancers',
    body: 'Sigue cada propuesta enviada y sabe qué cliente necesita una llamada hoy.',
  },
  {
    icon: Building2,
    title: 'Servicios profesionales',
    body: 'Clínicas, estudios y consultoras: registra cada conversación y no olvides ningún seguimiento.',
  },
  {
    icon: Users,
    title: 'Pymes con equipo comercial',
    body: 'Todo el equipo trabaja sobre el mismo tablero, actualizado en tiempo real.',
  },
];

const FEATURES = [
  {
    icon: SquareKanban,
    title: 'Tablero Kanban',
    body: 'Arrastra cada lead entre Nuevo, En Contacto, Propuesta, Ganado y Perdido. Todo el pipeline de un vistazo.',
  },
  {
    icon: Webhook,
    title: 'Captura automática',
    body: 'Un endpoint webhook recibe leads desde tu sitio web, formularios o herramientas de automatización.',
  },
  {
    icon: Zap,
    title: 'Tiempo real',
    body: 'Los leads nuevos y cada cambio aparecen al instante en todas las pantallas, sin refrescar.',
  },
  {
    icon: Bell,
    title: 'Notas y recordatorios',
    body: 'Historial de cada conversación y recordatorios con fecha para que nadie quede esperando respuesta.',
  },
  {
    icon: Search,
    title: 'Búsqueda instantánea',
    body: 'Encuentra cualquier contacto por nombre, empresa, email o teléfono. Con atajos de teclado.',
  },
  {
    icon: ShieldCheck,
    title: 'Acceso seguro',
    body: 'Cuentas para tu equipo, sesiones protegidas y un webhook que puedes blindar con clave secreta.',
  },
];

const STEPS = [
  {
    title: 'Conecta tus fuentes',
    body: 'Apunta tu formulario web, Typeform, Zapier, Make o n8n al webhook de FlowDesk. Una URL, un JSON.',
  },
  {
    title: 'Organiza y haz seguimiento',
    body: 'Cada lead entra en Nuevo Lead. Muévelo de etapa, agrega notas de cada llamada y programa recordatorios.',
  },
  {
    title: 'Cierra y mide',
    body: 'Sigue el valor de tu pipeline abierto, lo ganado y tu tasa de cierre, siempre actualizados.',
  },
];

const SOURCES = ['Formularios web', 'Typeform', 'Zapier', 'Make', 'n8n', 'Webflow'];

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-accent-soft">{eyebrow}</p>
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-fg md:text-4xl">{title}</h2>
      {body && <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-muted">{body}</p>}
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
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent-soft">POST</span>
        <code className="truncate font-mono text-xs text-muted">/api/webhooks/lead</code>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-6 text-fg/90">
        {'{\n'}
        {rows.map(([key, val], i) => (
          <span key={key}>
            {'  '}
            {k(key)}: {v(val)}
            {i < rows.length - 1 ? ',' : ''}
            {'\n'}
          </span>
        ))}
        {'}'}
      </pre>
      <div className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="font-mono text-emerald-400">201 Created</span>
        <span className="text-subtle">· aparece al instante en Nuevo Lead</span>
      </div>
    </div>
  );
}

export function LandingPage() {
  const cta = usePrimaryCta();

  return (
    <div className="min-h-full bg-canvas text-fg">
      <Nav />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[640px]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 md:px-6 md:pt-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-xs text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-soft" />
                CRM Kanban para emprendedores y pequeñas empresas
              </p>
              <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-fg sm:text-5xl md:text-6xl">
                Convierte leads en clientes, sin perder ninguno.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted md:text-lg">
                FlowDesk reúne los contactos que llegan desde tu web, formularios y campañas en un tablero claro.
                Haz seguimiento, agenda recordatorios y lleva cada oportunidad hasta el cierre.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <CtaLink to={cta.to} className="w-full sm:w-auto">
                  {cta.label} <ArrowRight size={15} />
                </CtaLink>
                <CtaLink to="#como-funciona" variant="secondary" className="w-full sm:w-auto">
                  Ver cómo funciona
                </CtaLink>
              </div>
            </div>

            <div className="mt-16 md:mt-20">
              <AppPreview />
            </div>

            <div className="mt-14 flex flex-col items-center gap-4">
              <p className="text-xs text-subtle">Recibe leads desde</p>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                {SOURCES.map((s) => (
                  <span key={s} className="text-sm font-semibold tracking-tight text-subtle">{s}</span>
                ))}
              </div>
            </div>
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
              {AUDIENCES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border border-line bg-surface/60 p-5">
                  <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-raised text-fg">
                    <Icon size={17} strokeWidth={1.75} />
                  </span>
                  <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              ))}
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
            <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="bg-canvas p-6 md:p-7">
                  <Icon size={18} strokeWidth={1.75} className="mb-4 text-accent-soft" />
                  <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="scroll-mt-14 border-t border-line/60 py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-accent-soft">Cómo funciona</p>
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-fg md:text-4xl">
                De formulario a cliente en tres pasos
              </h2>
              <ol className="mt-10 space-y-8">
                {STEPS.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-strong font-mono text-xs text-muted">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-[15px] font-semibold text-fg">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <CodeSample />
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-line/60 py-24">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-fg md:text-4xl">
              Ordena tu pipeline hoy
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
              Crea tu espacio, conecta tu primer formulario y empieza a dar seguimiento a cada oportunidad.
            </p>
            <div className="mt-8 flex justify-center">
              <CtaLink to={cta.to}>
                {cta.label} <ArrowRight size={15} />
              </CtaLink>
            </div>
          </div>
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
            <Link to="/login" className="hover:text-fg">Iniciar sesión</Link>
            <span className="text-subtle">© {new Date().getFullYear()} FlowDesk</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
