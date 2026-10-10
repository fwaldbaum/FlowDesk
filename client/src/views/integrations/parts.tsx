import { createContext, useContext, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Check, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { CodeBlock, CopyButton } from '../../components/copy';
import { IconButton } from '../../components/ui';

/** Webhook details of the current workspace, shared by every guide step. */
export const WebhookContext = createContext<{ endpoint: string; key: string | null }>({ endpoint: '', key: null });

/** Name of a button, menu or field in a third-party interface. */
export function Ui({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded border border-line bg-raised px-1.5 py-px text-[12px] font-medium text-fg">
      {children}
    </span>
  );
}

export function B({ children }: { children: ReactNode }) {
  return <b className="font-medium text-fg">{children}</b>;
}

export function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-accent-soft hover:text-fg">
      {children} <ExternalLink size={11} />
    </a>
  );
}

export function AppLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className="font-medium text-accent-soft hover:text-fg">{children}</Link>;
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-xs leading-relaxed text-amber-200/90">{children}</p>;
}

export function CopyField({ label, value, display }: { label: string; value: string; display?: string }) {
  return (
    <div className="min-w-0">
      <p className="label">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas py-1 pl-3 pr-1">
        <code className="min-w-0 flex-1 truncate font-mono text-xs text-fg">{display ?? value}</code>
        <CopyButton text={value} />
      </div>
    </div>
  );
}

function StaticField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex h-[34px] items-center rounded-lg border border-line bg-canvas px-3 font-mono text-xs text-fg">{value}</div>
    </div>
  );
}

/** URL, method and the key header, as every HTTP-capable tool asks for them. */
export function WebhookFields({ headerHint }: { headerHint?: ReactNode }) {
  const { endpoint, key } = useContext(WebhookContext);
  const [reveal, setReveal] = useState(false);
  const value = key ?? '…';
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <CopyField label="URL" value={endpoint} />
        <StaticField label="Método" value="POST" />
      </div>
      <div>
        <p className="label">Cabecera (header){headerHint}</p>
        <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr]">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas py-1 pl-3 pr-1">
            <span className="text-2xs text-subtle">Nombre</span>
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-fg">X-Webhook-Key</code>
            <CopyButton text="X-Webhook-Key" />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-line bg-canvas py-1 pl-3 pr-1">
            <span className="mr-1 text-2xs text-subtle">Valor</span>
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-fg">
              {reveal ? value : `${value.slice(0, 6)}${'•'.repeat(18)}`}
            </code>
            <IconButton label={reveal ? 'Ocultar clave' : 'Mostrar clave'} onClick={() => setReveal((v) => !v)}>
              {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
            </IconButton>
            <CopyButton text={value} />
          </div>
        </div>
        <p className="mt-1.5 text-xs text-subtle">
          Es la clave de tu espacio: quien la tenga puede crear leads en él. Puedes regenerarla en{' '}
          <AppLink to="/app/configuracion">Configuración</AppLink>.
        </p>
      </div>
    </div>
  );
}

export type Fields = { name: string; email?: string; phone?: string; notes?: string; company?: string };

export function jsonBody(source: string, f: Fields) {
  const body: Record<string, string> = { name: f.name };
  if (f.email) body.email = f.email;
  if (f.phone) body.phone = f.phone;
  if (f.company) body.company = f.company;
  body.source = source;
  if (f.notes) body.notes = f.notes;
  return JSON.stringify(body, null, 2);
}

export function FieldReference({ source }: { source: string }) {
  return (
    <ul className="space-y-1.5 rounded-lg border border-line bg-canvas px-3.5 py-3 text-xs">
      <li><code className="text-fg">name</code> <span className="text-subtle">— obligatorio. Si no hay nombre, usa el correo o el teléfono.</span></li>
      <li><code className="text-fg">email</code>, <code className="text-fg">phone</code> <span className="text-subtle">— opcionales, pero necesarios para escribirle.</span></li>
      <li><code className="text-fg">source</code> <span className="text-subtle">— déjalo como «{source}» para ver el estado de la conexión aquí.</span></li>
      <li><code className="text-fg">company</code>, <code className="text-fg">value</code>, <code className="text-fg">notes</code> <span className="text-subtle">— extras opcionales.</span></li>
    </ul>
  );
}

const MAPPING_HINT =
  'Reemplaza cada {{…}} por el dato real: borra el texto entre comillas y haz clic en el campo que entrega el módulo anterior en el panel de mapeo. Si los campos no aparecen, ejecuta el escenario una vez con Run once para que Make los conozca.';

/** Make → HTTP "Make a request" pointing at the FlowDesk webhook. */
export function MakeHttp({ source, fields, from }: { source: string; fields: Fields; from: string }) {
  return (
    <>
      <p>
        Haz clic en el <Ui>+</Ui> a la derecha del módulo de {from}, agrega la app <Ui>HTTP</Ui> y elige{' '}
        <Ui>Make a request</Ui>. Configúralo así:
      </p>
      <WebhookFields />
      <p>
        En <Ui>Body content type</Ui> elige <Ui>application/json</Ui> y pega esto en <Ui>Body content</Ui>:
      </p>
      <CodeBlock label="Body (JSON)" code={jsonBody(source, fields)} />
      <p>{MAPPING_HINT}</p>
      <FieldReference source={source} />
    </>
  );
}

export function MakeRun({ test }: { test?: ReactNode }) {
  return (
    <>
      <p>
        Pulsa <Ui>Run once</Ui> en Make y {test ?? 'genera un registro de prueba'}. Verás la ejecución en Make y el lead
        aparecerá en <B>Nuevo Lead</B>; la tarjeta de estado de esta guía se pondrá en verde.
      </p>
      <p>
        Si todo salió bien, guarda el escenario y actívalo con el interruptor de la parte inferior del editor para que
        funcione siempre, sin tener Make abierto.
      </p>
    </>
  );
}

/** Zapier → "Webhooks by Zapier" POST pointing at the FlowDesk webhook. */
export function ZapierPost({ source, fields }: { source: string; fields: Fields }) {
  const rows = Object.entries(JSON.parse(jsonBody(source, fields)) as Record<string, string>);
  return (
    <>
      <p>
        Agrega una acción <Ui>Webhooks by Zapier</Ui> con el evento <Ui>POST</Ui>. En <Ui>Payload Type</Ui> elige{' '}
        <Ui>json</Ui> y completa:
      </p>
      <WebhookFields headerHint=" — en Headers" />
      <div>
        <p className="label">Data (una fila por campo)</p>
        <div className="divide-y divide-line/70 rounded-lg border border-line bg-canvas">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[110px_1fr] gap-3 px-3 py-2 font-mono text-xs">
              <span className="text-fg">{k}</span>
              <span className={clsx('truncate', v.startsWith('{{') || v.includes('{{') ? 'text-accent-soft' : 'text-muted')}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <p>
        Donde dice <code className="text-fg">{'{{…}}'}</code>, inserta el campo correspondiente del disparador con el botón
        de datos de Zapier.
      </p>
      <Note>Webhooks by Zapier es una app premium: necesitas un plan pago de Zapier.</Note>
    </>
  );
}

/** ManyChat "External Request" settings. */
export function ManyChatRequest() {
  return (
    <>
      <WebhookFields headerHint=" — pestaña Headers" />
      <p>
        En la pestaña <Ui>Body</Ui> elige JSON y pega este contenido. Reemplaza cada <code className="text-fg">{'{{…}}'}</code> por
        el campo del contacto con el selector de campos del editor de ManyChat:
      </p>
      <CodeBlock label="Body (JSON)" code={jsonBody('Instagram DM', { name: '{{Nombre completo}}', email: '{{Correo}}', phone: '{{Teléfono}}' })} />
      <FieldReference source="Instagram DM" />
    </>
  );
}

export function StepCard({ n, title, done, onToggle, children }: {
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
          done
            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
            : 'border-line-strong bg-surface text-muted hover:border-accent/60 hover:text-fg',
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
