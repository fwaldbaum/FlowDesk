import { useEffect, useState } from 'react';
import StarBorder from '../components/reactbits/StarBorder';
import { Badge, Button, Card, cx, Empty, Field, fmtDate, Icon, Input, PageTitle, PasswordInput, platformIcon, platformLabel, Spinner, timeAgo, useConfirm, useToast } from '../components/ui';
import { useZero } from '../lib/store';
import { useDark } from './Apps';

function Section({ icon, title, sub, children }) {
  return (
    <Card className="p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-soft text-blue dark:bg-blue/15">
          <Icon name={icon} />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold">{title}</h2>
          {sub && <p className="text-[13px] text-sub">{sub}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

// ---- Cuenta --------------------------------------------------------------------------------------------------------

export function Account() {
  const { user, setUser } = useZero();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: '', password: '', confirm: '' });
  const [pwErr, setPwErr] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const saveName = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await window.zero.api('POST', '/profile', { name });
      setUser(res.user);
      toast('Nombre actualizado');
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwErr('');
    if (pw.password.length < 8) return setPwErr('La nueva contraseña debe tener al menos 8 caracteres.');
    if (pw.password !== pw.confirm) return setPwErr('Las contraseñas nuevas no coinciden.');
    setPwBusy(true);
    try {
      const res = await window.zero.api('POST', '/password', { current: pw.current, password: pw.password });
      setPw({ current: '', password: '', confirm: '' });
      toast(res.revoked_devices ? `Contraseña cambiada. Cerramos tu sesión en ${res.revoked_devices} dispositivo(s) más y en la web.` : 'Contraseña cambiada. Cerramos tu sesión en la web.');
    } catch (err) {
      setPwErr(err.message);
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div>
      <PageTitle title="Cuenta" sub="Tu perfil y tu contraseña de ZERO." />
      <div className="grid grid-cols-2 gap-5">
        <Section icon="user-pen" title="Perfil" sub="Así te ven en todas las apps de ZERO.">
          <div className="mb-5 flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue to-sky-400 font-display text-lg font-bold text-white">{user.initials}</span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="text-xs text-mute">Miembro desde {fmtDate(user.member_since)}</p>
            </div>
          </div>
          <form onSubmit={saveName} className="space-y-4">
            <Field label="Nombre">
              <Input icon="user" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
            </Field>
            <Field label="Correo" hint="Para cambiar tu correo escríbenos a hola@zerosolutions.cl.">
              <div className="flex h-11 items-center justify-between rounded-xl border border-line bg-raised px-3.5 text-sm">
                <span className="truncate">{user.email}</span>
                {user.verified ? <Badge tone="ok" icon="badge-check">Confirmado</Badge> : <Badge tone="warn">Sin confirmar</Badge>}
              </div>
            </Field>
            <Button type="submit" loading={saving} disabled={!name.trim() || name.trim() === user.name} icon="check">
              Guardar
            </Button>
          </form>
        </Section>

        <Section icon="key" title="Contraseña" sub="Al cambiarla se cierra tu sesión en los demás dispositivos y en la web.">
          <form onSubmit={savePassword} className="space-y-4">
            <Field label="Contraseña actual">
              <PasswordInput value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" required />
            </Field>
            <Field label="Nueva contraseña" hint="Mínimo 8 caracteres.">
              <PasswordInput value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} autoComplete="new-password" required />
            </Field>
            <Field label="Repite la nueva contraseña" error={pwErr}>
              <PasswordInput value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" required />
            </Field>
            <Button type="submit" loading={pwBusy} icon="lock">
              Cambiar contraseña
            </Button>
          </form>
        </Section>
      </div>
    </div>
  );
}

// ---- Plan y pagos ---------------------------------------------------------------------------------------------------

const STATUS = { paid: ['Pagado', 'ok'], rejected: ['Rechazado', 'bad'], mismatch: ['En revisión', 'warn'] };

export function Billing() {
  const toast = useToast();
  const dark = useDark();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState('');
  useEffect(() => {
    window.zero.api('GET', '/billing').then(setData).catch((e) => setError(e.message));
  }, []);
  const web = async (key, next) => {
    setOpening(key);
    try {
      await window.zero.web(next);
      toast('Te abrimos zerosolutions.cl en tu navegador, ya con tu sesión', 'info');
    } catch (e) {
      toast(e.message, 'bad');
    } finally {
      setOpening('');
    }
  };
  if (error) return <Empty icon="exclamation" title="No pudimos cargar tu plan" body={error} />;
  if (!data) return <div className="grid h-64 place-items-center text-blue"><Spinner className="text-2xl" /></div>;
  return (
    <div>
      <PageTitle
        title="Plan y pagos"
        sub="Los pagos se hacen con Mercado Pago en zerosolutions.cl: te lo abrimos en el navegador con tu sesión ya iniciada."
        action={<Button variant="secondary" icon="arrow-up-right-from-square" loading={opening === 'web'} onClick={() => web('web', '/cuenta/plan')}>Abrir en la web</Button>}
      />
      <h2 className="mb-3 font-display text-base font-semibold">Planes activos</h2>
      {data.subscriptions.length ? (
        <div className="mb-8 grid grid-cols-2 gap-4">
          {data.subscriptions.map((s) => (
            <Card key={s.plan} className="flex items-center gap-4 p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                <Icon name="crown" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.name}</p>
                <p className="text-[13px] text-sub">Vigente hasta el {fmtDate(s.ends_at)}</p>
              </div>
              <Badge tone="ok">Activo</Badge>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mb-8 p-5 text-sm text-sub">Estás en el plan gratis de todas las apps.</Card>
      )}

      <h2 className="mb-3 font-display text-base font-semibold">Mejora tu plan</h2>
      <div className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
        {data.plans.map((p) => {
          const body = (
            <div className="flex h-full flex-col text-left">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display font-semibold">{p.name}</p>
                {p.covered && <Badge tone="ok">Lo tienes</Badge>}
              </div>
              <p className="mt-1 text-[12.5px] text-sub">{p.tagline}</p>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold">{p.price_month_label}</span>
                <span className="text-xs text-mute">/ mes</span>
                {p.list_month_label && <span className="text-xs text-mute line-through">{p.list_month_label}</span>}
              </p>
              <p className="text-[11.5px] text-mute">o {p.price_year_label} al año</p>
              <ul className="mt-3 flex-1 space-y-1.5 text-[12.5px] text-sub">
                {p.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex gap-2"><Icon name="check" className="mt-0.5 text-blue" /> {f}</li>
                ))}
              </ul>
              <Button size="sm" className="mt-4 w-full" variant={p.featured ? 'primary' : 'secondary'} disabled={p.covered} loading={opening === p.key} onClick={() => web(p.key, `/cuenta/plan?plan=${p.key}&periodo=month`)}>
                {p.covered ? 'Incluido' : 'Elegir'}
              </Button>
            </div>
          );
          return p.featured ? (
            <StarBorder key={p.key} as="div" theme={dark ? 'dark' : 'light'} color="#2563EB" radius={16} thickness={1.5} stars={1} glow={0.4} hover="none" clickPulse={false} className="h-full p-5">
              {body}
            </StarBorder>
          ) : (
            <Card key={p.key} className="p-5">{body}</Card>
          );
        })}
      </div>

      <h2 className="mb-3 font-display text-base font-semibold">Pagos</h2>
      <Card className="overflow-hidden">
        {data.payments.length ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-raised text-xs uppercase tracking-wider text-mute">
              <tr>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Monto</th>
                <th className="px-5 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.payments.map((p) => {
                const [label, tone] = STATUS[p.status] || [p.status, 'neutral'];
                return (
                  <tr key={p.id}>
                    <td className="px-5 py-3">{fmtDate(p.date)}</td>
                    <td className="px-5 py-3">{p.plan} · {String(p.period).toLowerCase()}</td>
                    <td className="px-5 py-3 font-semibold">{p.amount_label}</td>
                    <td className="px-5 py-3"><Badge tone={tone}>{label}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <Empty icon="receipt" title="Aún no tienes pagos" body="Cuando compres un plan, el comprobante aparece aquí." />
        )}
      </Card>
    </div>
  );
}

// ---- Seguridad ------------------------------------------------------------------------------------------------------

export function Security() {
  const { logout, info } = useZero();
  const toast = useToast();
  const confirm = useConfirm();
  const [data, setData] = useState(null);
  const load = () => window.zero.api('GET', '/devices').then(setData).catch((e) => toast(e.message, 'bad'));
  useEffect(() => {
    load();
  }, []);
  const revoke = async (d) => {
    if (!(await confirm({ title: `Cerrar sesión en «${d.name}»`, body: 'Ese computador tendrá que volver a iniciar sesión en ZERO.', confirm: 'Cerrar sesión', danger: true }))) return;
    try {
      await window.zero.api('DELETE', `/devices/${d.id}`);
      toast('Sesión cerrada en ese computador');
      load();
    } catch (e) {
      toast(e.message, 'bad');
    }
  };
  const revokeOthers = async () => {
    if (!(await confirm({ title: 'Cerrar las demás sesiones', body: 'Se cierra tu sesión en los demás computadores con ZERO y en todos los navegadores. Este computador sigue conectado.', confirm: 'Cerrar las demás', danger: true }))) return;
    try {
      const r = await window.zero.api('POST', '/devices/revoke-others');
      toast(`Listo: cerramos ${r.revoked_devices} sesión(es) de escritorio y las de la web`);
      load();
    } catch (e) {
      toast(e.message, 'bad');
    }
  };
  return (
    <div>
      <PageTitle title="Sesiones y seguridad" sub="Dónde tienes abierta tu cuenta ZERO." action={<Button variant="danger" icon="shield-check" onClick={revokeOthers}>Cerrar las demás sesiones</Button>} />
      <Card className="divide-y divide-line">
        {!data ? (
          <div className="grid h-40 place-items-center text-blue"><Spinner className="text-xl" /></div>
        ) : (
          data.items.map((d) => {
            const pi = platformIcon(d.platform);
            return (
              <div key={d.id} className="flex items-center gap-4 px-5 py-4">
                <span className={cx('grid h-11 w-11 place-items-center rounded-xl text-lg', d.current ? 'bg-blue text-white' : 'bg-raised text-sub')}>
                  <Icon {...pi} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    {d.name} {d.current && <Badge tone="blue">Este computador</Badge>}
                  </p>
                  <p className="text-[13px] text-sub">
                    {platformLabel(d.platform)} · App de escritorio · activa {timeAgo(d.last_seen_at)} · desde el {fmtDate(d.created_at)}
                  </p>
                </div>
                {d.current ? (
                  <Button size="sm" variant="secondary" icon="sign-out-alt" onClick={logout}>Salir</Button>
                ) : (
                  <Button size="sm" variant="ghost" icon="cross-small" onClick={() => revoke(d)}>Cerrar sesión</Button>
                )}
              </div>
            );
          })
        )}
        {data && (
          <div className="flex items-center gap-4 px-5 py-4">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-raised text-lg text-sub"><Icon name="browser" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Navegadores web</p>
              <p className="text-[13px] text-sub">Último inicio de sesión {timeAgo(data.last_web_login)} · se cierran con «Cerrar las demás sesiones»</p>
            </div>
          </div>
        )}
      </Card>
      <Card className="mt-5 flex gap-4 p-5 text-sm text-sub">
        <Icon name="shield-trust" className="mt-0.5 text-lg text-blue" />
        <p>
          {info?.encrypted ? 'Tu sesión en este computador se guarda cifrada con el llavero del sistema.' : 'Tu sesión se guarda en tu carpeta de usuario (este sistema no tiene un llavero disponible para cifrarla).'} ZERO nunca guarda tu
          contraseña en el computador, y cada app se abre aislada en su propia ventana.
        </p>
      </Card>
    </div>
  );
}

// ---- Acerca de ------------------------------------------------------------------------------------------------------

export function About() {
  const { info } = useZero();
  return (
    <div>
      <PageTitle title="Acerca de ZERO" />
      <Card className="max-w-2xl divide-y divide-line">
        {[
          ['Versión', info?.version],
          ['Sistema', platformLabel(info?.platform)],
          ['Servidor', info?.server],
          ['Sesión guardada', info?.encrypted ? 'Cifrada con el llavero del sistema' : 'Protegida en tu carpeta de usuario'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-6 px-5 py-3.5 text-sm">
            <span className="text-sub">{k}</span>
            <span className="truncate font-medium">{v}</span>
          </div>
        ))}
      </Card>
      <Card className="mt-5 max-w-2xl p-5 text-sm text-sub">
        <p className="font-semibold text-ink">Créditos</p>
        <p className="mt-2">
          Íconos:{' '}
          <button type="button" className="font-semibold text-blue hover:underline" onClick={() => window.zero.external('flaticon')}>
            Uicons by Flaticon
          </button>
          . Animaciones inspiradas en{' '}
          <button type="button" className="font-semibold text-blue hover:underline" onClick={() => window.zero.external('reactbits')}>
            React Bits
          </button>
          . Tipografías Geist e Inter (OFL).
        </p>
        <p className="mt-3">© {new Date().getFullYear()} ZERO Solutions · Hecho en Chile</p>
      </Card>
    </div>
  );
}
