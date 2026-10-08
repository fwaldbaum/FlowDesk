import { useCallback, useEffect, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { Check, Copy, KeyRound, RefreshCw, Send } from 'lucide-react';
import { Header } from '../components/Header';
import { Button, IconButton, StatusDot } from '../components/ui';
import { api } from '../lib/api';
import { STATUSES } from '../lib/constants';
import { formatDateTime, timeAgo } from '../lib/format';
import type { WebhookEvent } from '../lib/types';
import { useStore } from '../store/AppStore';

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Clipboard API is unavailable on plain-HTTP origins; fall back to a hidden textarea.
    const el = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(el);
    el.select();
    document.execCommand('copy');
    el.remove();
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <IconButton
      label={copied ? 'Copiado' : 'Copiar'}
      onClick={async () => {
        await copyText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </IconButton>
  );
}

function Section({ title, description, children, aside }: {
  title: string;
  description?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface">
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
        {aside}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-canvas">
      <div className="flex items-center justify-between border-b border-line py-1 pl-3 pr-1">
        <span className="text-2xs font-medium uppercase tracking-wide text-subtle">{label}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto px-3 py-3 font-mono text-xs leading-relaxed text-fg/90">{code}</pre>
    </div>
  );
}

export function SettingsView() {
  const { webhookTick, connection, toast } = useStore();
  const [events, setEvents] = useState<WebhookEvent[] | null>(null);
  const [secretRequired, setSecretRequired] = useState(false);
  const [sending, setSending] = useState(false);

  const endpoint = `${window.location.origin}/api/webhooks/lead`;

  const loadEvents = useCallback(async () => {
    try {
      setEvents(await api.webhookEvents());
    } catch {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    api.webhookConfig().then((c) => setSecretRequired(c.secretRequired)).catch(() => {});
  }, []);

  // Refresh the log whenever a webhook lead arrives over the socket.
  useEffect(() => {
    loadEvents();
  }, [loadEvents, webhookTick]);

  const sendTest = async () => {
    setSending(true);
    try {
      await api.sendTestWebhook();
    } catch (err) {
      toast({ tone: 'error', title: 'Falló el envío de prueba', description: (err as Error).message });
    } finally {
      setSending(false);
    }
  };

  const payload = JSON.stringify(
    {
      name: 'María González',
      email: 'maria@empresa.com',
      phone: '+56 9 1234 5678',
      source: 'Formulario web',
      notes: 'Solicita una demo para su equipo de ventas.',
    },
    null,
    2,
  );

  const curl = [
    `curl -X POST ${endpoint} \\`,
    `  -H "Content-Type: application/json" \\`,
    ...(secretRequired ? ['  -H "X-Webhook-Secret: $FLOWDESK_WEBHOOK_SECRET" \\'] : []),
    `  -d '${JSON.stringify(JSON.parse(payload))}'`,
  ].join('\n');

  return (
    <>
      <Header title="Configuración" subtitle="Integraciones y ajustes del espacio de trabajo" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 md:px-6">
          <Section
            title="Webhook de entrada"
            description="Envía leads desde formularios, Zapier, Make o n8n. Aparecen al instante en la columna Nuevo Lead."
            aside={
              <Button variant="primary" size="sm" onClick={sendTest} disabled={sending}>
                <Send size={13} />
                {sending ? 'Enviando…' : 'Enviar lead de prueba'}
              </Button>
            }
          >
            <div className="space-y-4">
              <div>
                <p className="label">Endpoint</p>
                <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas py-1 pl-3 pr-1">
                  <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-2xs font-semibold text-accent-soft">POST</span>
                  <code className="min-w-0 flex-1 truncate font-mono text-xs text-fg">{endpoint}</code>
                  <CopyButton text={endpoint} />
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-line bg-canvas px-3 py-2.5">
                <KeyRound size={14} className="mt-0.5 shrink-0 text-subtle" />
                <p className="text-xs leading-relaxed text-muted">
                  {secretRequired ? (
                    <>
                      Protegido con secreto. Incluye la cabecera <code className="text-fg">X-Webhook-Secret</code> con el valor
                      de <code className="text-fg">WEBHOOK_SECRET</code> configurado en el servidor.
                    </>
                  ) : (
                    <>
                      El endpoint es público. Define la variable <code className="text-fg">WEBHOOK_SECRET</code> en el servidor
                      para exigir la cabecera <code className="text-fg">X-Webhook-Secret</code>.
                    </>
                  )}
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
                <CodeBlock label="Payload JSON" code={payload} />
                <div className="space-y-2">
                  <p className="label">Campos</p>
                  <ul className="space-y-1.5 text-xs text-muted">
                    <li><code className="text-fg">name</code> <span className="text-subtle">— obligatorio</span></li>
                    <li><code className="text-fg">email</code>, <code className="text-fg">phone</code> <span className="text-subtle">— opcionales</span></li>
                    <li><code className="text-fg">source</code> <span className="text-subtle">— por defecto «Webhook»</span></li>
                    <li><code className="text-fg">notes</code> <span className="text-subtle">— se guarda como primera nota</span></li>
                    <li><code className="text-fg">company</code>, <code className="text-fg">value</code> <span className="text-subtle">— extras opcionales</span></li>
                  </ul>
                  <p className="pt-1 text-xs text-subtle">Responde 201 con el lead creado, o 422 con el detalle de validación.</p>
                </div>
              </div>

              <CodeBlock label="cURL" code={curl} />
            </div>
          </Section>

          <Section
            title="Actividad del webhook"
            description="Últimas 25 solicitudes recibidas."
            aside={
              <IconButton label="Actualizar" onClick={loadEvents}>
                <RefreshCw size={14} />
              </IconButton>
            }
          >
            {!events ? (
              <p className="text-xs text-subtle">Cargando…</p>
            ) : events.length === 0 ? (
              <p className="text-xs text-subtle">Todavía no se han recibido solicitudes.</p>
            ) : (
              <ul className="-mx-2 divide-y divide-line/60">
                {events.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-2 py-2 text-xs">
                    <span
                      className={clsx(
                        'w-[72px] shrink-0 rounded px-1.5 py-0.5 text-center text-2xs font-medium',
                        e.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400',
                      )}
                    >
                      {e.status === 'accepted' ? '201' : 'Rechazado'}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-fg/90">
                      {e.status === 'accepted' ? e.lead_name ?? 'Lead eliminado' : e.error}
                    </span>
                    <span className="shrink-0 text-subtle" title={formatDateTime(e.created_at)}>
                      {timeAgo(e.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <div className="grid gap-5 md:grid-cols-2">
            <Section title="Tiempo real" description="Actualizaciones vía WebSocket (Socket.io).">
              <div className="flex items-center gap-2 text-[13px]">
                <span
                  className={clsx(
                    'h-2 w-2 rounded-full',
                    connection === 'online' ? 'bg-emerald-500' : connection === 'connecting' ? 'bg-amber-500' : 'bg-red-500',
                  )}
                />
                {connection === 'online' ? 'Conectado' : connection === 'connecting' ? 'Conectando…' : 'Desconectado'}
              </div>
            </Section>
            <Section title="Etapas del pipeline">
              <ol className="space-y-2">
                {STATUSES.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-2.5 text-[13px]">
                    <span className="w-3 text-2xs tabular-nums text-subtle">{i + 1}</span>
                    <StatusDot status={s.id} />
                    {s.label}
                  </li>
                ))}
              </ol>
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}
