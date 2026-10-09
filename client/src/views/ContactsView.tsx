import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowDown, ArrowUp, ArrowUpDown, Bell, Download, Upload, Users } from 'lucide-react';
import { ImportModal } from '../components/ImportModal';
import { downloadFile, leadsToCsv } from '../lib/csv';
import { Header } from '../components/Header';
import { Avatar, Button, StatusBadge } from '../components/ui';
import { STATUSES } from '../lib/constants';
import { formatDate, money, timeAgo } from '../lib/format';
import type { Lead, Status } from '../lib/types';
import { useFilteredLeads, useStore } from '../store/AppStore';

type SortKey = 'name' | 'company' | 'status' | 'value' | 'last_contact_at' | 'created_at';

const STATUS_RANK = Object.fromEntries(STATUSES.map((s, i) => [s.id, i])) as Record<Status, number>;

const COMPARE: Record<SortKey, (a: Lead, b: Lead) => number> = {
  name: (a, b) => a.name.localeCompare(b.name, 'es'),
  company: (a, b) => (a.company ?? '').localeCompare(b.company ?? '', 'es'),
  status: (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status],
  value: (a, b) => a.value - b.value,
  // Leads never contacted sort as the oldest.
  last_contact_at: (a, b) => +new Date(a.last_contact_at ?? 0) - +new Date(b.last_contact_at ?? 0),
  created_at: (a, b) => +new Date(a.created_at) - +new Date(b.created_at),
};

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'company', label: 'Empresa / Origen', className: 'hidden md:table-cell' },
  { key: 'status', label: 'Etapa' },
  { key: 'value', label: 'Valor', className: 'text-right' },
  { key: 'last_contact_at', label: 'Último contacto', className: 'hidden lg:table-cell' },
  { key: 'created_at', label: 'Creado', className: 'hidden xl:table-cell' },
];

export function ContactsView() {
  const { openLead, loaded, leads, setNewLeadOpen, search } = useStore();
  const visible = useFilteredLeads();
  const [importOpen, setImportOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'created_at', dir: -1 });

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: visible.length };
    for (const l of visible) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [visible]);

  const rows = useMemo(
    () =>
      visible
        .filter((l) => statusFilter === 'all' || l.status === statusFilter)
        .sort((a, b) => COMPARE[sort.key](a, b) * sort.dir || b.id - a.id),
    [visible, statusFilter, sort],
  );

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'name' || key === 'company' ? 1 : -1 }));

  const totalLeads = Object.keys(leads).length;

  return (
    <>
      <Header title="Contactos" subtitle={`${totalLeads} ${totalLeads === 1 ? 'lead' : 'leads'} en total`} />

      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-4 py-2 md:px-6">
        {[{ id: 'all' as const, label: 'Todos' }, ...STATUSES].map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            className={clsx(
              'flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              statusFilter === s.id ? 'bg-raised text-fg' : 'text-subtle hover:text-fg',
            )}
          >
            {s.label}
            <span className="tabular-nums text-subtle">{counts[s.id] ?? 0}</span>
          </button>
        ))}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-3">
          <Button size="sm" variant="ghost" onClick={() => setImportOpen(true)}>
            <Upload size={13} /> Importar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={rows.length === 0}
            onClick={() => downloadFile(`leads-${new Date().toISOString().slice(0, 10)}.csv`, leadsToCsv(rows))}
            title="Exporta los leads visibles con los filtros actuales"
          >
            <Download size={13} /> Exportar
          </Button>
        </div>
      </div>
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />

      <div className="min-h-0 flex-1 overflow-auto">
        {loaded && rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <Users size={20} className="text-subtle" />
            <p className="text-sm text-muted">
              {search || statusFilter !== 'all' ? 'Ningún lead coincide con los filtros.' : 'Aún no tienes leads.'}
            </p>
            {!search && statusFilter === 'all' && (
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => setNewLeadOpen(true)}>Crear el primero</Button>
                <Button onClick={() => setImportOpen(true)}>
                  <Upload size={13} /> Importar CSV
                </Button>
              </div>
            )}
          </div>
        ) : (
          <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
            <thead className="sticky top-0 z-10 bg-canvas">
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key} className={clsx('border-b border-line px-4 py-2 font-medium first:pl-4 md:first:pl-6', c.className)}>
                    <button
                      onClick={() => toggleSort(c.key)}
                      className={clsx(
                        'inline-flex items-center gap-1 text-xs transition-colors hover:text-fg',
                        sort.key === c.key ? 'text-fg' : 'text-subtle',
                      )}
                    >
                      {c.label}
                      {sort.key !== c.key ? (
                        <ArrowUpDown size={11} className="opacity-50" />
                      ) : sort.dir === 1 ? (
                        <ArrowUp size={11} />
                      ) : (
                        <ArrowDown size={11} />
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => (
                <tr
                  key={lead.id}
                  tabIndex={0}
                  onClick={() => openLead(lead.id)}
                  onKeyDown={(e) => e.key === 'Enter' && openLead(lead.id)}
                  className="cursor-pointer outline-none transition-colors hover:bg-surface focus-visible:bg-surface"
                >
                  <td className="border-b border-line/60 px-4 py-2.5 md:pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar name={lead.name} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-medium text-fg">
                          {lead.name}
                          {lead.pending_reminders > 0 && <Bell size={11} className="text-amber-400/90" />}
                        </p>
                        <p className="truncate text-xs text-subtle">{lead.email ?? lead.phone ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden border-b border-line/60 px-4 py-2.5 md:table-cell">
                    <p className="truncate text-fg/90">{lead.company ?? '—'}</p>
                    <p className="truncate text-xs text-subtle">{lead.source}</p>
                  </td>
                  <td className="border-b border-line/60 px-4 py-2.5">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="border-b border-line/60 px-4 py-2.5 text-right font-medium tabular-nums">
                    {money(lead.value)}
                  </td>
                  <td className="hidden border-b border-line/60 px-4 py-2.5 text-muted lg:table-cell">
                    {lead.last_contact_at ? timeAgo(lead.last_contact_at) : <span className="text-subtle">Sin contacto</span>}
                  </td>
                  <td className="hidden border-b border-line/60 px-4 py-2.5 text-muted xl:table-cell">
                    {formatDate(lead.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
