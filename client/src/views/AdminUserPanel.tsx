import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import clsx from 'clsx';
import { Ban, KeyRound, LogOut, MailCheck, ShieldCheck, ShieldOff, Trash2, UserCheck, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../auth/AuthContext';
import { overlayMotion, panelMotion } from '../components/motion';
import { Avatar, Button, IconButton } from '../components/ui';
import { api } from '../lib/api';
import { COMPANY_SIZE_LABELS, HEARD_FROM_LABELS } from '../lib/constants';
import { formatDate, formatDateTime, timeAgo } from '../lib/format';
import type { AdminAction, AdminUser } from '../lib/types';
import { useStore } from '../store/AppStore';

export function UserBadges({ user }: { user: Pick<AdminUser, 'is_admin' | 'banned_at' | 'email_verified_at'> }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {user.banned_at ? (
        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-2xs font-medium text-red-300">
          Suspendido
        </span>
      ) : (
        <span className="rounded-full border border-line px-2 py-0.5 text-2xs text-muted">Activo</span>
      )}
      {!user.email_verified_at && !user.banned_at && (
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-2xs font-medium text-amber-300">
          Sin verificar
        </span>
      )}
      {user.is_admin && (
        <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-2xs font-medium text-accent-soft">
          <ShieldCheck size={10} /> Admin
        </span>
      )}
    </span>
  );
}

type Detail = AdminUser & { actions: AdminAction[] };

const ACTION_LABELS: Record<AdminAction['action'], string> = {
  update: 'Datos editados',
  ban: 'Cuenta suspendida',
  unban: 'Cuenta reactivada',
  password_reset: 'Contraseña restablecida',
  logout: 'Sesiones cerradas',
  verify_email: 'Correo marcado como verificado',
  grant_admin: 'Ahora es administrador',
  revoke_admin: 'Ya no es administrador',
  delete: 'Cuenta eliminada',
};

const FIELD_LABELS: Record<string, string> = {
  name: 'nombre',
  email: 'correo',
  phone: 'teléfono',
  job_title: 'rol',
};

function describe(action: AdminAction) {
  if (action.action === 'update' && action.details) {
    return Object.entries(action.details as Record<string, { from: string | null; to: string | null }>)
      .map(([k, v]) => `${FIELD_LABELS[k] ?? k}: ${v.from ?? '—'} → ${v.to ?? '—'}`)
      .join(' · ');
  }
  if (action.action === 'ban' && action.details?.reason) return `Motivo: ${String(action.details.reason)}`;
  return null;
}

function Section({ title, children, tone }: { title: string; children: ReactNode; tone?: 'danger' }) {
  return (
    <section className={clsx('border-b border-line px-5 py-4', tone === 'danger' && 'bg-red-500/[0.03]')}>
      <h3 className={clsx('mb-3 text-xs font-medium', tone === 'danger' ? 'text-red-300' : 'text-muted')}>{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2 py-1 text-[13px]">
      <dt className="text-subtle">{label}</dt>
      <dd className="min-w-0 break-words text-fg/90">{children}</dd>
    </div>
  );
}

export function AdminUserPanel({ userId, onClose, onChanged, onDeleted }: {
  userId: number;
  onClose: () => void;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const { user: me } = useAuth();
  const { toast } = useStore();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', job_title: '' });
  const [banReason, setBanReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const isSelf = me?.id === userId;

  const load = useCallback(async () => {
    try {
      const d = await api.admin.user(userId);
      setDetail(d);
      setForm({ name: d.name, email: d.email, phone: d.phone ?? '', job_title: d.job_title ?? '' });
    } catch (err) {
      toast({ tone: 'error', title: 'No se pudo cargar el usuario', description: (err as Error).message });
      onClose();
    }
  }, [userId, toast, onClose]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /** Runs an admin action, then reloads the panel and the list behind it. */
  const run = async (key: string, fn: () => Promise<unknown>, success: string) => {
    setBusy(key);
    try {
      await fn();
      toast({ tone: 'success', title: success });
      await load();
      onChanged();
      return true;
    } catch (err) {
      toast({ tone: 'error', title: 'No se pudo completar', description: (err as Error).message });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const saveProfile = (e: FormEvent) => {
    e.preventDefault();
    run('save', () => api.admin.update(userId, form), 'Datos actualizados');
  };

  const remove = async () => {
    setBusy('delete');
    try {
      const result = await api.admin.remove(userId);
      toast({
        tone: 'success',
        title: result.deleted_workspace ? 'Cuenta y espacio eliminados' : 'Cuenta eliminada',
      });
      onDeleted();
    } catch (err) {
      toast({ tone: 'error', title: 'No se pudo eliminar', description: (err as Error).message });
      setBusy(null);
    }
  };

  const dirty =
    detail &&
    (form.name !== detail.name ||
      form.email !== detail.email ||
      form.phone !== (detail.phone ?? '') ||
      form.job_title !== (detail.job_title ?? ''));
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="fixed inset-0 z-40">
      <motion.div {...overlayMotion} className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <motion.aside
        {...panelMotion}
        role="complementary"
        aria-label="Detalle de usuario"
        className="absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l border-line bg-surface shadow-overlay"
      >
        {!detail ? (
          <div className="p-6 text-xs text-subtle">Cargando…</div>
        ) : (
          <>
            <div className="flex items-start gap-3 border-b border-line px-5 py-4">
              <Avatar name={detail.name} size="lg" />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold text-fg">{detail.name}</h2>
                <p className="truncate text-xs text-subtle">{detail.email}</p>
                <div className="mt-2">
                  <UserBadges user={detail} />
                </div>
              </div>
              <IconButton label="Cerrar panel" onClick={onClose}>
                <X size={16} />
              </IconButton>
            </div>

            <div className="flex-1 overflow-y-auto">
              {detail.banned_at && (
                <div className="mx-5 mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-200">
                  Suspendida {timeAgo(detail.banned_at)}
                  {detail.ban_reason ? ` · Motivo: ${detail.ban_reason}` : ''}
                </div>
              )}

              <Section title="Datos de la cuenta">
                <form onSubmit={saveProfile} className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="au-name">Nombre</label>
                    <input id="au-name" className="input" value={form.name} onChange={set('name')} required />
                  </div>
                  <div>
                    <label className="label" htmlFor="au-email">Correo</label>
                    <input id="au-email" type="email" className="input" value={form.email} onChange={set('email')} required />
                  </div>
                  <div>
                    <label className="label" htmlFor="au-phone">Teléfono</label>
                    <input id="au-phone" type="tel" className="input" value={form.phone} onChange={set('phone')} />
                  </div>
                  <div>
                    <label className="label" htmlFor="au-job">Rol en la empresa</label>
                    <input id="au-job" className="input" value={form.job_title} onChange={set('job_title')} />
                  </div>
                  <div className="flex justify-end gap-2 sm:col-span-2">
                    {dirty && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setForm({ name: detail.name, email: detail.email, phone: detail.phone ?? '', job_title: detail.job_title ?? '' })
                        }
                      >
                        Descartar
                      </Button>
                    )}
                    <Button type="submit" variant="primary" size="sm" disabled={!dirty || busy === 'save'}>
                      {busy === 'save' ? 'Guardando…' : 'Guardar cambios'}
                    </Button>
                  </div>
                </form>
              </Section>

              <Section title="Espacio y actividad">
                <dl>
                  <Row label="Espacio">{detail.workspace_name}</Row>
                  <Row label="Rol en el espacio">{detail.role === 'owner' ? 'Propietario' : 'Miembro'}</Row>
                  <Row label="Miembros">{detail.members_count}</Row>
                  <Row label="Leads">{detail.leads_count}</Row>
                  <Row label="Correo">
                    {detail.email_verified_at ? (
                      <span className="text-emerald-300">Verificado</span>
                    ) : (
                      <span className="text-amber-300">Sin verificar</span>
                    )}
                  </Row>
                  <Row label="Registro">{formatDateTime(detail.created_at)}</Row>
                  <Row label="Último acceso">{detail.last_login_at ? timeAgo(detail.last_login_at) : 'Nunca'}</Row>
                  <Row label="Sesiones activas">{detail.active_sessions}</Row>
                </dl>
              </Section>

              <Section title="Encuesta de bienvenida">
                {detail.survey_at ? (
                  <dl>
                    <Row label="Cómo nos conoció">
                      {detail.heard_from ? HEARD_FROM_LABELS[detail.heard_from] : '—'}
                      {detail.heard_from_detail ? ` — ${detail.heard_from_detail}` : ''}
                    </Row>
                    <Row label="Tamaño">{detail.company_size ? COMPANY_SIZE_LABELS[detail.company_size] : '—'}</Row>
                    <Row label="Su empresa">{detail.company_about}</Row>
                    <Row label="Respondida">{formatDate(detail.survey_at)}</Row>
                  </dl>
                ) : (
                  <p className="text-xs text-subtle">
                    {detail.role === 'owner' ? 'Aún no la responde.' : 'Los miembros invitados no responden la encuesta.'}
                  </p>
                )}
              </Section>

              <Section title="Acciones">
                <div className="space-y-4">
                  <form
                    className="flex items-end gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (await run('password', () => api.admin.resetPassword(userId, newPassword), 'Contraseña restablecida')) {
                        setNewPassword('');
                      }
                    }}
                  >
                    <div className="flex-1">
                      <label className="label" htmlFor="au-pass">Nueva contraseña</label>
                      <input
                        id="au-pass"
                        type="text"
                        autoComplete="off"
                        className="input"
                        placeholder="Mínimo 8 caracteres"
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="h-[38px]" disabled={newPassword.length < 8 || busy === 'password'}>
                      <KeyRound size={13} /> Restablecer
                    </Button>
                  </form>
                  <p className="-mt-2 text-2xs text-subtle">Cierra todas sus sesiones. Compártela por un canal seguro.</p>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => run('logout', () => api.admin.logout(userId), 'Sesiones cerradas')}
                      disabled={busy === 'logout' || detail.active_sessions === 0}
                    >
                      <LogOut size={13} /> Cerrar sesiones ({detail.active_sessions})
                    </Button>
                    {!detail.email_verified_at && (
                      <Button
                        onClick={() => run('verify', () => api.admin.verify(userId), 'Correo marcado como verificado')}
                        disabled={busy === 'verify'}
                      >
                        <MailCheck size={13} /> Marcar correo verificado
                      </Button>
                    )}
                    {detail.is_admin ? (
                      <Button
                        onClick={() => run('admin', () => api.admin.setAdmin(userId, false), 'Permisos de administrador retirados')}
                        disabled={isSelf || busy === 'admin'}
                        title={isSelf ? 'No puedes quitarte tus propios permisos' : undefined}
                      >
                        <ShieldOff size={13} /> Quitar administrador
                      </Button>
                    ) : (
                      <Button
                        onClick={() => run('admin', () => api.admin.setAdmin(userId, true), 'Ahora es administrador')}
                        disabled={busy === 'admin'}
                      >
                        <ShieldCheck size={13} /> Hacer administrador
                      </Button>
                    )}
                  </div>

                  {detail.banned_at ? (
                    <Button
                      onClick={() => run('ban', () => api.admin.unban(userId), 'Cuenta reactivada')}
                      disabled={busy === 'ban'}
                    >
                      <UserCheck size={13} /> Reactivar cuenta
                    </Button>
                  ) : (
                    <form
                      className="flex items-end gap-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (await run('ban', () => api.admin.ban(userId, banReason), 'Cuenta suspendida')) setBanReason('');
                      }}
                    >
                      <div className="flex-1">
                        <label className="label" htmlFor="au-ban">Suspender cuenta</label>
                        <input
                          id="au-ban"
                          className="input"
                          placeholder="Motivo (se le mostrará al intentar entrar)"
                          maxLength={500}
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          disabled={isSelf}
                        />
                      </div>
                      <Button type="submit" variant="danger" className="h-[38px]" disabled={isSelf || busy === 'ban'}>
                        <Ban size={13} /> Suspender
                      </Button>
                    </form>
                  )}
                  {isSelf && <p className="text-2xs text-subtle">Es tu propia cuenta: no puedes suspenderla ni eliminarla.</p>}
                </div>
              </Section>

              {!isSelf && (
                <Section title="Eliminar cuenta" tone="danger">
                  <p className="mb-3 text-xs leading-relaxed text-muted">
                    {detail.role === 'owner' ? (
                      <>
                        Es propietario de <span className="text-fg">{detail.workspace_name}</span>. Se eliminará el espacio
                        completo: {detail.leads_count} leads y {detail.members_count}{' '}
                        {detail.members_count === 1 ? 'cuenta' : 'cuentas'}. No se puede deshacer.
                      </>
                    ) : (
                      <>Se eliminará solo esta cuenta; los leads de su espacio se conservan. No se puede deshacer.</>
                    )}
                  </p>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="label" htmlFor="au-confirm">
                        Escribe <span className="text-fg">{detail.email}</span> para confirmar
                      </label>
                      <input
                        id="au-confirm"
                        className="input"
                        autoComplete="off"
                        value={confirmEmail}
                        onChange={(e) => setConfirmEmail(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="danger"
                      className="h-[38px] border border-red-500/30"
                      disabled={confirmEmail.trim().toLowerCase() !== detail.email || busy === 'delete'}
                      onClick={remove}
                    >
                      <Trash2 size={13} /> Eliminar
                    </Button>
                  </div>
                </Section>
              )}

              <section className="px-5 py-4">
                <h3 className="mb-3 text-xs font-medium text-muted">Historial de administración</h3>
                {detail.actions.length === 0 ? (
                  <p className="text-xs text-subtle">Sin acciones registradas.</p>
                ) : (
                  <ol className="space-y-2.5">
                    {detail.actions.map((a) => (
                      <li key={a.id} className="text-xs">
                        <p className="text-fg/90">
                          {ACTION_LABELS[a.action] ?? a.action}
                          <span className="text-subtle" title={formatDateTime(a.created_at)}>
                            {' '}· {timeAgo(a.created_at)} · {a.admin_email ?? 'admin eliminado'}
                          </span>
                        </p>
                        {describe(a) && <p className="mt-0.5 break-words text-subtle">{describe(a)}</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </>
        )}
      </motion.aside>
    </div>
  );
}
