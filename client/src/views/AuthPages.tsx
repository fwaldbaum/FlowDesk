import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { safeNext, useAuth } from '../auth/AuthContext';
import { LogoMark } from '../components/Logo';
import { Button } from '../components/ui';

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
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex flex-col items-center text-center">
            <Link to="/" aria-label="FlowDesk, inicio" className="mb-6">
              <LogoMark size={40} />
            </Link>
            <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
            <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-6 shadow-overlay">{children}</div>
          {footer && <div className="mt-6 text-center text-[13px] text-muted">{footer}</div>}
        </div>
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
  const { status, login, setupRequired } = useAuth();
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
        setupRequired ? (
          <>
            ¿Primera vez aquí?{' '}
            <Link to="/registro" className="font-medium text-accent-soft hover:text-fg">Crea tu espacio</Link>
          </>
        ) : (
          <>¿No tienes cuenta? Pide acceso al administrador de tu espacio.</>
        )
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
          <label className="label" htmlFor="login-password">Contraseña</label>
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

export function RegisterPage() {
  const { status, register, setupRequired } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'authenticated') return <Navigate to="/app" replace />;

  if (status !== 'loading' && !setupRequired) {
    return (
      <AuthLayout
        title="Registro cerrado"
        subtitle="Este espacio de FlowDesk ya tiene propietario"
        footer={<Link to="/login" className="font-medium text-accent-soft hover:text-fg">Ir a iniciar sesión</Link>}
      >
        <div className="flex items-start gap-3 text-[13px] leading-relaxed text-muted">
          <Lock size={16} className="mt-0.5 shrink-0 text-subtle" />
          <p>
            Para proteger los datos de tus clientes, las nuevas cuentas las crea el propietario desde{' '}
            <span className="text-fg">Configuración → Equipo</span>. Pídele que te dé acceso.
          </p>
        </div>
      </AuthLayout>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(name, email, password);
      navigate('/app', { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Crea tu espacio de trabajo"
      subtitle="Serás el propietario y podrás invitar a tu equipo"
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-accent-soft hover:text-fg">Inicia sesión</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="reg-name">Nombre</label>
          <input
            id="reg-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Tu nombre"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="tu@empresa.com"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="reg-password">Contraseña</label>
          <PasswordInput
            id="reg-password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <FormError message={error} />
        <Button type="submit" variant="primary" className="h-9 w-full" disabled={busy || password.length < 8}>
          {busy ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthLayout>
  );
}
