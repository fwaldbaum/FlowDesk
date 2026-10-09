import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { MailWarning, RefreshCw, Search, Users, X } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { CountUp } from '../components/motion';
import { Header } from '../components/Header';
import { Avatar, IconButton } from '../components/ui';
import { api } from '../lib/api';
import { COMPANY_SIZE_LABELS, HEARD_FROM_LABELS } from '../lib/constants';
import { formatDate, timeAgo } from '../lib/format';
import type { AdminStats, AdminUser } from '../lib/types';
import { useStore } from '../store/AppStore';
import { AdminUserPanel, UserBadges } from './AdminUserPanel';

type Filter = 'all' | 'active' | 'banned' | 'admins' | 'unverified';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Activos' },
  { id: 'banned', label: 'Suspendidos' },
  { id: 'admins', label: 'Administradores' },
  { id: 'unverified', label: 'Sin verificar' },
];

function StatTile({ label, value, hint }: { label: string; value: number | undefined; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3.5">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-fg">
        {value == null ? '—' : <CountUp value={value} />}
      </p>
      {hint && <p className="mt-0.5 text-2xs text-subtle">{hint}</p>}
    </div>
  );
}

/** Single-series horizontal bars: one hue, value labelled at the bar end, no legend needed. */
function BarList({ title, rows, total }: {
  title: string;
  rows: { label: string; count: number }[];
  total: number;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-fg">{title}</h3>
        <span className="text-2xs text-subtle">{total} {total === 1 ? 'respuesta' : 'respuestas'}</span>
      </div>
      <ul className="space-y-0.5">
        {rows.map((r) => {
          const pct = total ? Math.round((r.count / total) * 100) : 0;
          return (
            <li
              key={r.label}
              title={`${r.label}: ${r.count} de ${total} (${pct}%)`}
              className="group grid grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-3 rounded-md px-1.5 py-1.5 hover:bg-raised/60"
            >
              <span className="truncate text-xs text-muted group-hover:text-fg">{r.label}</span>
              <span className="relative h-2">
                {r.count > 0 && (
                  <span
                    className="absolute inset-y-0 left-0 rounded-r bg-accent-soft"
                    style={{ width: `${(r.count / max) * 100}%` }}
                  />
                )}
              </span>
              <span className="w-14 text-right text-xs tabular-nums text-fg">
                {r.count}
                <span className="ml-1 text-subtle">{pct}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function AdminView() {
  const { toast } = useStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<number | null>(null);

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = window.setTimeout(() => setQuery(q.trim()), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  const loadUsers = useCallback(async () => {
    try {
      setUsers(await api.admin.users(query, filter));
    } catch (err) {
      toast({ tone: 'error', title: 'No se pudieron cargar los usuarios', description: (err as Error).message });
    }
  }, [query, filter, toast]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await api.admin.stats());
    } catch {
      /* the users list surfaces errors */
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refresh = () => {
    loadUsers();
    loadStats();
  };

  return (
    <>
      <Header
        title="Administración"
        subtitle="Todas las cuentas de FlowDesk"
        actions={
          <IconButton label="Actualizar" onClick={refresh}>
            <RefreshCw size={14} />
          </IconButton>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
          {stats && !stats.email_enabled && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3 text-[13px]">
              <MailWarning size={16} className="mt-0.5 shrink-0 text-amber-300" />
              <p className="text-amber-100/90">
                El envío de correos no está configurado, así que la verificación de correo y «Olvidé mi contraseña» están
                desactivados. Agrega <code className="text-fg">RESEND_API_KEY</code> (y{' '}
                <code className="text-fg">EMAIL_FROM</code> con un dominio verificado) en las variables de entorno.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatTile label="Usuarios" value={stats?.users} />
            <StatTile label="Nuevos" value={stats?.new_7d} hint="últimos 7 días" />
            <StatTile label="Espacios" value={stats?.workspaces} hint="empresas registradas" />
            <StatTile label="Leads" value={stats?.leads} hint="en todos los espacios" />
            <StatTile label="Suspendidos" value={stats?.banned} />
          </div>

          {stats && (
            <div className="grid gap-3 lg:grid-cols-2">
              <BarList
                title="¿Cómo conocieron FlowDesk?"
                total={stats.surveys}
                rows={stats.heard_from.map((r) => ({ label: HEARD_FROM_LABELS[r.key], count: r.count }))}
              />
              <BarList
                title="Tamaño de empresa"
                total={stats.surveys}
                rows={stats.company_size.map((r) => ({ label: COMPANY_SIZE_LABELS[r.key], count: r.count }))}
              />
            </div>
          )}

          <section className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center">
              <div className="relative sm:w-72">
                <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-subtle" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nombre, correo, teléfono o empresa"
                  aria-label="Buscar usuarios"
                  className="h-8 w-full rounded-md border border-line bg-canvas pl-8 pr-8 text-[13px] text-fg placeholder:text-subtle hover:border-line-strong focus:border-accent/70 focus:outline-none"
                />
                {q && (
                  <button
                    aria-label="Limpiar búsqueda"
                    onClick={() => setQ('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-subtle hover:text-fg"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex gap-1 overflow-x-auto">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={clsx(
                      'shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      filter === f.id ? 'bg-raised text-fg' : 'text-subtle hover:text-fg',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <span className="text-2xs text-subtle sm:ml-auto">
                {users ? `${users.length} ${users.length === 1 ? 'cuenta' : 'cuentas'}` : ''}
              </span>
            </div>

            {users && users.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <Users size={18} className="text-subtle" />
                <p className="text-sm text-muted">Ninguna cuenta coincide.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left text-[13px]">
                  <thead>
                    <tr className="text-xs text-subtle">
                      {['Usuario', 'Empresa', 'Teléfono', 'Tamaño', 'Estado', 'Registro', 'Último acceso'].map((h) => (
                        <th key={h} className="border-b border-line px-4 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(users ?? []).map((u) => (
                      <tr
                        key={u.id}
                        tabIndex={0}
                        onClick={() => setSelected(u.id)}
                        onKeyDown={(e) => e.key === 'Enter' && setSelected(u.id)}
                        className={clsx(
                          'cursor-pointer outline-none transition-colors hover:bg-raised/50 focus-visible:bg-raised/50',
                          u.banned_at && 'opacity-70',
                        )}
                      >
                        <td className="border-b border-line/60 px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-fg">{u.name}</p>
                              <p className="truncate text-xs text-subtle">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="border-b border-line/60 px-4 py-2.5">
                          <p className="truncate text-fg/90">{u.workspace_name}</p>
                          <p className="truncate text-xs text-subtle">
                            {u.job_title ?? '—'} · {u.role === 'owner' ? 'Propietario' : 'Miembro'}
                          </p>
                        </td>
                        <td className="whitespace-nowrap border-b border-line/60 px-4 py-2.5 text-muted">{u.phone ?? '—'}</td>
                        <td className="whitespace-nowrap border-b border-line/60 px-4 py-2.5 text-muted">
                          {u.company_size ? COMPANY_SIZE_LABELS[u.company_size] : <span className="text-subtle">Sin encuesta</span>}
                        </td>
                        <td className="border-b border-line/60 px-4 py-2.5">
                          <UserBadges user={u} />
                        </td>
                        <td className="whitespace-nowrap border-b border-line/60 px-4 py-2.5 text-muted">{formatDate(u.created_at)}</td>
                        <td className="whitespace-nowrap border-b border-line/60 px-4 py-2.5 text-muted">
                          {u.last_login_at ? timeAgo(u.last_login_at) : <span className="text-subtle">Nunca</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      <AnimatePresence>
      {selected != null && (
        <AdminUserPanel
          key={selected}
          userId={selected}
          onClose={() => setSelected(null)}
          onChanged={refresh}
          onDeleted={() => {
            setSelected(null);
            refresh();
          }}
        />
      )}
      </AnimatePresence>
    </>
  );
}
