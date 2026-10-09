import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import {
  Bell, Building2, CalendarClock, Check, DollarSign, Mail, Phone, PhoneCall, Tag, Trash2, X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { api } from '../lib/api';
import { STATUSES } from '../lib/constants';
import { formatDate, formatDateTime, money, timeAgo, toLocalInput } from '../lib/format';
import type { Lead, Note, Status } from '../lib/types';
import { columnOrder, useStore } from '../store/AppStore';
import { ContactActions } from './ContactActions';
import { overlayMotion, panelMotion } from './motion';
import { Avatar, Button, IconButton, StatusDot } from './ui';

export function LeadSlideOver() {
  const { selectedId, openLead, leads } = useStore();
  const lead = selectedId != null ? leads[selectedId] : undefined;

  useEffect(() => {
    if (selectedId == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('form[role="dialog"]')) openLead(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, openLead]);

  return (
    <AnimatePresence>
      {lead && (
        <motion.div key="lead-panel" className="fixed inset-0 z-40">
          <motion.div {...overlayMotion} className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => openLead(null)} />
          <motion.aside
            {...panelMotion}
            role="complementary"
            aria-label={`Detalle de ${lead.name}`}
            className="absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col border-l border-line bg-surface shadow-overlay"
          >
            {/* key resets local edit state when switching leads */}
            <LeadDetail key={lead.id} lead={lead} onClose={() => openLead(null)} />
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { leads, notes, loadNotes, moveLead, dispatch, toast } = useStore();
  const leadNotes = notes[lead.id];
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    loadNotes(lead.id).catch((err) =>
      toast({ tone: 'error', title: 'No se pudo cargar el historial', description: err.message }),
    );
  }, [lead.id, loadNotes, toast]);

  const save = async (patch: Partial<Lead>) => {
    try {
      dispatch({ type: 'lead/upsert', lead: await api.updateLead(lead.id, patch) });
    } catch (err) {
      toast({ tone: 'error', title: 'No se pudo guardar', description: (err as Error).message });
    }
  };

  const changeStatus = (status: Status) => {
    if (status === lead.status) return;
    moveLead(lead.id, status, columnOrder(leads, status, lead.id)[0] ?? null);
  };

  const remove = async () => {
    try {
      await api.deleteLead(lead.id);
      dispatch({ type: 'lead/remove', id: lead.id });
      onClose();
      toast({ title: 'Lead eliminado', description: lead.name });
    } catch (err) {
      toast({ tone: 'error', title: 'No se pudo eliminar', description: (err as Error).message });
    }
  };

  const { reminders, timeline } = useMemo(() => {
    const list = leadNotes ?? [];
    return {
      reminders: list
        .filter((n) => n.kind === 'reminder')
        .sort((a, b) => Number(a.done) - Number(b.done) || +new Date(a.due_at!) - +new Date(b.due_at!)),
      timeline: list.filter((n) => n.kind !== 'reminder'),
    };
  }, [leadNotes]);

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-line px-5 py-4">
        <Avatar name={lead.name} size="lg" />
        <div className="min-w-0 flex-1">
          <EditableText
            value={lead.name}
            onSave={(name) => name.trim() && save({ name })}
            className="text-base font-semibold"
            ariaLabel="Nombre"
          />
          <p className="truncate text-xs text-subtle">
            Creado {formatDate(lead.created_at)} · {lead.source}
          </p>
        </div>
        <IconButton label="Cerrar panel" onClick={onClose}>
          <X size={16} />
        </IconButton>
      </div>
      <div className="border-b border-line px-5 py-3">
        <ContactActions lead={lead} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Stage selector */}
        <div className="border-b border-line px-5 py-4">
          <p className="label">Etapa</p>
          <div className="grid grid-cols-5 gap-1 rounded-lg border border-line bg-canvas p-1">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                onClick={() => changeStatus(s.id)}
                title={s.label}
                className={clsx(
                  'flex items-center justify-center gap-1.5 truncate rounded-md px-1.5 py-1.5 text-2xs font-medium transition-colors',
                  lead.status === s.id ? 'bg-raised text-fg' : 'text-subtle hover:text-fg',
                )}
              >
                <StatusDot status={s.id} className="h-1.5 w-1.5" />
                <span className="truncate">{s.short}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Properties */}
        <dl className="space-y-0.5 border-b border-line px-3 py-3">
          <Property icon={<DollarSign size={14} />} label="Valor">
            <EditableText
              value={String(lead.value)}
              display={money(lead.value)}
              type="number"
              onSave={(v) => save({ value: Number(v) || 0 })}
              ariaLabel="Valor estimado"
              className="tabular-nums"
            />
          </Property>
          <Property icon={<Building2 size={14} />} label="Empresa">
            <EditableText value={lead.company ?? ''} placeholder="Añadir empresa" onSave={(company) => save({ company })} ariaLabel="Empresa" />
          </Property>
          <Property icon={<Mail size={14} />} label="Email">
            <EditableText value={lead.email ?? ''} type="email" placeholder="Añadir email" onSave={(email) => save({ email })} ariaLabel="Email" />
          </Property>
          <Property icon={<Phone size={14} />} label="Teléfono">
            <EditableText value={lead.phone ?? ''} type="tel" placeholder="Añadir teléfono" onSave={(phone) => save({ phone })} ariaLabel="Teléfono" />
          </Property>
          <Property icon={<Tag size={14} />} label="Origen">
            <EditableText value={lead.source} onSave={(source) => save({ source: source || 'Manual' })} ariaLabel="Origen" />
          </Property>
          <Property icon={<PhoneCall size={14} />} label="Últ. contacto">
            <div className="flex items-center justify-between gap-2 px-2 py-1">
              <span className={clsx('text-[13px]', lead.last_contact_at ? 'text-fg' : 'text-subtle')}>
                {lead.last_contact_at ? timeAgo(lead.last_contact_at) : 'Sin contacto'}
              </span>
              <button
                onClick={() => save({ last_contact_at: new Date().toISOString() })}
                className="text-xs text-accent-soft hover:text-fg"
              >
                Registrar hoy
              </button>
            </div>
          </Property>
        </dl>

        <Composer leadId={lead.id} />

        {/* Reminders */}
        {reminders.length > 0 && (
          <section className="border-b border-line px-5 py-4">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-medium text-muted">
              <Bell size={13} /> Recordatorios
            </h3>
            <ul className="space-y-1">
              {reminders.map((r) => <ReminderRow key={r.id} note={r} />)}
            </ul>
          </section>
        )}

        {/* Timeline */}
        <section className="px-5 py-4">
          <h3 className="mb-3 text-xs font-medium text-muted">Historial</h3>
          {!leadNotes ? (
            <p className="text-xs text-subtle">Cargando…</p>
          ) : timeline.length === 0 ? (
            <p className="text-xs text-subtle">Sin actividad todavía.</p>
          ) : (
            <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-line">
              {timeline.map((n) => <TimelineItem key={n.id} note={n} />)}
            </ol>
          )}
        </section>
      </div>

      <div className="flex items-center justify-between border-t border-line px-5 py-3">
        <span className="text-2xs text-subtle">Actualizado {timeAgo(lead.updated_at)}</span>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">¿Eliminar este lead?</span>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button size="sm" variant="danger" onClick={remove}>Eliminar</Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={13} /> Eliminar
          </Button>
        )}
      </div>
    </>
  );
}

function Property({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center">
      <dt className="flex items-center gap-2 px-2 text-xs text-subtle">
        {icon}
        {label}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/** Inline field that looks like text until focused; saves on blur or Enter. */
function EditableText({
  value, display, onSave, placeholder, type = 'text', className, ariaLabel,
}: {
  value: string;
  display?: string;
  onSave: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  ariaLabel: string;
}) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value.trim()) onSave(draft.trim());
  };

  return (
    <input
      aria-label={ariaLabel}
      type={editing ? type : 'text'}
      value={editing ? draft : display ?? draft}
      placeholder={placeholder}
      onFocus={() => setEditing(true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          e.stopPropagation();
          setDraft(value);
          setEditing(false);
          requestAnimationFrame(() => (e.target as HTMLInputElement).blur());
        }
      }}
      className={clsx(
        'w-full truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-[13px] text-fg placeholder:text-subtle transition-colors hover:bg-raised focus:border-line-strong focus:bg-canvas focus:outline-none',
        className,
      )}
    />
  );
}

const REMINDER_PRESETS: { label: string; at: () => Date }[] = [
  { label: 'Mañana', at: () => atNine(1) },
  { label: '+3 días', at: () => atNine(3) },
  { label: '+1 semana', at: () => atNine(7) },
];

function atNine(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(9, 0, 0, 0);
  return d;
}

function Composer({ leadId }: { leadId: number }) {
  const { dispatch, toast } = useStore();
  const [kind, setKind] = useState<'note' | 'reminder'>('note');
  const [body, setBody] = useState('');
  const [due, setDue] = useState(() => toLocalInput(atNine(1)));
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = async () => {
    if (!body.trim() || saving) return;
    setSaving(true);
    try {
      const note = await api.addNote(leadId, {
        kind,
        body,
        dueAt: kind === 'reminder' ? new Date(due).toISOString() : null,
      });
      dispatch({ type: 'note/upsert', note });
      setBody('');
      ref.current?.focus();
    } catch (err) {
      toast({ tone: 'error', title: 'No se pudo guardar', description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="border-b border-line px-5 py-4">
      <div className="mb-2 flex gap-1">
        {(['note', 'reminder'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={clsx(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              kind === k ? 'bg-raised text-fg' : 'text-subtle hover:text-fg',
            )}
          >
            {k === 'note' ? 'Nota' : 'Recordatorio'}
          </button>
        ))}
      </div>
      <div className="rounded-lg border border-line bg-canvas transition-colors focus-within:border-accent/60">
        <textarea
          ref={ref}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          rows={3}
          placeholder={kind === 'note' ? 'Escribe una nota sobre la conversación…' : '¿Qué hay que hacer?'}
          className="block w-full resize-none bg-transparent px-3 py-2.5 text-[13px] text-fg placeholder:text-subtle focus:outline-none"
        />
        {kind === 'reminder' && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-2 py-2">
            <CalendarClock size={14} className="ml-1 text-subtle" />
            <input
              type="datetime-local"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              aria-label="Fecha del recordatorio"
              className="rounded border border-line bg-surface px-1.5 py-0.5 text-xs text-fg focus:outline-none"
            />
            {REMINDER_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setDue(toLocalInput(p.at()))}
                className="rounded px-1.5 py-0.5 text-2xs text-subtle hover:bg-raised hover:text-fg"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-line px-2 py-2">
          <span className="ml-auto hidden text-2xs text-subtle sm:inline">Ctrl + Enter</span>
          <Button size="sm" variant="primary" disabled={!body.trim() || saving} onClick={submit}>
            {kind === 'note' ? 'Añadir nota' : 'Programar'}
          </Button>
        </div>
      </div>
    </section>
  );
}

function ReminderRow({ note }: { note: Note }) {
  const { dispatch, toast } = useStore();
  const overdue = !note.done && note.due_at && new Date(note.due_at) < new Date();

  const toggle = async () => {
    dispatch({ type: 'note/upsert', note: { ...note, done: !note.done } });
    try {
      await api.updateNote(note.id, !note.done);
    } catch (err) {
      dispatch({ type: 'note/upsert', note });
      toast({ tone: 'error', title: 'No se pudo actualizar', description: (err as Error).message });
    }
  };

  const remove = async () => {
    dispatch({ type: 'note/remove', id: note.id, leadId: note.lead_id });
    await api.deleteNote(note.id).catch(() => dispatch({ type: 'note/upsert', note }));
  };

  return (
    <li className="group flex items-start gap-2.5 rounded-md px-1 py-1.5 hover:bg-raised/50">
      <button
        role="checkbox"
        aria-checked={note.done}
        aria-label={note.done ? 'Marcar como pendiente' : 'Marcar como hecho'}
        onClick={toggle}
        className={clsx(
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
          note.done ? 'border-accent bg-accent text-white' : 'border-line-strong hover:border-muted',
        )}
      >
        {note.done && <Check size={11} strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={clsx('text-[13px]', note.done ? 'text-subtle line-through' : 'text-fg')}>{note.body}</p>
        {note.due_at && (
          <p className={clsx('text-2xs', overdue ? 'text-red-400' : 'text-subtle')}>
            {overdue ? 'Vencido · ' : ''}
            {formatDateTime(note.due_at)}
          </p>
        )}
      </div>
      <IconButton label="Eliminar recordatorio" onClick={remove} className="h-6 w-6 opacity-0 group-hover:opacity-100">
        <Trash2 size={12} />
      </IconButton>
    </li>
  );
}

function TimelineItem({ note }: { note: Note }) {
  const { dispatch } = useStore();

  if (note.kind === 'event') {
    return (
      <li className="relative flex items-baseline gap-3 pl-0">
        <span className="relative z-10 mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-surface bg-line-strong" />
        <p className="text-xs text-muted">
          {note.body}
          <span className="ml-1.5 text-subtle" title={formatDateTime(note.created_at)}>· {timeAgo(note.created_at)}</span>
        </p>
      </li>
    );
  }

  const remove = async () => {
    dispatch({ type: 'note/remove', id: note.id, leadId: note.lead_id });
    await api.deleteNote(note.id).catch(() => dispatch({ type: 'note/upsert', note }));
  };

  return (
    <li className="group relative flex gap-3">
      <span className="relative z-10 mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-surface bg-accent" />
      <div className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 py-2.5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-2xs text-subtle" title={formatDateTime(note.created_at)}>
            Nota · {timeAgo(note.created_at)}
          </span>
          <IconButton label="Eliminar nota" onClick={remove} className="-my-1 h-6 w-6 opacity-0 group-hover:opacity-100">
            <Trash2 size={12} />
          </IconButton>
        </div>
        <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-fg/90">{note.body}</p>
      </div>
    </li>
  );
}
