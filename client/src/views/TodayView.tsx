import { useEffect, useMemo, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { AlarmClock, Check, CircleCheckBig, Clock, Inbox, Sparkles, Snowflake } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ContactActions } from '../components/ContactActions';
import { Header } from '../components/Header';
import { CountUp, itemVariants, listVariants, Skeleton } from '../components/motion';
import { StatusDot } from '../components/ui';
import { api } from '../lib/api';
import { money, timeAgo } from '../lib/format';
import type { Lead, TodayReminder } from '../lib/types';
import { useStore } from '../store/AppStore';

const dayFmt = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
const timeFmt = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' });
const shortDayFmt = new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });

function greeting(date: Date) {
  const h = date.getHours();
  return h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

function Kpi({ label, value, format, tone }: {
  label: string;
  value: number | undefined;
  format?: (n: number) => string;
  tone?: 'danger';
}) {
  return (
    <motion.div variants={itemVariants} className="rounded-xl border border-line bg-surface px-4 py-3.5">
      <p className="text-xs text-muted">{label}</p>
      <p className={clsx('mt-1 text-2xl font-semibold tracking-tight', tone === 'danger' && value ? 'text-red-300' : 'text-fg')}>
        {value == null ? <Skeleton className="mt-1 h-7 w-16" /> : <CountUp value={value} format={format} />}
      </p>
    </motion.div>
  );
}

function Panel({ title, icon, count, children, hint }: {
  title: string;
  icon: ReactNode;
  count?: number;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="text-muted">{icon}</span>
        <h2 className="text-[13px] font-semibold text-fg">{title}</h2>
        {count != null && count > 0 && (
          <span className="rounded bg-raised px-1.5 text-2xs font-medium tabular-nums text-muted">{count}</span>
        )}
        {hint && <span className="ml-auto text-2xs text-subtle">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Empty({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-6 py-10 text-center">
      <span className="mb-1 text-emerald-400/80">{icon}</span>
      <p className="text-[13px] font-medium text-fg">{title}</p>
      <p className="max-w-xs text-xs text-subtle">{body}</p>
    </div>
  );
}

function ReminderRow({ r, onDone, overdue }: { r: TodayReminder; onDone: () => void; overdue: boolean }) {
  const { openLead } = useStore();
  const due = new Date(r.due_at);
  return (
    <motion.li
      layout
      variants={itemVariants}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      className="group flex items-center gap-3 border-b border-line/60 px-4 py-3 last:border-0 hover:bg-raised/40"
    >
      <button
        role="checkbox"
        aria-checked={false}
        aria-label="Marcar como hecho"
        onClick={onDone}
        className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-line-strong text-transparent transition-all hover:border-emerald-400 hover:text-emerald-400 active:scale-90"
      >
        <Check size={11} strokeWidth={3} />
      </button>
      <button onClick={() => openLead(r.lead_id)} className="min-w-0 flex-1 text-left">
        <p className="truncate text-[13px] text-fg">{r.body}</p>
        <p className="truncate text-xs text-subtle">
          <span className="text-muted">{r.lead_name}</span>
          {r.company ? ` · ${r.company}` : ''}
        </p>
      </button>
      <span
        className={clsx(
          'hidden shrink-0 rounded-full px-2 py-0.5 text-2xs font-medium sm:inline',
          overdue ? 'bg-red-500/10 text-red-300' : 'bg-raised text-muted',
        )}
        title={due.toLocaleString('es-CL')}
      >
        {overdue ? `Vencido ${timeAgo(r.due_at)}` : sameDay(due, new Date()) ? timeFmt.format(due) : shortDayFmt.format(due)}
      </span>
      <ContactActions lead={{ id: r.lead_id, name: r.lead_name, phone: r.phone, email: r.email, company: r.company }} compact />
    </motion.li>
  );
}

function LeadRow({ lead, meta }: { lead: Lead; meta: ReactNode }) {
  const { openLead } = useStore();
  return (
    <motion.li
      layout
      variants={itemVariants}
      className="flex items-center gap-3 border-b border-line/60 px-4 py-2.5 last:border-0 hover:bg-raised/40"
    >
      <button onClick={() => openLead(lead.id)} className="min-w-0 flex-1 text-left">
        <p className="flex items-center gap-2 truncate text-[13px] font-medium text-fg">
          <StatusDot status={lead.status} className="h-1.5 w-1.5" />
          {lead.name}
        </p>
        <p className="truncate pl-3.5 text-xs text-subtle">{meta}</p>
      </button>
      <ContactActions lead={lead} compact />
    </motion.li>
  );
}

export function TodayView() {
  const { user } = useAuth();
  const { today, refreshToday, toast } = useStore();
  const [done, setDone] = useState<Set<number>>(new Set());
  const now = new Date();

  useEffect(() => {
    refreshToday();
  }, [refreshToday]);

  const groups = useMemo(() => {
    const list = (today?.reminders ?? []).filter((r) => !done.has(r.id));
    const t = Date.now();
    const overdue = list.filter((r) => new Date(r.due_at).getTime() < t);
    const todayList = list.filter((r) => new Date(r.due_at).getTime() >= t && sameDay(new Date(r.due_at), new Date()));
    const upcoming = list.filter((r) => new Date(r.due_at).getTime() >= t && !sameDay(new Date(r.due_at), new Date()));
    return { overdue, today: todayList, upcoming };
  }, [today, done]);

  const complete = async (r: TodayReminder) => {
    setDone((s) => new Set(s).add(r.id));
    try {
      await api.updateNote(r.id, true);
      toast({ tone: 'success', title: 'Recordatorio completado', description: r.body });
    } catch (err) {
      setDone((s) => {
        const next = new Set(s);
        next.delete(r.id);
        return next;
      });
      toast({ tone: 'error', title: 'No se pudo completar', description: (err as Error).message });
    }
  };

  const dueNow = [...groups.overdue, ...groups.today];
  const loading = !today;

  return (
    <>
      <Header
        title="Hoy"
        subtitle={`${greeting(now)}${user ? `, ${user.name.split(' ')[0]}` : ''} · ${dayFmt.format(now)}`}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-6">
          <motion.div variants={listVariants} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Recordatorios vencidos" value={today?.stats.overdue} tone="danger" />
            <Kpi label="Leads nuevos (7 días)" value={today?.stats.new_7d} />
            <Kpi label="Pipeline abierto" value={today?.stats.open_value} format={(n) => money(n)} />
            <Kpi label="Ganado este mes" value={today?.stats.won_month} format={(n) => money(n)} />
          </motion.div>

          <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
            <div className="flex flex-col gap-5">
              <Panel title="Para hoy" icon={<AlarmClock size={15} />} count={dueNow.length}>
                {loading ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-9" />
                    <Skeleton className="h-9" />
                  </div>
                ) : dueNow.length === 0 ? (
                  <Empty
                    icon={<CircleCheckBig size={22} />}
                    title="Todo al día"
                    body="No tienes recordatorios pendientes para hoy. Prográmalos desde la ficha de cada lead."
                  />
                ) : (
                  <motion.ul variants={listVariants} initial="hidden" animate="show">
                    <AnimatePresence initial={false}>
                      {dueNow.map((r) => (
                        <ReminderRow key={r.id} r={r} overdue={groups.overdue.includes(r)} onDone={() => complete(r)} />
                      ))}
                    </AnimatePresence>
                  </motion.ul>
                )}
              </Panel>

              {groups.upcoming.length > 0 && (
                <Panel title="Próximos 7 días" icon={<Clock size={15} />} count={groups.upcoming.length}>
                  <motion.ul variants={listVariants} initial="hidden" animate="show">
                    <AnimatePresence initial={false}>
                      {groups.upcoming.map((r) => (
                        <ReminderRow key={r.id} r={r} overdue={false} onDone={() => complete(r)} />
                      ))}
                    </AnimatePresence>
                  </motion.ul>
                </Panel>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <Panel title="Nuevos sin atender" icon={<Inbox size={15} />} count={today?.fresh.length} hint="sin contacto aún">
                {loading ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-9" />
                  </div>
                ) : today.fresh.length === 0 ? (
                  <Empty icon={<Sparkles size={22} />} title="Nada pendiente" body="Todos los leads nuevos ya tienen un primer contacto." />
                ) : (
                  <motion.ul variants={listVariants} initial="hidden" animate="show">
                    {today.fresh.map((l) => (
                      <LeadRow key={l.id} lead={l} meta={`${l.source} · llegó ${timeAgo(l.created_at)}`} />
                    ))}
                  </motion.ul>
                )}
              </Panel>

              <Panel title="Sin contacto hace más de 7 días" icon={<Snowflake size={15} />} count={today?.stale.length}>
                {loading ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-9" />
                  </div>
                ) : today.stale.length === 0 ? (
                  <Empty icon={<CircleCheckBig size={22} />} title="Nadie se está enfriando" body="Todos tus leads abiertos tuvieron contacto esta semana." />
                ) : (
                  <motion.ul variants={listVariants} initial="hidden" animate="show">
                    {today.stale.map((l) => (
                      <LeadRow
                        key={l.id}
                        lead={l}
                        meta={`${money(l.value)} · último contacto ${timeAgo(l.last_contact_at ?? l.created_at)}`}
                      />
                    ))}
                  </motion.ul>
                )}
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
