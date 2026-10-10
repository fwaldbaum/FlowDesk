import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Briefcase, Building2, Check, Lightbulb, Plus, Users, X } from 'lucide-react';
import { Logo, LogoMark } from '../../components/Logo';
import { ease, Reveal, spring } from '../../components/motion';
import { CtaLink, Eyebrow, SectionHeading, spotlightHandlers, usePrimaryCta } from './shared';

// ---- Before / after ------------------------------------------------------------

const BEFORE = [
  'Consultas repartidas entre WhatsApp, correo, Instagram y una planilla',
  'Nadie sabe a quién hay que llamar hoy',
  'Seguimientos que se olvidan y clientes que se enfrían',
  'Cada persona del equipo trabaja con información distinta',
];

const AFTER = [
  'Cada lead entra solo a un tablero: formulario, webhook o importación',
  'La vista Hoy te dice a quién contactar y qué está vencido',
  'Recordatorios con fecha e historial completo de cada conversación',
  'Todo el equipo ve lo mismo, actualizado en tiempo real',
];

export function Compare() {
  return (
    <section className="border-t border-line/60 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Antes y después"
          title="Deja de perseguir clientes en cinco apps distintas"
          body="Lo que cambia cuando todos tus clientes potenciales viven en un solo lugar."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-line bg-surface/40 p-7">
              <p className="mb-5 text-sm font-semibold text-muted">Sin FlowDesk</p>
              <ul className="space-y-4">
                {BEFORE.map((t) => (
                  <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-muted">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line-strong text-subtle">
                      <X size={11} strokeWidth={2.5} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative h-full overflow-hidden rounded-2xl border border-accent/40 bg-surface p-7 shadow-[0_30px_80px_-40px_rgba(79,70,229,0.6)]">
              <div aria-hidden className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(79,70,229,0.22),transparent)]" />
              <p className="relative mb-5 flex items-center gap-2 text-sm font-semibold text-fg">
                <LogoMark size={16} /> Con FlowDesk
              </p>
              <ul className="relative space-y-4">
                {AFTER.map((t, i) => (
                  <motion.li
                    key={t}
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.08, duration: 0.4, ease }}
                    className="flex gap-3 text-[15px] leading-relaxed text-fg/90"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                      <Check size={12} strokeWidth={2.5} />
                    </span>
                    {t}
                  </motion.li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ---- Audience ------------------------------------------------------------------

const AUDIENCES = [
  {
    icon: Lightbulb,
    title: 'Emprendedores',
    body: 'Deja de perder consultas entre WhatsApp, correo y notas sueltas.',
    example: 'Una tienda online que recibe pedidos de cotización por Instagram.',
  },
  {
    icon: Briefcase,
    title: 'Agencias y freelancers',
    body: 'Sigue cada propuesta enviada y sabe qué cliente necesita una llamada hoy.',
    example: 'Una agencia de diseño con varias propuestas abiertas a la vez.',
  },
  {
    icon: Building2,
    title: 'Servicios profesionales',
    body: 'Registra cada conversación y no olvides ningún seguimiento.',
    example: 'Una clínica o un estudio contable que agenda primeras reuniones.',
  },
  {
    icon: Users,
    title: 'Pymes con equipo comercial',
    body: 'Todo el equipo trabaja sobre el mismo tablero, en tiempo real.',
    example: 'Un equipo de ventas que reparte los leads que llegan de la web.',
  },
];

export function Audience() {
  return (
    <section id="para-quien" className="scroll-mt-16 border-t border-line/60 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Para quién"
          title="Hecho para quienes venden sin un equipo de operaciones"
          body="Si hoy tus clientes potenciales viven en una hoja de cálculo, el correo y el chat, FlowDesk es para ti."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map(({ icon: Icon, title, body, example }, i) => (
            <Reveal key={title} delay={i * 0.07} className="h-full">
              <motion.div
                whileHover={{ y: -4 }}
                transition={spring}
                className="flex h-full flex-col rounded-2xl border border-line bg-surface/50 p-6 transition-colors hover:border-line-strong"
              >
                <span className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-raised text-fg">
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                <p className="mt-auto border-t border-line/60 pt-4 text-xs leading-relaxed text-subtle">
                  <span className="text-muted">Por ejemplo:</span> {example}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- FAQ ---------------------------------------------------------------------

const FAQ = [
  {
    q: '¿Mis datos están seguros?',
    a: 'Cada empresa tiene un espacio privado: solo tú y las personas que invites ven tus leads. Las contraseñas se guardan cifradas y verificamos el correo de cada cuenta.',
  },
  {
    q: '¿Puedo traer mis contactos de Excel o Google Sheets?',
    a: 'Sí. Exporta la hoja como CSV y súbela en Contactos → Importar. Detectamos las columnas automáticamente y omitimos los duplicados.',
  },
  {
    q: '¿Cómo capturo los leads de mi sitio web?',
    a: 'Personaliza el formulario en Configuración, copia el código y pégalo en tu web. También puedes usar el webhook con Zapier, Make, n8n o Typeform.',
  },
  {
    q: '¿Puedo trabajar con mi equipo?',
    a: 'Sí. Agrega a tu equipo desde Configuración → Equipo; todos ven el mismo tablero actualizado en tiempo real.',
  },
  {
    q: '¿Funciona en el celular?',
    a: 'Sí. FlowDesk se adapta a cualquier pantalla, así que puedes revisar «Hoy» y escribirle a un lead por WhatsApp desde el teléfono.',
  },
  {
    q: '¿Necesito instalar algo?',
    a: 'No. FlowDesk funciona en el navegador: creas tu cuenta, confirmas tu correo y empiezas a usarlo.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left text-[15px] font-medium text-fg transition-colors hover:text-white"
      >
        {q}
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25, ease }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-muted"
        >
          <Plus size={14} />
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
            <p className="pb-5 pr-10 text-sm leading-relaxed text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  return (
    <section id="preguntas" className="scroll-mt-16 border-t border-line/60 py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <Eyebrow>Preguntas frecuentes</Eyebrow>
          <h2 className="text-balance text-3xl font-semibold tracking-[-0.025em] text-fg md:text-[44px] md:leading-[1.1]">
            Lo que suelen preguntarnos
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted">
            Todo lo que necesitas saber antes de empezar. Crear tu cuenta toma menos de un minuto.
          </p>
        </Reveal>
        <Reveal delay={0.1} className="border-t border-line">
          {FAQ.map((f) => <FaqItem key={f.q} {...f} />)}
        </Reveal>
      </div>
    </section>
  );
}

// ---- Final call to action ---------------------------------------------------------

export function FinalCta() {
  const cta = usePrimaryCta();
  return (
    <section className="px-4 py-24 md:px-6 md:py-32">
      <Reveal>
        <div
          className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-line bg-surface/60 px-6 py-16 text-center md:py-24"
          {...spotlightHandlers()}
        >
          <div aria-hidden className="bg-grid absolute inset-0" />
          <div aria-hidden className="bg-grid-spot absolute inset-0" />
          <div aria-hidden className="absolute inset-x-24 top-0 h-px bg-gradient-to-r from-transparent via-accent-soft/60 to-transparent" />
          <div aria-hidden className="absolute -bottom-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(79,70,229,0.3),transparent)]" />
          <div className="relative">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={spring}
              className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-line-strong bg-canvas shadow-[0_0_60px_-10px_rgba(99,102,241,0.6)]"
            >
              <LogoMark size={34} />
            </motion.div>
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.03em] text-fg md:text-5xl">
              Ordena tu pipeline hoy
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-muted md:text-base">
              Crea tu cuenta, conecta tu primer formulario y empieza a dar seguimiento a cada oportunidad.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <CtaLink to={cta.to} size="lg" className="w-full sm:w-auto">
                {cta.label} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </CtaLink>
              {cta.to !== '/app' && (
                <CtaLink to="/login" variant="secondary" size="lg" className="w-full sm:w-auto">
                  Ya tengo cuenta
                </CtaLink>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ---- Footer ------------------------------------------------------------------

export function Footer() {
  const columns = [
    {
      title: 'Producto',
      links: [
        { label: 'Funciones', href: '#funciones' },
        { label: 'Demo', href: '#demo' },
        { label: 'Cómo funciona', href: '#como-funciona' },
        { label: 'Para quién', href: '#para-quien' },
        { label: 'Preguntas', href: '#preguntas' },
      ],
    },
    {
      title: 'Cuenta',
      links: [
        { label: 'Crear cuenta', to: '/registro' },
        { label: 'Iniciar sesión', to: '/login' },
        { label: 'Recuperar contraseña', to: '/olvide' },
      ],
    },
  ];
  return (
    <footer className="border-t border-line/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.5fr_1fr_1fr] md:px-6">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-subtle">
            CRM ligero para emprendedores y pequeñas empresas. Cada lead, en su lugar.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{col.title}</p>
            <ul className="space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  {'to' in l ? (
                    <Link to={l.to!} className="text-muted transition-colors hover:text-fg">{l.label}</Link>
                  ) : (
                    <a href={l.href} className="text-muted transition-colors hover:text-fg">{l.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between md:px-6">
          <span>© {new Date().getFullYear()} FlowDesk</span>
          <span>Hecho para vender más, con menos desorden.</span>
        </div>
      </div>
    </footer>
  );
}
