import { memo, useMemo, useRef, useState } from 'react';
import {
  closestCorners, DndContext, DragOverlay, KeyboardSensor, MeasuringStrategy, PointerSensor,
  useDroppable, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { Bell, Clock, Inbox } from 'lucide-react';
import { Header } from '../components/Header';
import { StatusDot } from '../components/ui';
import { STATUSES } from '../lib/constants';
import { money, timeAgo } from '../lib/format';
import type { Lead, Status } from '../lib/types';
import { useFilteredLeads, useStore } from '../store/AppStore';

type Columns = Record<Status, number[]>;

const COLUMN_PREFIX = 'col:';
const isColumnId = (id: UniqueIdentifier): id is string =>
  typeof id === 'string' && id.startsWith(COLUMN_PREFIX);

function findColumn(id: UniqueIdentifier, columns: Columns): Status | null {
  if (isColumnId(id)) return id.slice(COLUMN_PREFIX.length) as Status;
  return STATUSES.find((s) => columns[s.id].includes(id as number))?.id ?? null;
}

export function BoardView() {
  const { leads, moveLead, search } = useStore();
  const visible = useFilteredLeads();

  const base = useMemo<Columns>(() => {
    const cols = Object.fromEntries(STATUSES.map((s) => [s.id, [] as Lead[]])) as Record<Status, Lead[]>;
    for (const lead of visible) cols[lead.status].push(lead);
    return Object.fromEntries(
      STATUSES.map((s) => [
        s.id,
        cols[s.id].sort((a, b) => a.position - b.position || a.id - b.id).map((l) => l.id),
      ]),
    ) as Columns;
  }, [visible]);

  // While dragging we render from a local copy so cross-column hovering is instant.
  const [dragColumns, setDragColumns] = useState<Columns | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const startColumns = useRef<Columns>(base);
  const columns = dragColumns ?? base;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    startColumns.current = base;
    setDragColumns(base);
    setActiveId(active.id as number);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    setDragColumns((prev) => {
      const cols = prev ?? base;
      const from = findColumn(active.id, cols);
      const to = findColumn(over.id, cols);
      if (!from || !to || from === to) return prev;

      const target = cols[to].slice();
      let index = target.length;
      if (!isColumnId(over.id)) {
        const overIndex = target.indexOf(over.id as number);
        const translated = active.rect.current.translated;
        const below = translated && translated.top > over.rect.top + over.rect.height / 2;
        if (overIndex >= 0) index = overIndex + (below ? 1 : 0);
      }
      target.splice(index, 0, active.id as number);
      return { ...cols, [from]: cols[from].filter((id) => id !== active.id), [to]: target };
    });
  };

  const reset = () => {
    setDragColumns(null);
    setActiveId(null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = active.id as number;
    const cols = dragColumns ?? base;
    const status = findColumn(id, cols);
    if (!status || !over) return reset();

    let items = cols[status];
    if (!isColumnId(over.id) && findColumn(over.id, cols) === status) {
      const from = items.indexOf(id);
      const to = items.indexOf(over.id as number);
      if (from !== to) items = arrayMove(items, from, to);
    }
    const beforeId = items[items.indexOf(id) + 1] ?? null;

    const original = startColumns.current[leads[id]!.status];
    const originalBefore = original[original.indexOf(id) + 1] ?? null;
    const changed = status !== leads[id]!.status || beforeId !== originalBefore;

    reset();
    if (changed) moveLead(id, status, beforeId);
  };

  const stats = useMemo(() => {
    const all = Object.values(leads);
    const sum = (f: (l: Lead) => boolean) => all.filter(f).reduce((acc, l) => acc + l.value, 0);
    const won = all.filter((l) => l.status === 'won').length;
    const closed = won + all.filter((l) => l.status === 'lost').length;
    return {
      open: sum((l) => l.status !== 'won' && l.status !== 'lost'),
      won: sum((l) => l.status === 'won'),
      rate: closed ? Math.round((won / closed) * 100) : null,
    };
  }, [leads]);

  const activeLead = activeId != null ? leads[activeId] : undefined;

  return (
    <>
      <Header
        title="Tablero"
        subtitle={
          <>
            Pipeline abierto <span className="text-muted tabular-nums">{money(stats.open)}</span>
            <span className="mx-2 text-line-strong">/</span>
            Ganado <span className="text-muted tabular-nums">{money(stats.won)}</span>
            {stats.rate != null && (
              <>
                <span className="mx-2 text-line-strong">/</span>
                Tasa de cierre <span className="text-muted tabular-nums">{stats.rate}%</span>
              </>
            )}
          </>
        }
      />
      <div className="min-h-0 flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={reset}
        >
          <div className="flex h-full gap-3 p-4 md:px-6">
            {STATUSES.map((s) => (
              <Column key={s.id} status={s.id} ids={columns[s.id]} filtered={Boolean(search.trim())} />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            {activeLead && <LeadCard lead={activeLead} overlay />}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  );
}

function Column({ status, ids, filtered }: { status: Status; ids: number[]; filtered: boolean }) {
  const { leads, loaded } = useStore();
  const { setNodeRef, isOver } = useDroppable({ id: `${COLUMN_PREFIX}${status}` });
  const meta = STATUSES.find((s) => s.id === status)!;
  const total = ids.reduce((acc, id) => acc + (leads[id]?.value ?? 0), 0);

  return (
    <section className="flex w-[280px] shrink-0 flex-col rounded-xl border border-line/70 bg-surface/40">
      <div className="flex items-center gap-2 px-3 pb-2 pt-3">
        <StatusDot status={status} />
        <h2 className="truncate text-[13px] font-medium text-fg">{meta.label}</h2>
        <span className="rounded bg-raised px-1.5 text-2xs font-medium tabular-nums text-muted">{ids.length}</span>
        <span className="ml-auto text-xs tabular-nums text-subtle">{money(total)}</span>
      </div>

      <SortableContext id={status} items={ids} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={clsx(
            'mx-1 mb-1 flex min-h-[96px] flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-1.5 transition-colors',
            isOver && 'bg-raised/40',
          )}
        >
          {ids.map((id) => leads[id] && <SortableCard key={id} lead={leads[id]!} />)}
          {loaded && ids.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line px-4 py-8 text-center">
              {status === 'new' && !filtered && <Inbox size={16} className="text-subtle" />}
              <p className="text-xs text-subtle">
                {filtered
                  ? 'Sin resultados'
                  : status === 'new'
                    ? 'Los leads nuevos y los del webhook aparecerán aquí'
                    : 'Arrastra leads a esta etapa'}
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
}

const SortableCard = memo(function SortableCard({ lead }: { lead: Lead }) {
  const { openLead, highlighted } = useStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={`${lead.name}. Enter para abrir, Espacio para mover`}
      onClick={() => openLead(lead.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !isDragging) {
          e.preventDefault();
          openLead(lead.id);
        } else {
          listeners?.onKeyDown?.(e);
        }
      }}
      className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      <LeadCard lead={lead} placeholder={isDragging} highlighted={Boolean(highlighted[lead.id])} />
    </div>
  );
});

function LeadCard({
  lead, overlay, placeholder, highlighted,
}: {
  lead: Lead;
  overlay?: boolean;
  placeholder?: boolean;
  highlighted?: boolean;
}) {
  const origin = [lead.company, lead.source].filter(Boolean).join(' · ');
  return (
    <article
      className={clsx(
        'select-none rounded-lg border bg-surface px-3 py-2.5 transition-colors duration-700',
        overlay ? 'cursor-grabbing border-line-strong shadow-overlay' : 'cursor-grab hover:border-line-strong',
        placeholder && 'opacity-30',
        highlighted ? 'border-accent/70 bg-[#1a1d33]' : !overlay && 'border-line',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate text-[13px] font-medium text-fg">{lead.name}</h3>
        {lead.pending_reminders > 0 && (
          <span
            className="flex shrink-0 items-center gap-0.5 text-2xs text-amber-400/90"
            title={`${lead.pending_reminders} recordatorio(s) pendiente(s)`}
          >
            <Bell size={11} />
            {lead.pending_reminders}
          </span>
        )}
      </div>
      <p className="mt-0.5 truncate text-xs text-muted">{origin || 'Sin empresa'}</p>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium tabular-nums text-fg">{money(lead.value)}</span>
        <span
          className="flex items-center gap-1 truncate text-2xs text-subtle"
          title={lead.last_contact_at ? 'Último contacto' : 'Aún sin contacto registrado'}
        >
          <Clock size={11} className="shrink-0" />
          {lead.last_contact_at ? timeAgo(lead.last_contact_at) : 'Sin contacto'}
        </span>
      </div>
    </article>
  );
}
