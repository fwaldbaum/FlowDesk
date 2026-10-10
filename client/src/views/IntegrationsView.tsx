import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { motion } from 'motion/react';
import {
  AlertTriangle, Check, CircleCheck, ExternalLink, Eye, EyeOff, Megaphone, RefreshCw, Workflow,
} from 'lucide-react';
import { CodeBlock, CopyButton } from '../components/copy';
import { Header } from '../components/Header';
import { LogoMark } from '../components/Logo';
import { ease } from '../components/motion';
import { IconButton } from '../components/ui';
import { api } from '../lib/api';
import { formatDateTime, timeAgo } from '../lib/format';
import type { WebhookEvent } from '../lib/types';
import { useStore } from '../store/AppStore';

const SOURCE = 'TikTok Ads';
const CALLBACK_URL = 'https://www.integromat.com/oauth/cb/tiktok-lead-forms';
const PROGRESS_KEY = 'fd:tiktok-guide';

function loadProgress(): number[] {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

/** Monospace value with a copy button, for things the user pastes into Make or TikTok. */
function CopyField({ label, value, display }: { label: string; value: string; display?: string }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas py-1 pl-3 pr-1">
        <code className="min-w-0 flex-1 truncate font-mono text-xs text-fg">{display ?? value}</code>
        <CopyButton text={value} />
      </div>
    </div>
  );
}

function Ui({ children }: { children: ReactNode }) {
  return <span className="rounded border border-line bg-raised px-1.5 py-px text-[12px] font-medium text-fg">{children}</span>;
}

function Step({ n, title, done, onToggle, children }: {
  n: number;
  title: string;
  done: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <li className="group relative pl-12">
      <span aria-hidden className="absolute bottom-0 left-[15px] top-9 w-px bg-line group-last:hidden" />
      <button
        onClick={onToggle}
        title={done ? 'Marcar como pendiente' : 'Marcar como hecho'}
        className={clsx(
          'absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
          done ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' : 'border-line-strong bg-surface text-muted hover:border-accent/60 hover:text-fg',
        )}
      >
        {done ? <Check size={14} strokeWidth={2.5} /> : n}
      </button>
      <div className="rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h3 className={clsx('text-sm font-semibold', done ? 'text-muted' : 'text-fg')}>{title}</h3>
          <button onClick={onToggle} className="shrink-0 text-2xs text-subtle transition-colors hover:text-fg">
            {done ? 'Hecho' : 'Marcar como hecho'}
          </button>
        </div>
        <div className="space-y-3 px-5 py-4 text-[13px] leading-relaxed text-muted">{children}</div>
      </div>
    </li>
  );
}

function FlowDiagram() {
  const nodes = [
    { icon: <Megaphone size={18} className="text-fg" />, title: 'TikTok Ads', body: 'Formulario instantáneo' },
    { icon: <Workflow size={18} className="text-fg" />, title: 'Make', body: 'Watch Leads → HTTP' },
    { icon: <LogoMark size={20} />, title: 'FlowDesk', body: 'Columna Nuevo Lead' },
  ];
  return (
    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 sm:gap-3">
      {nodes.map((node, i) => (
        <div key={node.title} className="contents">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: i * 0.08 }}
            className="flex flex-col items-center rounded-xl border border-line bg-canvas px-2 py-3 text-center sm:px-3"
          >
            <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface">{node.icon}</span>
            <p className="text-[13px] font-semibold text-fg">{node.title}</p>
            <p className="hidden text-2xs text-subtle sm:block">{node.body}</p>
          </motion.div>
          {i < nodes.length - 1 && (
            <div aria-hidden className="relative h-px w-3 bg-line sm:w-12">
              <motion.span
                className="absolute -top-[2.5px] h-1.5 w-1.5 rounded-full bg-accent-soft"
                animate={{ left: ['0%', '100%'], opacity: [0, 1, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.8, ease: 'easeInOut' }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function isTikTok(e: WebhookEvent) {
  const source = (e.payload as { source?: unknown } | null)?.source;
  return typeof source === 'string' && source.toLowerCase().includes('tiktok');
}

export function IntegrationsView() {
  const { webhookTick } = useStore();
  const [key, setKey] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [events, setEvents] = useState<WebhookEvent[] | null>(null);
  const [done, setDone] = useState<number[]>(loadProgress);

  const endpoint = `${window.location.origin}/api/webhooks/lead`;
  const keyValue = key ?? '…';
  const shownKey = reveal ? keyValue : `${keyValue.slice(0, 6)}${'•'.repeat(18)}`;

  const loadEvents = useCallback(async () => {
    try {
      setEvents((await api.webhookEvents()).filter(isTikTok));
    } catch {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    api.webhookConfig().then((c) => setKey(c.key)).catch(() => {});
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents, webhookTick]);

  const toggle = (n: number) =>
    setDone((d) => {
      const next = d.includes(n) ? d.filter((x) => x !== n) : [...d, n];
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      } catch {
        // Progress is a convenience; ignore storage failures.
      }
      return next;
    });

  const body = JSON.stringify(
    {
      name: '{{Nombre}}',
      email: '{{Correo}}',
      phone: '{{Teléfono}}',
      source: SOURCE,
      notes: 'Lead de TikTok · {{Nombre del formulario}}',
    },
    null,
    2,
  );

  const last = events?.[0];

  return (
    <>
      <Header title="Integraciones" subtitle="Conecta tus campañas para que los leads lleguen solos al tablero" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 md:px-6">
          {/* Intro */}
          <section className="relative overflow-hidden rounded-xl border border-line bg-surface">
            <div aria-hidden className="bg-grid absolute inset-0 opacity-50" />
            <div className="relative space-y-5 p-5 md:p-6">
              <div>
                <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-2.5 py-0.5 text-2xs font-medium text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-soft" /> Guía paso a paso · 15 minutos aprox.
                </p>
                <h2 className="text-lg font-semibold tracking-tight text-fg">Conecta TikTok Lead Ads con Make</h2>
                <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">
                  Cada vez que alguien complete el formulario instantáneo de tu anuncio en TikTok, Make enviará sus datos a
                  FlowDesk y el lead aparecerá en <b className="font-medium text-fg">Nuevo Lead</b> con origen «{SOURCE}».
                </p>
              </div>
              <FlowDiagram />
            </div>
          </section>

          {/* Live status */}
          <section className="flex items-center gap-3 rounded-xl border border-line bg-surface px-5 py-3.5">
            <span
              className={clsx(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                last ? 'bg-emerald-500/15 text-emerald-300' : 'bg-raised text-subtle',
              )}
            >
              {last ? <CircleCheck size={16} /> : <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-fg">
                {events === null ? 'Revisando conexión…' : last ? 'Conexión funcionando' : 'Esperando el primer lead de TikTok'}
              </p>
              <p className="truncate text-xs text-subtle">
                {last
                  ? `${last.status === 'accepted' ? last.lead_name ?? 'Lead' : `Rechazado: ${last.error}`} · ${timeAgo(last.created_at)}`
                  : 'Cuando Make envíe un lead con origen «TikTok Ads» lo verás aquí.'}
              </p>
            </div>
            {last && <span className="hidden text-2xs text-subtle sm:block">{formatDateTime(last.created_at)}</span>}
            <IconButton label="Actualizar" onClick={loadEvents}>
              <RefreshCw size={14} />
            </IconButton>
          </section>

          {/* Requirements */}
          <section className="rounded-xl border border-line bg-surface px-5 py-4">
            <h3 className="mb-3 text-sm font-semibold text-fg">Antes de empezar necesitas</h3>
            <ul className="space-y-2 text-[13px] text-muted">
              {[
                <>Una cuenta de <b className="font-medium text-fg">Make</b> (make.com). El plan gratuito sirve para empezar.</>,
                <>Una cuenta de <b className="font-medium text-fg">TikTok for Business</b> con al menos un formulario instantáneo creado en TikTok Ads Manager.</>,
                <>Acceso a la <b className="font-medium text-fg">API de TikTok for Business</b> (se solicita en el portal para desarrolladores; la aprobación puede tardar).</>,
              ].map((t, i) => (
                <li key={i} className="flex gap-2.5">
                  <Check size={14} className="mt-0.5 shrink-0 text-accent-soft" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Steps */}
          <ol className="space-y-5">
            <Step n={1} title="Crea la app en TikTok for Business Developers" done={done.includes(1)} onToggle={() => toggle(1)}>
              <p>
                Entra al portal para desarrolladores de TikTok for Business con tu cuenta. En el ícono de tu perfil elige{' '}
                <Ui>Manage apps</Ui> y luego <Ui>Connect an app</Ui> (o abre una app que ya tengas).
              </p>
              <p>Si te pide una URL de redirección (callback), pega esta:</p>
              <CopyField label="Callback URL" value={CALLBACK_URL} />
              <p>
                En la página de la app, sección <Ui>App details</Ui> → <Ui>Credentials</Ui>, copia el <b className="font-medium text-fg">Client ID</b> y
                el <b className="font-medium text-fg">Client secret</b>. Los usarás en el paso siguiente.
              </p>
              <a
                href="https://business-api.tiktok.com/portal"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-soft hover:text-fg"
              >
                Abrir portal de TikTok for Business Developers <ExternalLink size={12} />
              </a>
            </Step>

            <Step n={2} title="Crea el escenario en Make con el disparador de TikTok" done={done.includes(2)} onToggle={() => toggle(2)}>
              <p>
                En Make, haz clic en <Ui>Create a new scenario</Ui>, agrega la app <Ui>TikTok Lead Forms</Ui> y elige el
                módulo <Ui>Watch Leads</Ui>.
              </p>
              <p>
                Pulsa <Ui>Create a webhook</Ui> y después <Ui>Create a connection</Ui>. Pega el Client ID y el Client
                secret del paso 1 y autoriza a Make con tu cuenta de TikTok.
              </p>
              <p>Selecciona tu cuenta publicitaria (Advertiser) y el formulario instantáneo que quieres conectar.</p>
              <a
                href="https://www.make.com/en/integrations/tiktok-lead-forms"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-soft hover:text-fg"
              >
                Ver la integración en Make <ExternalLink size={12} />
              </a>
            </Step>

            <Step n={3} title="Envía el lead a FlowDesk con el módulo HTTP" done={done.includes(3)} onToggle={() => toggle(3)}>
              <p>
                Haz clic en el <Ui>+</Ui> a la derecha del módulo de TikTok, agrega la app <Ui>HTTP</Ui> y elige{' '}
                <Ui>Make a request</Ui>. Configúralo así:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <CopyField label="URL" value={endpoint} />
                <div>
                  <p className="label">Method</p>
                  <div className="flex h-[34px] items-center rounded-lg border border-line bg-canvas px-3 font-mono text-xs text-fg">POST</div>
                </div>
              </div>
              <div>
                <p className="label">Headers (agrega uno)</p>
                <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr]">
                  <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas py-1 pl-3 pr-1">
                    <span className="text-2xs text-subtle">Name</span>
                    <code className="min-w-0 flex-1 truncate font-mono text-xs text-fg">X-Webhook-Key</code>
                    <CopyButton text="X-Webhook-Key" />
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-line bg-canvas py-1 pl-3 pr-1">
                    <span className="mr-1 text-2xs text-subtle">Value</span>
                    <code className="min-w-0 flex-1 truncate font-mono text-xs text-fg">{shownKey}</code>
                    <IconButton label={reveal ? 'Ocultar clave' : 'Mostrar clave'} onClick={() => setReveal((v) => !v)}>
                      {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
                    </IconButton>
                    <CopyButton text={keyValue} />
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-subtle">
                  Es la clave de tu espacio: quien la tenga puede crear leads en él. Puedes regenerarla en{' '}
                  <Link to="/app/configuracion" className="text-accent-soft hover:text-fg">Configuración</Link>.
                </p>
              </div>
              <p>
                En <Ui>Body content type</Ui> (o <Ui>Body type</Ui> → <Ui>Raw</Ui>) elige <Ui>application/json</Ui> y pega
                este contenido en <Ui>Body content</Ui>:
              </p>
              <CodeBlock label="Body (JSON)" code={body} />
              <p>
                Después reemplaza cada <code className="text-fg">{'{{…}}'}</code> por el campo correspondiente: borra el texto
                entre comillas y haz clic en el dato que entrega el módulo de TikTok en el panel de mapeo de Make. Los nombres
                de los campos dependen de las preguntas de tu formulario; si no aparecen, ejecuta el escenario una vez con{' '}
                <Ui>Run once</Ui> para que Make los conozca.
              </p>
              <ul className="space-y-1.5 rounded-lg border border-line bg-canvas px-3.5 py-3 text-xs">
                <li><code className="text-fg">name</code> <span className="text-subtle">— obligatorio. Si tu formulario no pide nombre, usa el correo o el teléfono.</span></li>
                <li><code className="text-fg">email</code>, <code className="text-fg">phone</code> <span className="text-subtle">— opcionales, pero necesarios para escribirle por WhatsApp o correo.</span></li>
                <li><code className="text-fg">source</code> <span className="text-subtle">— déjalo como «{SOURCE}» para que la conexión se muestre arriba.</span></li>
                <li><code className="text-fg">company</code>, <code className="text-fg">value</code>, <code className="text-fg">notes</code> <span className="text-subtle">— extras opcionales.</span></li>
              </ul>
            </Step>

            <Step n={4} title="Prueba y activa el escenario" done={done.includes(4)} onToggle={() => toggle(4)}>
              <p>
                En Make pulsa <Ui>Run once</Ui> y completa tu formulario de TikTok (o espera el primer lead real). Verás la
                ejecución en Make y el lead aparecerá en el tablero; la tarjeta de estado de esta página cambiará a{' '}
                <span className="text-emerald-300">Conexión funcionando</span>.
              </p>
              <p>
                Si todo salió bien, guarda el escenario y actívalo con el interruptor de la parte inferior del editor para que
                funcione siempre, sin que tengas que abrir Make.
              </p>
            </Step>
          </ol>

          {/* Troubleshooting */}
          <section className="rounded-xl border border-line bg-surface">
            <h3 className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-sm font-semibold text-fg">
              <AlertTriangle size={14} className="text-amber-300" /> Si algo no funciona
            </h3>
            <dl className="divide-y divide-line/70 text-[13px]">
              {[
                ['Make muestra el error 401', 'La clave no coincide. Revisa la cabecera X-Webhook-Key (sin espacios) o cópiala de nuevo si la regeneraste.'],
                ['Make muestra el error 422', 'Falta un dato obligatorio o tiene un formato inválido. Lo más común: name vacío o un correo mal escrito.'],
                ['TikTok rechaza la URL de redirección', 'Usa exactamente la que muestra Make al crear la conexión si es distinta a la de esta guía.'],
                ['No llega nada', 'Comprueba que el escenario esté activado y que el formulario elegido en Watch Leads sea el de tu anuncio.'],
              ].map(([q, a]) => (
                <div key={q} className="px-5 py-3">
                  <dt className="font-medium text-fg">{q}</dt>
                  <dd className="mt-0.5 text-muted">{a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="pb-4 text-center text-xs text-subtle">
            ¿Prefieres otra herramienta? Zapier y n8n funcionan igual: usa la URL y la clave de tu webhook en{' '}
            <Link to="/app/configuracion" className="text-accent-soft hover:text-fg">Configuración</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
