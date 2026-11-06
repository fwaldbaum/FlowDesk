import { useState } from 'react';
import { motion } from 'motion/react';
import Aurora from '../components/reactbits/Aurora';
import BlurText from '../components/reactbits/BlurText';
import ShinyText from '../components/reactbits/ShinyText';
import ClickSpark from '../components/reactbits/ClickSpark';
import { ZeroMark, ZeroWord } from '../components/Brand';
import { Button, Field, Icon, Input, PasswordInput } from '../components/ui';
import { useZero } from '../lib/store';

export function Login() {
  const { login } = useZero();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid h-full grid-cols-[1.05fr_1fr]">
      {/* Brand side */}
      <div className="relative overflow-hidden bg-[#0B1B3F] text-white">
        <div className="absolute inset-0 opacity-90">
          <Aurora colorStops={['#1D4ED8', '#60A5FA', '#2563EB']} amplitude={1.1} blend={0.55} speed={0.5} mouseInteraction={false} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_20%_100%,rgba(11,27,63,.9),transparent)]" />
        <div className="drag relative flex h-full flex-col justify-between p-12 pt-16">
          <div className="flex items-center gap-3">
            <ZeroMark size={40} className="rounded-xl bg-white p-1.5" />
            <span className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Escritorio</span>
          </div>
          <div>
            <BlurText text="Tu cuenta y tus apps, en un solo lugar." animateBy="words" delay={70} className="max-w-md font-display text-[40px] font-bold leading-[1.08] tracking-tight" />
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/70">Abre FlowDesk, Repeat, Venu y Pido con un clic, ya con tu sesión iniciada, y administra tu plan y tu seguridad sin entrar al navegador.</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {[
                ['apps', 'Todas tus apps'],
                ['shield-check', 'Sesión cifrada'],
                ['bolt', 'Inicio con un clic'],
              ].map(([i, t]) => (
                <span key={t} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[13px] font-medium backdrop-blur">
                  <Icon name={i} /> {t}
                </span>
              ))}
            </div>
          </div>
          <ShinyText text="ZERO Solutions · Hecho en Chile" speed={4} color="rgba(255,255,255,.45)" shineColor="#ffffff" className="text-[13px]" />
        </div>
      </div>

      {/* Form side */}
      <div className="drag relative flex items-center justify-center p-10">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          className="no-drag w-full max-w-sm"
        >
          <ZeroWord height={26} />
          <h1 className="mt-8 font-display text-2xl font-bold tracking-tight">Inicia sesión</h1>
          <p className="mt-1 text-sm text-sub">Con la misma cuenta que usas en zerosolutions.cl.</p>
          <div className="mt-7 space-y-4">
            <Field label="Correo">
              <Input icon="envelope" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.cl" autoComplete="email" autoFocus required />
            </Field>
            <Field label="Contraseña">
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu contraseña" autoComplete="current-password" required />
            </Field>
          </div>
          {error && (
            <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-300">
              <Icon name="exclamation" className="mt-0.5" /> {error}
            </p>
          )}
          <ClickSpark sparkColor="#2563EB" sparkCount={10} className="mt-6">
            <Button type="submit" size="lg" className="w-full" loading={busy} icon="sign-in-alt">
              Entrar
            </Button>
          </ClickSpark>
          <div className="mt-6 flex items-center justify-between text-sm">
            <button type="button" className="font-semibold text-blue hover:underline" onClick={() => window.zero.external('recuperar')}>
              ¿Olvidaste tu contraseña?
            </button>
            <button type="button" className="text-sub hover:text-ink" onClick={() => window.zero.external('registro')}>
              Crear cuenta <Icon name="arrow-up-right-from-square" className="ml-1 text-xs" />
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
