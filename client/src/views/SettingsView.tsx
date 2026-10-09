import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import clsx from 'clsx';
import { Check, Copy, ExternalLink, KeyRound, MessageCircle, RefreshCw, Send, Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Header } from '../components/Header';
import { LeadCaptureForm } from '../components/LeadCaptureForm';
import { Avatar, Button, IconButton, StatusDot } from '../components/ui';
import { api } from '../lib/api';
import { STATUSES } from '../lib/constants';
import { formatDateTime, timeAgo } from '../lib/format';
import { fillTemplate, TEMPLATE_VARIABLES } from '../lib/contact';
import type { FormSettings, User, WebhookEvent } from '../lib/types';
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
  const { webhookTick, connection, toast, realtimeMode } = useStore();
  const [events, setEvents] = useState<WebhookEvent[] | null>(null);
  const { user } = useAuth();
  const [webhookKey, setWebhookKey] = useState<string | null>(null);
  const [revealKey, setRevealKey] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [sending, setSending] = useState(false);

  const endpoint = `${window.location.origin}/api/webhooks/lead`;
  const keyValue = webhookKey ?? '…';
  const shownKey = revealKey ? keyValue : `${keyValue.slice(0, 6)}${'•'.repeat(18)}`;
  const urlWithKey = `${endpoint}?key=${keyValue}`;

  const loadEvents = useCallback(async () => {
    try {
      setEvents(await api.webhookEvents());
    } catch {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    api.webhookConfig().then((c) => setWebhookKey(c.key)).catch(() => {});
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

  const rotateKey = async () => {
    try {
      setWebhookKey((await api.rotateWebhookKey()).key);
      setConfirmRotate(false);
      toast({ tone: 'success', title: 'Clave regenerada', description: 'Actualiza tus integraciones con la nueva URL.' });
    } catch (err) {
      toast({ tone: 'error', title: 'No se pudo regenerar', description: (err as Error).message });
    }
  };

  const curl = [
    `curl -X POST ${endpoint} \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -H "X-Webhook-Key: ${keyValue}" \\`,
    `  -d '${JSON.stringify(JSON.parse(payload))}'`,
  ].join('\n');

  return (
    <>
      <Header title="Configuración" subtitle="Integraciones y ajustes del espacio de trabajo" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 md:px-6">
          <FormSection />
          <WhatsAppSection />

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
                <p className="label">URL del webhook (incluye la clave de tu espacio)</p>
                <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas py-1 pl-3 pr-1">
                  <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-2xs font-semibold text-accent-soft">POST</span>
                  <code className="min-w-0 flex-1 truncate font-mono text-xs text-fg">
                    {endpoint}?key={shownKey}
                  </code>
                  <CopyButton text={urlWithKey} />
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-line bg-canvas px-3 py-2.5 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                  <KeyRound size={14} className="mt-0.5 shrink-0 text-subtle" />
                  <p className="text-xs leading-relaxed text-muted">
                    La clave identifica a tu espacio: quien la tenga puede crear leads en él. También puedes enviarla en la
                    cabecera <code className="text-fg">X-Webhook-Key</code>.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => setRevealKey((v) => !v)}>
                    {revealKey ? 'Ocultar' : 'Mostrar'}
                  </Button>
                  {user?.role === 'owner' &&
                    (confirmRotate ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmRotate(false)}>Cancelar</Button>
                        <Button size="sm" variant="danger" onClick={rotateKey}>Confirmar</Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => setConfirmRotate(true)} title="La clave actual dejará de funcionar">
                        Regenerar
                      </Button>
                    ))}
                </div>
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

          <TeamSection />
          <AccountSection />

          <div className="grid gap-5 md:grid-cols-2">
            <Section
              title="Tiempo real"
              description={
                realtimeMode === 'poll'
                  ? 'Actualizaciones por consulta cada 3 segundos (modo serverless).'
                  : 'Actualizaciones instantáneas vía WebSocket (Socket.io).'
              }
            >
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

function TeamSection() {
  const { user: me } = useAuth();
  const { toast } = useStore();
  const [users, setUsers] = useState<User[] | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const isOwner = me?.role === 'owner';

  useEffect(() => {
    api.users().then(setUsers).catch(() => setUsers([]));
  }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const created = await api.addUser(form.name, form.email, form.password);
      setUsers((list) => [...(list ?? []), created]);
      setForm({ name: '', email: '', password: '' });
      toast({ tone: 'success', title: 'Miembro añadido', description: `Comparte el acceso con ${created.email}` });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await api.removeUser(id);
      setUsers((list) => list?.filter((u) => u.id !== id) ?? null);
      setConfirmId(null);
    } catch (err) {
      toast({ tone: 'error', title: 'No se pudo eliminar', description: (err as Error).message });
    }
  };

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Section
      title="Equipo"
      description={
        isOwner
          ? 'Crea cuentas para las personas que trabajan tus leads. Todos comparten el mismo tablero.'
          : 'Personas con acceso a este espacio. Solo el propietario puede añadir o quitar miembros.'
      }
    >
      <ul className="-mx-2 divide-y divide-line/60">
        {(users ?? []).map((u) => (
          <li key={u.id} className="flex items-center gap-3 px-2 py-2.5">
            <Avatar name={u.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-fg">
                {u.name}
                {u.id === me?.id && <span className="ml-1.5 text-xs font-normal text-subtle">(tú)</span>}
              </p>
              <p className="truncate text-xs text-subtle">{u.email}</p>
            </div>
            <span className="rounded-full border border-line px-2 py-0.5 text-2xs text-muted">
              {u.role === 'owner' ? 'Propietario' : 'Miembro'}
            </span>
            {isOwner && u.role !== 'owner' && (
              confirmId === u.id ? (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>Cancelar</Button>
                  <Button size="sm" variant="danger" onClick={() => remove(u.id)}>Quitar</Button>
                </div>
              ) : (
                <IconButton label={`Quitar a ${u.name}`} onClick={() => setConfirmId(u.id)}>
                  <Trash2 size={13} />
                </IconButton>
              )
            )}
          </li>
        ))}
      </ul>

      {isOwner && (
        <form onSubmit={add} className="mt-4 rounded-lg border border-line bg-canvas p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium text-muted">
            <UserPlus size={14} /> Añadir miembro
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="input" placeholder="Nombre" aria-label="Nombre" value={form.name} onChange={set('name')} required />
            <input className="input" type="email" placeholder="email@empresa.com" aria-label="Email" value={form.email} onChange={set('email')} required />
            <input
              className="input"
              type="password"
              placeholder="Contraseña temporal"
              aria-label="Contraseña temporal"
              autoComplete="new-password"
              minLength={8}
              value={form.password}
              onChange={set('password')}
              required
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-2xs text-subtle">
              {error ? <span className="text-red-400">{error}</span> : 'Mínimo 8 caracteres. Pídele que la cambie al entrar.'}
            </p>
            <Button type="submit" size="sm" variant="primary" disabled={adding}>
              {adding ? 'Añadiendo…' : 'Añadir'}
            </Button>
          </div>
        </form>
      )}
    </Section>
  );
}

function AccountSection() {
  const { user } = useAuth();
  const { toast } = useStore();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.changePassword(current, next);
      setCurrent('');
      setNext('');
      toast({ tone: 'success', title: 'Contraseña actualizada', description: 'Se cerró la sesión en tus otros dispositivos.' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Tu cuenta" description={user ? `${user.name} · ${user.email}` : undefined}>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="pw-current">Contraseña actual</label>
          <input id="pw-current" className="input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="pw-next">Nueva contraseña</label>
          <input id="pw-next" className="input" type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required />
        </div>
        <Button type="submit" variant="secondary" className="h-[38px]" disabled={saving}>
          {saving ? 'Guardando…' : 'Cambiar contraseña'}
        </Button>
        {error && <p className="text-xs text-red-400 sm:col-span-3">{error}</p>}
      </form>
    </Section>
  );
}

const ACCENTS = ['#4F46E5', '#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#111827'];

function Toggle({ checked, onChange, label, disabled }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className={clsx('flex items-center justify-between gap-3 py-1.5 text-[13px]', disabled ? 'opacity-60' : 'cursor-pointer')}>
      <span className="text-fg/90">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative h-5 w-9 shrink-0 rounded-full border p-0 transition-colors',
          checked ? 'border-accent bg-accent' : 'border-line-strong bg-canvas',
        )}
      >
        <span
          className={clsx(
            'absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </button>
    </label>
  );
}

function FormSection() {
  const { workspace, setWorkspace, toast } = useStore();
  const { user } = useAuth();
  const [draft, setDraft] = useState<FormSettings | null>(null);
  const [tab, setTab] = useState<'embed' | 'link'>('embed');
  const [saving, setSaving] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const isOwner = user?.role === 'owner';

  useEffect(() => {
    if (workspace) setDraft(workspace.form_settings);
  }, [workspace]);

  if (!workspace || !draft) return null;

  const url = `${window.location.origin}/f/${workspace.form_key}`;
  const embed = `<div id="flowdesk-form"></div>
<script>
(function () {
  var f = document.createElement('iframe');
  f.src = '${url}';
  f.title = '${draft.title.replace(/'/g, "\\'")}';
  f.style.cssText = 'width:100%;max-width:480px;height:620px;border:0;';
  document.getElementById('flowdesk-form').appendChild(f);
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'flowdesk:height' && e.data.key === '${workspace.form_key}') {
      f.style.height = e.data.height + 'px';
    }
  });
})();
</script>`;
  const dirty = JSON.stringify(draft) !== JSON.stringify(workspace.form_settings);
  const set = <K extends keyof FormSettings>(key: K, value: FormSettings[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d));

  const save = async () => {
    setSaving(true);
    try {
      setWorkspace(await api.updateWorkspace({ form_settings: draft }));
      toast({ tone: 'success', title: 'Formulario guardado' });
    } catch (err) {
      toast({ tone: 'error', title: 'No se pudo guardar', description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const rotate = async () => {
    try {
      setWorkspace(await api.rotateFormKey());
      setConfirmRotate(false);
      toast({ tone: 'success', title: 'Enlace regenerado', description: 'Actualiza el código en tu web.' });
    } catch (err) {
      toast({ tone: 'error', title: 'No se pudo regenerar', description: (err as Error).message });
    }
  };

  return (
    <Section
      title="Formulario para tu web"
      description="Pega este formulario en tu sitio: cada envío crea un lead en «Nuevo Lead» al instante."
      aside={
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button size="sm"><ExternalLink size={13} /> Abrir</Button>
        </a>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <fieldset disabled={!isOwner} className="space-y-3">
          <div>
            <label className="label" htmlFor="ff-title">Título</label>
            <input id="ff-title" className="input" maxLength={80} value={draft.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="ff-desc">Descripción</label>
            <textarea id="ff-desc" rows={2} className="input resize-none" maxLength={240} value={draft.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="ff-button">Texto del botón</label>
              <input id="ff-button" className="input" maxLength={40} value={draft.button} onChange={(e) => set('button', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="ff-source">Origen del lead</label>
              <input id="ff-source" className="input" maxLength={60} value={draft.source} onChange={(e) => set('source', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="ff-success">Mensaje al enviar</label>
            <input id="ff-success" className="input" maxLength={240} value={draft.success} onChange={(e) => set('success', e.target.value)} />
          </div>
          <div>
            <p className="label">Campos</p>
            <div className="rounded-lg border border-line bg-canvas px-3 py-1">
              <Toggle label="Nombre y correo (siempre)" checked onChange={() => {}} disabled />
              <Toggle label="Teléfono" checked={draft.fields.phone} onChange={(v) => set('fields', { ...draft.fields, phone: v })} />
              <Toggle label="Empresa" checked={draft.fields.company} onChange={(v) => set('fields', { ...draft.fields, company: v })} />
              <Toggle label="Mensaje" checked={draft.fields.message} onChange={(v) => set('fields', { ...draft.fields, message: v })} />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="label">Tema</p>
              <div className="flex gap-1 rounded-lg border border-line bg-canvas p-1">
                {(['light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('theme', t)}
                    className={clsx('rounded-md px-3 py-1 text-xs font-medium transition-colors', draft.theme === t ? 'bg-raised text-fg' : 'text-subtle hover:text-fg')}
                  >
                    {t === 'light' ? 'Claro' : 'Oscuro'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label">Color</p>
              <div className="flex gap-1.5">
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Color ${c}`}
                    onClick={() => set('accent', c)}
                    className={clsx('h-6 w-6 rounded-full border-2 transition-transform hover:scale-110', draft.accent === c ? 'border-fg' : 'border-transparent')}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          {isOwner && (
            <div className="flex justify-end gap-2 pt-1">
              {dirty && <Button size="sm" variant="ghost" onClick={() => setDraft(workspace.form_settings)}>Descartar</Button>}
              <Button size="sm" variant="primary" onClick={save} disabled={!dirty || saving}>
                {saving ? 'Guardando…' : 'Guardar formulario'}
              </Button>
            </div>
          )}
        </fieldset>

        <div className="flex flex-col gap-3">
          <p className="label">Vista previa</p>
          <div
            className={clsx(
              'flex flex-1 items-center justify-center rounded-xl border border-line p-5',
              draft.theme === 'light' ? 'bg-[#EEF0F4]' : 'bg-canvas',
            )}
          >
            <div className="w-full max-w-sm">
              <LeadCaptureForm settings={draft} preview />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <div className="mb-3 flex items-center gap-1">
          {(['embed', 'link'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx('rounded-md px-2.5 py-1 text-xs font-medium transition-colors', tab === t ? 'bg-raised text-fg' : 'text-subtle hover:text-fg')}
            >
              {t === 'embed' ? 'Código para tu web' : 'Enlace directo'}
            </button>
          ))}
          {isOwner && (
            <span className="ml-auto flex items-center gap-1.5">
              {confirmRotate ? (
                <>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmRotate(false)}>Cancelar</Button>
                  <Button size="sm" variant="danger" onClick={rotate}>Confirmar</Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setConfirmRotate(true)} title="El enlace actual dejará de funcionar">
                  Regenerar enlace
                </Button>
              )}
            </span>
          )}
        </div>
        {tab === 'embed' ? (
          <>
            <CodeBlock label="HTML" code={embed} />
            <p className="mt-2 text-2xs text-subtle">
              Pégalo donde quieras mostrar el formulario (Wix, WordPress, Webflow, Shopify o HTML). Se ajusta solo a su contenido.
            </p>
          </>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas py-1 pl-3 pr-1">
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-fg">{url}</code>
            <CopyButton text={url} />
          </div>
        )}
      </div>
    </Section>
  );
}

function WhatsAppSection() {
  const { workspace, setWorkspace, toast } = useStore();
  const { user } = useAuth();
  const [template, setTemplate] = useState('');
  const [country, setCountry] = useState('');
  const [saving, setSaving] = useState(false);
  const isOwner = user?.role === 'owner';

  useEffect(() => {
    if (!workspace) return;
    setTemplate(workspace.whatsapp_template);
    setCountry(workspace.country_code);
  }, [workspace]);

  if (!workspace) return null;
  const dirty = template !== workspace.whatsapp_template || country !== workspace.country_code;
  const preview = fillTemplate(template, {
    nombre: 'Valentina',
    empresa: workspace.name,
    vendedor: user?.name.split(' ')[0] ?? '',
    empresa_cliente: 'Estudio Norte',
  });

  const save = async () => {
    setSaving(true);
    try {
      setWorkspace(await api.updateWorkspace({ whatsapp_template: template, country_code: country }));
      toast({ tone: 'success', title: 'Mensaje de WhatsApp guardado' });
    } catch (err) {
      toast({ tone: 'error', title: 'No se pudo guardar', description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      title="WhatsApp"
      description="Mensaje que se escribe solo al pulsar «WhatsApp» en un lead. Cada contacto queda registrado en su historial."
    >
      <fieldset disabled={!isOwner} className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="wa-template">Mensaje</label>
            <textarea
              id="wa-template"
              rows={4}
              maxLength={500}
              className="input resize-none leading-relaxed"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  title={v.label}
                  onClick={() => setTemplate((t) => `${t}${t.endsWith(' ') || !t ? '' : ' '}${v.key}`)}
                  className="rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-2xs text-muted transition-colors hover:border-accent/50 hover:text-fg"
                >
                  {v.key}
                </button>
              ))}
            </div>
          </div>
          <div className="w-40">
            <label className="label" htmlFor="wa-country">Código de país</label>
            <div className="flex items-center rounded-md border border-line bg-canvas pl-3 focus-within:border-accent/70">
              <span className="text-sm text-subtle">+</span>
              <input
                id="wa-country"
                inputMode="numeric"
                className="w-full bg-transparent px-1 py-2 text-sm text-fg outline-none"
                value={country}
                onChange={(e) => setCountry(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </div>
            <p className="mt-1 text-2xs text-subtle">Para teléfonos sin «+». Chile 56, Argentina 54, México 52.</p>
          </div>
        </div>
        <div>
          <p className="label">Vista previa</p>
          <div className="rounded-xl border border-line bg-[#0b141a] p-4">
            <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-sm bg-[#005c4b] px-3 py-2 text-[13px] leading-relaxed text-[#e9edef] shadow">
              {preview || <span className="opacity-60">Escribe un mensaje…</span>}
              <p className="mt-1 text-right text-[10px] text-[#e9edef]/60">ahora</p>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-2xs text-subtle">
            <MessageCircle size={12} /> Ejemplo con un lead llamado Valentina, de Estudio Norte.
          </p>
          {isOwner && (
            <div className="mt-4 flex justify-end">
              <Button size="sm" variant="primary" onClick={save} disabled={!dirty || saving || !template.trim() || !country}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>
      </fieldset>
    </Section>
  );
}
