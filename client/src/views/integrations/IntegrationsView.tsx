import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CircleCheck, Clock, RefreshCw, Search } from 'lucide-react';
import { Header } from '../../components/Header';
import { ease } from '../../components/motion';
import { IconButton } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDateTime, timeAgo } from '../../lib/format';
import type { WebhookEvent } from '../../lib/types';
import { useStore } from '../../store/AppStore';
import { CATEGORIES, GUIDE_BY_ID, GUIDES, type Category, type Guide } from './guides';
import { B, StepCard, WebhookContext } from './parts';

const progressKey = (id: string) => `fd:guide:${id}`;

function readProgress(id: string): number[] {
  try {
    const value = JSON.parse(localStorage.getItem(progressKey(id)) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function matches(guide: Guide, e: WebhookEvent) {
  const source = (e.payload as { source?: unknown } | null)?.source;
  return Boolean(guide.source) && typeof source === 'string' && source.trim().toLowerCase() === guide.source!.toLowerCase();
}

/** Recent webhook activity, refreshed whenever a webhook lead arrives. */
function useWebhookEvents() {
  const { webhookTick } = useStore();
  const [events, setEvents] = useState<WebhookEvent[] | null>(null);
  const load = useCallback(async () => {
    try {
      setEvents(await api.webhookEvents());
    } catch {
      setEvents([]);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load, webhookTick]);
  return { events, reload: load };
}

function GuideIcon({ guide, size = 'md' }: { guide: Guide; size?: 'md' | 'lg' }) {
  const Icon = guide.icon;
  return (
    <span
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-lg border',
        size === 'lg' ? 'h-12 w-12' : 'h-9 w-9',
      )}
      style={{ backgroundColor: `${guide.color}1A`, borderColor: `${guide.color}40`, color: guide.color }}
    >
      <Icon size={size === 'lg' ? 22 : 17} strokeWidth={1.75} />
    </span>
  );
}

function ViaBadge({ via }: { via: string }) {
  return <span className="rounded border border-line bg-canvas px-1.5 py-px text-2xs font-medium text-muted">{via}</span>;
}

// ---- Catalog --------------------------------------------------------------------

export function IntegrationsView() {
  const { events } = useWebhookEvents();
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [query, setQuery] = useState('');

  const connected = useMemo(
    () => new Set(GUIDES.filter((g) => events?.some((e) => e.status === 'accepted' && matches(g, e))).map((g) => g.id)),
    [events],
  );

  const q = query.trim().toLowerCase();
  const list = GUIDES.filter(
    (g) =>
      (category === 'all' || g.category === category) &&
      (!q || `${g.name} ${g.summary} ${g.via}`.toLowerCase().includes(q)),
  );

  return (
    <>
      <Header title="Integraciones" subtitle={`${GUIDES.length} guías para que tus leads lleguen solos al tablero`} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:pb-0">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={clsx(
                    'relative h-8 shrink-0 rounded-md px-3 text-[13px] font-medium transition-colors',
                    category === c.id ? 'text-fg' : 'text-muted hover:text-fg',
                  )}
                >
                  {category === c.id && (
                    <motion.span layoutId="integration-cat" className="absolute inset-0 rounded-md border border-line bg-raised" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
                  )}
                  <span className="relative">{c.label}</span>
                </button>
              ))}
            </div>
            <label className="flex h-8 items-center gap-2 rounded-md border border-line bg-surface px-2.5 md:ml-auto md:w-56">
              <Search size={13} className="shrink-0 text-subtle" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar integración…"
                className="w-full min-w-0 bg-transparent text-[13px] text-fg outline-none placeholder:text-subtle"
              />
            </label>
          </div>

          {list.length === 0 ? (
            <p className="py-16 text-center text-sm text-subtle">No hay guías que coincidan con «{query}».</p>
          ) : (
            <motion.ul layout className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence initial={false}>
                {list.map((g, i) => {
                  const done = readProgress(g.id).length;
                  return (
                    <motion.li
                      key={g.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease, delay: Math.min(i, 8) * 0.025 } }}
                      exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    >
                      <Link
                        to={`/app/integraciones/${g.id}`}
                        className="group flex h-full flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-raised/40"
                      >
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <GuideIcon guide={g} />
                          {connected.has(g.id) ? (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-2xs font-medium text-emerald-300">
                              <CircleCheck size={11} /> Conectado
                            </span>
                          ) : done > 0 ? (
                            <span className="rounded-full bg-raised px-2 py-0.5 text-2xs text-muted">
                              {Math.min(done, g.steps.length)}/{g.steps.length} pasos
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm font-semibold text-fg">{g.name}</p>
                        <p className="mt-1 flex-1 text-xs leading-relaxed text-muted">{g.summary}</p>
                        <div className="mt-3 flex items-center gap-2 text-2xs text-subtle">
                          <ViaBadge via={g.via} />
                          <span className="flex items-center gap-1"><Clock size={11} /> {g.minutes} min</span>
                          <ArrowRight size={13} className="ml-auto text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
                        </div>
                      </Link>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </motion.ul>
          )}

          <p className="mt-8 text-center text-xs text-subtle">
            ¿Usas otra herramienta? Cualquier app que pueda hacer una solicitud HTTP sirve: usa la URL y la clave de tu webhook
            en <Link to="/app/configuracion" className="text-accent-soft hover:text-fg">Configuración</Link>.
          </p>
        </div>
      </div>
    </>
  );
}

// ---- Guide ----------------------------------------------------------------------

export function IntegrationGuide() {
  const { id = '' } = useParams();
  const guide = GUIDE_BY_ID[id];
  const { events, reload } = useWebhookEvents();
  const [key, setKey] = useState<string | null>(null);
  const [done, setDone] = useState<number[]>(() => readProgress(id));

  useEffect(() => {
    api.webhookConfig().then((c) => setKey(c.key)).catch(() => {});
  }, []);

  if (!guide) return <Navigate to="/app/integraciones" replace />;

  const toggle = (n: number) =>
    setDone((d) => {
      const next = d.includes(n) ? d.filter((x) => x !== n) : [...d, n];
      try {
        localStorage.setItem(progressKey(guide.id), JSON.stringify(next));
      } catch {
        // Progress is a convenience; ignore storage failures.
      }
      return next;
    });

  const last = events?.find((e) => matches(guide, e));

  return (
    <WebhookContext.Provider value={{ endpoint: `${window.location.origin}/api/webhooks/lead`, key }}>
      <Header title={guide.name} subtitle={`Guía de integración · ${guide.via}`} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 md:px-6">
          <Link to="/app/integraciones" className="inline-flex w-fit items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg">
            <ArrowLeft size={13} /> Todas las integraciones
          </Link>

          <section className="relative overflow-hidden rounded-xl border border-line bg-surface p-5 md:p-6">
            <div aria-hidden className="bg-grid absolute inset-0 opacity-40" />
            <div
              aria-hidden
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full"
              style={{ background: `radial-gradient(closest-side, ${guide.color}26, transparent)` }}
            />
            <div className="relative flex items-start gap-4">
              <GuideIcon guide={guide} size="lg" />
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-fg">{guide.name}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{guide.summary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-2xs text-subtle">
                  <ViaBadge via={guide.via} />
                  <span className="flex items-center gap-1"><Clock size={11} /> {guide.minutes} min aprox.</span>
                  <span>· {guide.steps.length} pasos</span>
                  {guide.source && <span>· Origen del lead: «{guide.source}»</span>}
                </div>
              </div>
            </div>
          </section>

          {guide.source && (
            <section className="flex items-center gap-3 rounded-xl border border-line bg-surface px-5 py-3.5">
              <span
                className={clsx(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  last?.status === 'accepted' ? 'bg-emerald-500/15 text-emerald-300' : last ? 'bg-red-500/10 text-red-300' : 'bg-raised',
                )}
              >
                {last?.status === 'accepted' ? (
                  <CircleCheck size={16} />
                ) : last ? (
                  <AlertTriangle size={15} />
                ) : (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-fg">
                  {events === null
                    ? 'Revisando conexión…'
                    : last?.status === 'accepted'
                      ? 'Conexión funcionando'
                      : last
                        ? 'El último envío fue rechazado'
                        : `Esperando el primer lead de ${guide.name}`}
                </p>
                <p className="truncate text-xs text-subtle">
                  {last
                    ? `${last.status === 'accepted' ? last.lead_name ?? 'Lead' : last.error} · ${timeAgo(last.created_at)}`
                    : `Cuando llegue un lead con origen «${guide.source}» lo verás aquí.`}
                </p>
              </div>
              {last && <span className="hidden text-2xs text-subtle sm:block">{formatDateTime(last.created_at)}</span>}
              <IconButton label="Actualizar" onClick={reload}>
                <RefreshCw size={14} />
              </IconButton>
            </section>
          )}

          <section className="rounded-xl border border-line bg-surface px-5 py-4">
            <h3 className="mb-3 text-sm font-semibold text-fg">Antes de empezar necesitas</h3>
            <ul className="space-y-2 text-[13px] text-muted">
              {guide.requirements.map((r, i) => (
                <li key={i} className="flex gap-2.5">
                  <Check size={14} className="mt-0.5 shrink-0 text-accent-soft" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </section>

          <ol className="space-y-5">
            {guide.steps.map((s, i) => (
              <StepCard key={s.title} n={i + 1} title={s.title} done={done.includes(i + 1)} onToggle={() => toggle(i + 1)}>
                {s.body}
              </StepCard>
            ))}
          </ol>

          <section className="rounded-xl border border-line bg-surface">
            <h3 className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-sm font-semibold text-fg">
              <AlertTriangle size={14} className="text-amber-300" /> Si algo no funciona
            </h3>
            <dl className="divide-y divide-line/70 text-[13px]">
              {[
                ...(guide.tips ?? []),
                ...(guide.source
                  ? ([
                      ['Error 401', 'La clave no coincide. Revisa la cabecera X-Webhook-Key (sin espacios) o cópiala de nuevo si la regeneraste.'],
                      ['Error 422', 'Falta un dato obligatorio o tiene un formato inválido. Lo más común: name vacío o un correo mal escrito.'],
                    ] as [string, string][])
                  : []),
              ].map(([q, a]) => (
                <div key={q} className="px-5 py-3">
                  <dt className="font-medium text-fg">{q}</dt>
                  <dd className="mt-0.5 text-muted">{a}</dd>
                </div>
              ))}
              <div className="px-5 py-3">
                <dt className="font-medium text-fg">¿Dónde veo lo que llega?</dt>
                <dd className="mt-0.5 text-muted">
                  En <Link to="/app/configuracion" className="text-accent-soft hover:text-fg">Configuración</Link> →{' '}
                  <B>Actividad del webhook</B> aparecen las últimas solicitudes, aceptadas y rechazadas, con el motivo.
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </WebhookContext.Provider>
  );
}
