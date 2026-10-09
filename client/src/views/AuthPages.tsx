import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, CircleCheck, CircleX, Eye, EyeOff, Info, LoaderCircle, MailOpen } from 'lucide-react';
import { safeNext, useAuth } from '../auth/AuthContext';
import { LogoMark } from '../components/Logo';
import { ease, spring } from '../components/motion';
import { Button } from '../components/ui';
import { api } from '../lib/api';

function AuthLayout({ title, subtitle, children, footer }: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-col bg-canvas">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[480px]" />
      <div className="relative flex h-14 items-center px-4 md:px-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg">
          <ArrowLeft size={14} /> Volver al inicio
        </Link>
      </div>

      <main className="relative flex flex-1 items-start justify-center px-4 pb-16 pt-[8vh]">
        <motion.div
          className="w-full max-w-[380px]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <Link to="/" aria-label="FlowDesk, inicio" className="mb-6">
              <LogoMark size={40} />
            </Link>
            <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
            <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-6 shadow-overlay">{children}</div>
          {footer && <div className="mt-6 text-center text-[13px] text-muted">{footer}</div>}
        </motion.div>
      </main>
    </div>
  );
}

function PasswordInput({ id, value, onChange, autoComplete, placeholder }: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className="input pr-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-subtle hover:text-fg"
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
      {message}
    </p>
  );
}

export function LoginPage() {
  const { status, login } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const next = safeNext(params.get('next'));

  if (status === 'authenticated') return <Navigate to={next} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate(next, { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Inicia sesión"
      subtitle="Accede a tu tablero de leads"
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-accent-soft hover:text-fg">Crea una gratis</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="tu@empresa.com"
            autoFocus
            required
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label className="label" htmlFor="login-password">Contraseña</label>
            <Link to="/olvide" className="text-2xs text-accent-soft hover:text-fg">¿Olvidaste tu contraseña?</Link>
          </div>
          <PasswordInput id="login-password" value={password} onChange={setPassword} autoComplete="current-password" />
        </div>
        <FormError message={error} />
        <Button type="submit" variant="primary" className="h-9 w-full" disabled={busy}>
          {busy ? 'Ingresando…' : 'Iniciar sesión'}
        </Button>
      </form>
    </AuthLayout>
  );
}

const ROLE_SUGGESTIONS = [
  'Fundador/a o CEO',
  'Gerente general',
  'Ventas',
  'Marketing',
  'Operaciones',
  'Atención al cliente',
  'Freelance / Independiente',
];

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.es', 'outlook.com', 'outlook.es', 'live.com',
  'msn.com', 'yahoo.com', 'yahoo.es', 'icloud.com', 'me.com', 'aol.com', 'protonmail.com', 'proton.me',
]);

export function RegisterPage() {
  const { status, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', job_title: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'authenticated') return <Navigate to="/app" replace />;

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const domain = form.email.split('@')[1]?.toLowerCase().trim();
  const personalEmail = Boolean(domain && PERSONAL_DOMAINS.has(domain));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(form);
      navigate('/bienvenida', { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Empieza a ordenar tus leads en menos de un minuto"
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-accent-soft hover:text-fg">Inicia sesión</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="reg-name">Nombre completo</label>
          <input
            id="reg-name"
            className="input"
            value={form.name}
            onChange={set('name')}
            autoComplete="name"
            placeholder="María González"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="reg-email">Correo de empresa</label>
          <input
            id="reg-email"
            type="email"
            className="input"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
            placeholder="maria@tuempresa.com"
            required
          />
          {personalEmail && (
            <p className="mt-1.5 flex items-center gap-1.5 text-2xs text-amber-300/90">
              <Info size={12} /> Te recomendamos usar el correo de tu empresa.
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="reg-phone">Teléfono</label>
            <input
              id="reg-phone"
              type="tel"
              className="input"
              value={form.phone}
              onChange={set('phone')}
              autoComplete="tel"
              placeholder="+56 9 1234 5678"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="reg-role">Tu rol en la empresa</label>
            <input
              id="reg-role"
              className="input"
              list="reg-roles"
              value={form.job_title}
              onChange={set('job_title')}
              autoComplete="organization-title"
              placeholder="Ej: Fundador/a"
              required
            />
            <datalist id="reg-roles">
              {ROLE_SUGGESTIONS.map((r) => <option key={r} value={r} />)}
            </datalist>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="reg-password">Contraseña</label>
          <PasswordInput
            id="reg-password"
            value={form.password}
            onChange={(v) => setForm((f) => ({ ...f, password: v }))}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <FormError message={error} />
        <Button type="submit" variant="primary" className="h-9 w-full" disabled={busy || form.password.length < 8}>
          {busy ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
        <p className="text-center text-2xs leading-relaxed text-subtle">
          Tu cuenta tendrá su propio espacio privado: solo tú y las personas que invites verán tus leads.
        </p>
      </form>
    </AuthLayout>
  );
}

/** Big centered status icon for single-message auth screens. */
function StatusIcon({ children, tone }: { children: ReactNode; tone: 'accent' | 'success' | 'error' }) {
  const colors = {
    accent: 'border-accent/40 bg-accent/10 text-accent-soft',
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    error: 'border-red-500/40 bg-red-500/10 text-red-300',
  };
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, transition: spring }}
      className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border ${colors[tone]}`}
    >
      {children}
    </motion.div>
  );
}

/** Shown to signed-in users who still need to confirm their email. */
export function VerifyEmailGate() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Confirming in another tab (or on the phone) unlocks this one automatically.
  useEffect(() => {
    const check = () => {
      if (document.visibilityState === 'visible') refresh().catch(() => {});
    };
    const timer = window.setInterval(check, 5000);
    window.addEventListener('focus', check);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', check);
    };
  }, [refresh]);

  const resend = async () => {
    setState('sending');
    setError(null);
    try {
      await api.resendVerification();
      setState('sent');
    } catch (err) {
      setError((err as Error).message);
      setState('idle');
    }
  };

  return (
    <AuthLayout
      title="Confirma tu correo"
      subtitle="Un último paso para proteger tu cuenta"
      footer={
        <button
          onClick={async () => {
            await logout();
            navigate('/login', { replace: true });
          }}
          className="text-muted hover:text-fg"
        >
          Usar otra cuenta
        </button>
      }
    >
      <div className="text-center">
        <StatusIcon tone="accent">
          <MailOpen size={22} />
        </StatusIcon>
        <p className="text-[13px] leading-relaxed text-muted">
          Te enviamos un enlace a <span className="font-medium text-fg">{user?.email}</span>. Ábrelo para activar tu
          cuenta; esta pantalla se actualizará sola.
        </p>
        <p className="mt-3 text-2xs text-subtle">¿No llegó? Revisa spam o promociones.</p>
        <div className="mt-5">
          <FormError message={error} />
          <Button className="mt-3 w-full" onClick={resend} disabled={state !== 'idle'}>
            {state === 'sending' ? 'Enviando…' : state === 'sent' ? 'Enlace reenviado' : 'Reenviar enlace'}
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}

/** Target of the link in the verification email. */
export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const { status, refresh } = useAuth();
  const [state, setState] = useState<'pending' | 'ok' | 'error'>('pending');
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in development; a token can only be used once.
    if (started.current) return;
    started.current = true;
    api
      .verifyEmail(params.get('token') ?? '')
      .then(async () => {
        setState('ok');
        await refresh().catch(() => {});
      })
      .catch((err) => {
        setError((err as Error).message);
        setState('error');
      });
  }, [params, refresh]);

  return (
    <AuthLayout
      title={state === 'ok' ? '¡Correo confirmado!' : state === 'error' ? 'Enlace no válido' : 'Confirmando…'}
      subtitle={state === 'ok' ? 'Tu cuenta ya está activa' : 'Verificación de correo'}
    >
      <div className="text-center">
        {state === 'pending' && (
          <StatusIcon tone="accent">
            <LoaderCircle size={22} className="animate-spin" />
          </StatusIcon>
        )}
        {state === 'ok' && (
          <>
            <StatusIcon tone="success">
              <CircleCheck size={22} />
            </StatusIcon>
            <Link to={status === 'authenticated' ? '/app' : '/login'}>
              <Button variant="primary" className="h-9 w-full">
                {status === 'authenticated' ? 'Continuar' : 'Iniciar sesión'}
              </Button>
            </Link>
          </>
        )}
        {state === 'error' && (
          <>
            <StatusIcon tone="error">
              <CircleX size={22} />
            </StatusIcon>
            <p className="mb-5 text-[13px] text-muted">{error}</p>
            <Link to={status === 'authenticated' ? '/verifica-tu-correo' : '/login'}>
              <Button className="h-9 w-full">Pedir un enlace nuevo</Button>
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={sent ? 'Revisa tu correo' : '¿Olvidaste tu contraseña?'}
      subtitle={sent ? 'Te enviamos las instrucciones' : 'Te enviaremos un enlace para crear una nueva'}
      footer={
        <Link to="/login" className="font-medium text-accent-soft hover:text-fg">
          Volver a iniciar sesión
        </Link>
      }
    >
      {sent ? (
        <div className="text-center">
          <StatusIcon tone="success">
            <MailOpen size={22} />
          </StatusIcon>
          <p className="text-[13px] leading-relaxed text-muted">
            Si existe una cuenta con <span className="font-medium text-fg">{email}</span>, recibirás un enlace válido por
            1 hora. Revisa también spam.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="tu@empresa.com"
              autoFocus
              required
            />
          </div>
          <FormError message={error} />
          <Button type="submit" variant="primary" className="h-9 w-full" disabled={busy}>
            {busy ? 'Enviando…' : 'Enviar enlace'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const token = params.get('token') ?? '';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      window.setTimeout(() => navigate('/login', { replace: true }), 2200);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={done ? 'Contraseña actualizada' : 'Crea una nueva contraseña'}
      subtitle={done ? 'Ya puedes iniciar sesión' : 'Por seguridad cerraremos tus otras sesiones'}
      footer={
        <Link to="/login" className="font-medium text-accent-soft hover:text-fg">
          Volver a iniciar sesión
        </Link>
      }
    >
      {done ? (
        <div className="text-center">
          <StatusIcon tone="success">
            <CircleCheck size={22} />
          </StatusIcon>
          <p className="text-[13px] text-muted">Te llevamos al inicio de sesión…</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="reset-password">Nueva contraseña</label>
            <PasswordInput
              id="reset-password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <FormError message={error} />
          {error && (
            <Link to="/olvide" className="block text-center text-xs text-accent-soft hover:text-fg">
              Pedir un enlace nuevo
            </Link>
          )}
          <Button type="submit" variant="primary" className="h-9 w-full" disabled={busy || password.length < 8}>
            {busy ? 'Guardando…' : 'Guardar contraseña'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
