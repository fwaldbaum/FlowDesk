import { useEffect, useRef, useState, type FormEvent } from 'react';
import clsx from 'clsx';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Bell, Building2, Check, Code2, FileText, Globe, LoaderCircle, Lock, Mail, RotateCcw, Send, User, Webhook } from 'lucide-react';
import { LogoMark } from '../../components/Logo';
import { Reveal, softSpring } from '../../components/motion';
import { STATUS_BY_ID } from '../../lib/constants';
import { money } from '../../lib/format';
import { SectionHeading } from './shared';

type Channel = 'form' | 'webhook';
type Stage = 'new' | 'contacted' | 'proposal';
type Lead = { id: string; name: string; company: string; email: string; value: number; channel: Channel; stage: Stage; fresh?: boolean };

const STAGES: Stage[] = ['new', 'contacted', 'proposal'];

const SAMPLES = [
  { name: 'Valentina Rojas', company: 'Estudio Norte', email: 'valentina@estudionorte.cl', value: 1800 },
  { name: 'Tomás Herrera', company: 'Herrera Logística', email: 'tomas@herreralogistica.cl', value: 4200 },
  { name: 'Camila Fuentes', company: 'Café Origen', email: 'camila@cafeorigen.cl', value: 950 },
  { name: 'Diego Morales', company: 'Morales Dental', email: 'diego@moralesdental.cl', value: 3100 },
];

const SEEDED: Lead[] = [
  { id: 's1', name: 'Andrés Salinas', company: 'Salinas Arquitectos', email: '', value: 5400, channel: 'form', stage: 'new' },
  { id: 's2', name: 'Martín Vidal', company: 'Vidal Transportes', email: '', value: 8900, channel: 'webhook', stage: 'contacted' },
  { id: 's3', name: 'Felipe Araya', company: 'Araya Contadores', email: '', value: 2600, channel: 'form', stage: 'proposal' },
];

const CHANNEL_LABEL: Record<Channel, string> = { form: 'Formulario web', webhook: 'Webhook' };

function Field({ icon: Icon, label, value, onChange, type = 'text', required, inputMode }: {
  icon: typeof User;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  inputMode?: 'numeric';
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted">
        {label}
        {required && <span className="text-accent-soft"> *</span>}
      </span>
      <span className="flex h-9 items-center gap-2 rounded-md border border-line bg-canvas px-2.5 transition-colors focus-within:border-accent/70 focus-within:ring-2 focus-within:ring-accent/20">
        <Icon size={13} className="shrink-0 text-subtle" />
        <input
          type={type}
          inputMode={inputMode}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent text-[13px] text-fg outline-none placeholder:text-subtle"
        />
      </span>
    </label>
  );
}

/** Syntax-tinted cURL that mirrors the form, so both tabs describe the same lead. */
function CurlSnippet({ name, company, email, value }: { name: string; company: string; email: string; value: string }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tu-dominio';
  const k = (t: string) => <span className="text-[#93C5FD]">"{t}"</span>;
  const s = (t: string) => <span className="text-[#86EFAC]">"{t}"</span>;
  const n = (t: string) => <span className="text-[#FCD34D]">{t || 0}</span>;
  return (
    <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[11.5px] leading-[1.7] text-muted">
      <span className="text-accent-soft">curl</span> -X POST {origin}/api/webhooks/lead \{'\n'}
      {'  '}-H <span className="text-[#86EFAC]">"X-Webhook-Key: tu_clave"</span> \{'\n'}
      {'  '}-H <span className="text-[#86EFAC]">"Content-Type: application/json"</span> \{'\n'}
      {'  '}-d <span className="text-subtle">'</span>{'{'}{'\n'}
      {'    '}{k('name')}: {s(name)},{'\n'}
      {'    '}{k('company')}: {s(company)},{'\n'}
      {'    '}{k('email')}: {s(email)},{'\n'}
      {'    '}{k('value')}: {n(value.replace(/\D/g, ''))},{'\n'}
      {'    '}{k('source')}: {s('Webhook')}{'\n'}
      {'  '}{'}'}<span className="text-subtle">'</span>
    </pre>
  );
}

export function Playground() {
  const reduced = useReducedMotion();
  const [channel, setChannel] = useState<Channel>('form');
  const [sample, setSample] = useState(0);
  const [form, setForm] = useState(() => ({ ...SAMPLES[0]!, value: String(SAMPLES[0]!.value) }));
  const [leads, setLeads] = useState<Lead[]>(SEEDED);
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [toast, setToast] = useState<Lead | null>(null);
  const [beam, setBeam] = useState(0);
  const [unread, setUnread] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (sending || !form.name.trim()) return;
    setSending(true);
    setResponse(null);
    setBeam((b) => b + 1);
    later(reduced ? 0 : 650, () => {
      const lead: Lead = {
        id: `l${Date.now()}`,
        name: form.name.trim(),
        company: form.company.trim(),
        email: form.email.trim(),
        value: Number(form.value.replace(/\D/g, '')) || 0,
        channel,
        stage: 'new',
        fresh: true,
      };
      setLeads((ls) => {
        const others = ls.map((l) => ({ ...l, fresh: false }));
        const inNew = others.filter((l) => l.stage === 'new');
        // Keep the demo column short: drop the oldest card once it gets crowded.
        const drop = inNew.length >= 3 ? inNew[inNew.length - 1]!.id : null;
        return [lead, ...others.filter((l) => l.id !== drop)];
      });
      setToast(lead);
      setUnread((u) => u + 1);
      setSending(false);
      if (channel === 'webhook') setResponse('201 Created · lead creado');
      const next = (sample + 1) % SAMPLES.length;
      setSample(next);
      setForm({ ...SAMPLES[next]!, value: String(SAMPLES[next]!.value) });
      later(2600, () => setToast(null));
    });
  };

  const advance = (id: string) =>
    setLeads((ls) =>
      ls.map((l) => (l.id === id ? { ...l, fresh: false, stage: STAGES[Math.min(STAGES.indexOf(l.stage) + 1, STAGES.length - 1)]! } : l)),
    );

  const reset = () => {
    setLeads(SEEDED);
    setUnread(0);
    setResponse(null);
  };

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <section id="demo" className="relative scroll-mt-16 border-t border-line/60 py-24 md:py-32">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-40 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(79,70,229,0.12),transparent)]" />
      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Pruébalo aquí"
          title="Envía un lead y mira cómo llega"
          body="Esto es lo que pasa cuando alguien completa el formulario de tu web o tu herramienta llama al webhook. Es una demostración: no se guarda nada."
        />

        <Reveal>
          <div className="relative grid items-start gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
            {/* Sender */}
            <div className="overflow-hidden rounded-2xl border border-line bg-surface/70 shadow-[0_40px_100px_-50px_rgba(0,0,0,0.9)]">
              <div className="flex items-center gap-1 border-b border-line p-1.5">
                <LayoutGroup id="pg-tabs">
                  {(['form', 'webhook'] as Channel[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setChannel(c);
                        setResponse(null);
                      }}
                      className={clsx(
                        'relative flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-[12px] font-medium transition-colors',
                        channel === c ? 'text-fg' : 'text-subtle hover:text-muted',
                      )}
                    >
                      {channel === c && (
                        <motion.span layoutId="pg-tab" transition={softSpring} className="absolute inset-0 rounded-md border border-line bg-raised" />
                      )}
                      <span className="relative flex items-center gap-1.5">
                        {c === 'form' ? <Globe size={13} /> : <Code2 size={13} />}
                        {c === 'form' ? 'Formulario en tu web' : 'Webhook (API)'}
                      </span>
                    </button>
                  ))}
                </LayoutGroup>
              </div>

              <form onSubmit={submit}>
                <AnimatePresence mode="wait" initial={false}>
                  {channel === 'form' ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="p-5"
                    >
                      <p className="mb-1 flex items-center gap-1.5 text-[11px] text-subtle">
                        <Lock size={10} /> tuempresa.cl/contacto
                      </p>
                      <p className="mb-4 text-[15px] font-semibold text-fg">Cotiza con nosotros</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field icon={User} label="Nombre" value={form.name} onChange={set('name')} required />
                        <Field icon={Building2} label="Empresa" value={form.company} onChange={set('company')} />
                        <Field icon={Mail} label="Correo" type="email" value={form.email} onChange={set('email')} />
                        <Field icon={FileText} label="Presupuesto aprox." inputMode="numeric" value={form.value} onChange={set('value')} />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="webhook"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center justify-between border-b border-line/70 px-4 py-2 text-[11px] text-subtle">
                        <span className="flex items-center gap-1.5"><Webhook size={12} /> Zapier, Make, n8n o tu propio código</span>
                        <span className="rounded bg-raised px-1.5 font-mono text-[10px] text-muted">POST</span>
                      </div>
                      <CurlSnippet {...form} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-3 border-t border-line/70 px-5 py-3.5">
                  <AnimatePresence mode="wait">
                    {response ? (
                      <motion.span
                        key="res"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-300"
                      >
                        <Check size={12} /> {response}
                      </motion.span>
                    ) : (
                      <motion.span key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[11px] text-subtle">
                        Edita los datos si quieres
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <button
                    type="submit"
                    disabled={sending}
                    className="group ml-auto inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-[13px] font-medium text-white shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_8px_24px_-8px_rgba(79,70,229,0.8)] transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-80"
                  >
                    {sending ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={13} className="transition-transform group-hover:translate-x-0.5" />}
                    {channel === 'form' ? 'Enviar formulario' : 'Enviar solicitud'}
                  </button>
                </div>
              </form>
            </div>

            {/* Connector beam between the two panels */}
            <div aria-hidden className="pointer-events-none absolute left-[calc((100%-3.5rem)*0.425+1.75rem)] top-1/2 hidden h-px w-14 -translate-x-1/2 bg-line lg:block">
              <AnimatePresence>
                {beam > 0 && (
                  <motion.span
                    key={beam}
                    className="absolute -top-[3px] h-[7px] w-[7px] rounded-full bg-accent-soft shadow-[0_0_14px_3px_rgba(129,140,248,0.7)]"
                    initial={{ left: '0%', opacity: 0 }}
                    animate={{ left: '100%', opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 0.6, ease: 'easeIn' }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Receiver: a slice of the FlowDesk board */}
            <div className="relative overflow-hidden rounded-2xl border border-line-strong/70 bg-canvas shadow-[0_40px_100px_-40px_rgba(79,70,229,0.35)]">
              <div className="flex h-11 items-center gap-2.5 border-b border-line bg-surface/50 px-4">
                <LogoMark size={18} />
                <span className="text-[13px] font-semibold text-fg">Tablero</span>
                <span className="flex items-center gap-1.5 text-[11px] text-subtle">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> En vivo
                </span>
                <span className="relative ml-auto flex h-7 w-7 items-center justify-center rounded-md border border-line text-muted">
                  <Bell size={13} />
                  <AnimatePresence>
                    {unread > 0 && (
                      <motion.span
                        key={unread}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={softSpring}
                        className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold text-white"
                      >
                        {unread}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <button
                  type="button"
                  onClick={reset}
                  title="Reiniciar demostración"
                  aria-label="Reiniciar demostración"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-muted transition-colors hover:text-fg"
                >
                  <RotateCcw size={12} />
                </button>
              </div>

              <LayoutGroup id="pg-board">
                <div className="grid min-h-[330px] grid-cols-1 gap-2.5 p-3 sm:grid-cols-3">
                  {STAGES.map((stage, si) => {
                    const cards = leads.filter((l) => l.stage === stage);
                    return (
                      <div key={stage} className={clsx('rounded-lg border border-line/70 bg-surface/40 p-1.5', si > 0 && 'hidden sm:block')}>
                        <div className="flex items-center gap-1.5 px-1.5 pb-2 pt-1">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_BY_ID[stage].color }} />
                          <span className="truncate text-[11px] font-medium text-fg">{STATUS_BY_ID[stage].label}</span>
                          <motion.span key={cards.length} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="rounded bg-raised px-1 text-[10px] text-muted">
                            {cards.length}
                          </motion.span>
                        </div>
                        <div className="space-y-1.5">
                          <AnimatePresence initial={false} mode="popLayout">
                            {cards.map((l) => (
                              <motion.div
                                key={l.id}
                                layoutId={`pg-${l.id}`}
                                layout
                                initial={{ opacity: 0, y: -16, scale: 0.94 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.94 }}
                                transition={softSpring}
                                className={clsx(
                                  'group rounded-md border px-2.5 py-2 transition-colors duration-700',
                                  l.fresh ? 'border-accent/70 bg-[#1a1d33] shadow-[0_0_24px_-6px_rgba(99,102,241,0.6)]' : 'border-line bg-surface',
                                )}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <p className="truncate text-[12px] font-medium text-fg">{l.name}</p>
                                  {l.fresh && <span className="shrink-0 text-[9px] font-medium text-accent-soft">Nuevo</span>}
                                </div>
                                <p className="truncate text-[10.5px] text-muted">
                                  {l.company || 'Sin empresa'} · {CHANNEL_LABEL[l.channel]}
                                </p>
                                <div className="mt-1.5 flex items-center justify-between">
                                  <span className="text-[11px] font-medium tabular-nums text-fg">{money(l.value)}</span>
                                  {stage !== 'proposal' && (
                                    <button
                                      type="button"
                                      onClick={() => advance(l.id)}
                                      className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] text-subtle transition-colors hover:bg-raised hover:text-fg"
                                    >
                                      Avanzar <ArrowRight size={10} />
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </LayoutGroup>

              <AnimatePresence>
                {toast && (
                  <motion.div
                    key={toast.id}
                    initial={{ opacity: 0, y: 16, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: softSpring }}
                    exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
                    className="absolute bottom-3 right-3 flex w-64 items-start gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 shadow-overlay"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent-soft">
                      {toast.channel === 'form' ? <Globe size={12} /> : <Webhook size={12} />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-fg">Nuevo lead vía {toast.channel === 'form' ? 'formulario' : 'webhook'}</p>
                      <p className="truncate text-[11px] text-muted">{toast.name}{toast.company && ` · ${toast.company}`}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
