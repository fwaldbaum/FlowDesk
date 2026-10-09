import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  ArrowLeft, Building, Building2, CalendarDays, Check, Ellipsis, Landmark, Megaphone, Newspaper, Search,
  Share2, User, Users, UsersRound, type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../auth/AuthContext';
import { ease } from '../components/motion';
import { LogoMark } from '../components/Logo';
import { Button } from '../components/ui';
import { COMPANY_SIZE_LABELS, HEARD_FROM_LABELS } from '../lib/constants';
import type { CompanySize, HeardFrom } from '../lib/types';

type Icon = LucideIcon;

const HEARD_FROM_ICONS: Record<HeardFrom, Icon> = {
  google: Search,
  social: Share2,
  referral: Users,
  ads: Megaphone,
  blog: Newspaper,
  event: CalendarDays,
  other: Ellipsis,
};

const SIZE_ICONS: Record<CompanySize, Icon> = {
  solo: User,
  '2-10': UsersRound,
  '11-50': Building,
  '51-200': Building2,
  '200+': Landmark,
};

const STEPS = [
  { title: '¿Cómo conociste FlowDesk?', hint: 'Elige la opción que mejor te represente.' },
  { title: '¿Qué tan grande es tu empresa?', hint: 'Contando a todas las personas que trabajan en ella.' },
  { title: '¿De qué trata tu empresa?', hint: 'Una o dos frases bastan.' },
];

function OptionCard({ selected, icon: Icon, label, onSelect }: {
  selected: boolean;
  icon: Icon;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={clsx(
        'flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left text-[13px] font-medium transition-colors',
        selected
          ? 'border-accent/70 bg-accent/10 text-fg'
          : 'border-line bg-canvas text-fg/90 hover:border-line-strong hover:bg-raised/60',
      )}
    >
      <span
        className={clsx(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
          selected ? 'border-accent/50 text-accent-soft' : 'border-line text-muted',
        )}
      >
        <Icon size={16} strokeWidth={1.75} />
      </span>
      <span className="flex-1">{label}</span>
      {selected && <Check size={15} className="text-accent-soft" />}
    </button>
  );
}

export function OnboardingPage() {
  const { user, submitSurvey, logout } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [heardFrom, setHeardFrom] = useState<HeardFrom | null>(null);
  const [detail, setDetail] = useState('');
  const [size, setSize] = useState<CompanySize | null>(null);
  const [about, setAbout] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = [
    heardFrom !== null && (heardFrom !== 'other' || detail.trim().length > 0),
    size !== null,
    about.trim().length >= 3,
  ][step];

  // Single-choice questions advance on their own, except "Otro", which needs a detail.
  const choose = <T,>(setter: (v: T) => void, value: T, advance: boolean) => {
    setter(value);
    if (advance) window.setTimeout(() => setStep((s) => s + 1), 180);
  };

  const finish = async () => {
    if (!heardFrom || !size) return;
    setBusy(true);
    setError(null);
    try {
      await submitSurvey({
        heard_from: heardFrom,
        heard_from_detail: heardFrom === 'other' ? detail.trim() : undefined,
        company_size: size,
        company_about: about.trim(),
      });
      navigate('/app', { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const next = () => (step === STEPS.length - 1 ? finish() : setStep(step + 1));

  return (
    <div className="relative flex min-h-full flex-col bg-canvas">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[480px]" />
      <div className="relative flex h-14 items-center justify-between px-4 md:px-6">
        <LogoMark size={26} />
        <button
          onClick={async () => {
            await logout();
            navigate('/', { replace: true });
          }}
          className="text-xs text-muted transition-colors hover:text-fg"
        >
          Cerrar sesión
        </button>
      </div>

      <main className="relative flex flex-1 justify-center px-4 pb-16 pt-[6vh]">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-fg">
              Hola{user ? `, ${user.name.split(' ')[0]}` : ''}. Bienvenido a FlowDesk
            </h1>
            <p className="mt-1.5 text-sm text-muted">Tres preguntas rápidas para conocerte mejor.</p>
          </div>

          <div className="mb-3 flex items-center justify-between text-2xs text-subtle">
            <span>Paso {step + 1} de {STEPS.length}</span>
          </div>
          <div className="mb-5 grid grid-cols-3 gap-1.5" aria-hidden>
            {STEPS.map((_, i) => (
              <span key={i} className="h-1 overflow-hidden rounded-full bg-line">
                <motion.span
                  className="block h-full rounded-full bg-accent"
                  initial={false}
                  animate={{ width: i <= step ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease }}
                />
              </span>
            ))}
          </div>

          <section className="rounded-xl border border-line bg-surface p-6 shadow-overlay">
            <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0, transition: { duration: 0.28, ease } }}
              exit={{ opacity: 0, x: -24, transition: { duration: 0.15 } }}
            >
            <h2 className="text-base font-semibold text-fg">{STEPS[step]!.title}</h2>
            <p className="mb-5 mt-1 text-xs text-muted">{STEPS[step]!.hint}</p>

            {step === 0 && (
              <>
                <div role="radiogroup" aria-label={STEPS[0]!.title} className="grid gap-2 sm:grid-cols-2">
                  {(Object.keys(HEARD_FROM_LABELS) as HeardFrom[]).map((key) => (
                    <OptionCard
                      key={key}
                      selected={heardFrom === key}
                      icon={HEARD_FROM_ICONS[key]}
                      label={HEARD_FROM_LABELS[key]}
                      onSelect={() => choose(setHeardFrom, key, key !== 'other')}
                    />
                  ))}
                </div>
                {heardFrom === 'other' && (
                  <input
                    className="input mt-3"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && canContinue && next()}
                    placeholder="¿Dónde nos conociste?"
                    aria-label="¿Dónde nos conociste?"
                    maxLength={200}
                    autoFocus
                  />
                )}
              </>
            )}

            {step === 1 && (
              <div role="radiogroup" aria-label={STEPS[1]!.title} className="grid gap-2">
                {(Object.keys(COMPANY_SIZE_LABELS) as CompanySize[]).map((key) => (
                  <OptionCard
                    key={key}
                    selected={size === key}
                    icon={SIZE_ICONS[key]}
                    label={COMPANY_SIZE_LABELS[key]}
                    onSelect={() => choose(setSize, key, true)}
                  />
                ))}
              </div>
            )}

            {step === 2 && (
              <div>
                <textarea
                  className="input min-h-[112px] resize-y leading-relaxed"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canContinue) next();
                  }}
                  placeholder="Ej: Agencia de marketing digital para restaurantes en Santiago."
                  aria-label={STEPS[2]!.title}
                  maxLength={500}
                  autoFocus
                />
                <p className="mt-1.5 text-right text-2xs tabular-nums text-subtle">{about.length}/500</p>
              </div>
            )}

            </motion.div>
            </AnimatePresence>
            {error && <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>}

            <div className="mt-6 flex items-center justify-between">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  <ArrowLeft size={14} /> Atrás
                </Button>
              ) : (
                <span />
              )}
              <Button variant="primary" onClick={next} disabled={!canContinue || busy}>
                {step === STEPS.length - 1 ? (busy ? 'Guardando…' : 'Ir a mi tablero') : 'Continuar'}
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
