import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ZeroMark, ZeroWord } from './components/Brand';
import { Button, ConfirmProvider, cx, Icon, Spinner, ToastProvider, useConfirm } from './components/ui';
import { useZero, ZeroProvider } from './lib/store';
import { Login } from './screens/Login';
import { Home } from './screens/Home';
import { MyApps } from './screens/Apps';
import { About, Account, Billing, Security } from './screens/Account';

const NAV = [
  { id: 'home', label: 'Inicio', icon: 'home' },
  { id: 'apps', label: 'Mis apps', icon: 'apps' },
  { id: 'account', label: 'Cuenta', icon: 'circle-user' },
  { id: 'plan', label: 'Plan y pagos', icon: 'credit-card' },
  { id: 'security', label: 'Seguridad', icon: 'shield-check' },
];

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <ZeroProvider>
          <Root />
        </ZeroProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

function TitleBar() {
  // Draggable strip; window buttons are native (overlay on Windows/Linux, traffic lights on macOS).
  return <div className="drag fixed inset-x-0 top-0 z-50 h-11" />;
}

function Root() {
  const { booting, user, offline, retry } = useZero();
  if (booting) {
    return (
      <div className="grid h-full place-items-center">
        <TitleBar />
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            <ZeroMark size={56} />
          </motion.div>
          <Spinner className="text-blue" />
        </div>
      </div>
    );
  }
  if (offline && user === null) {
    return (
      <div className="grid h-full place-items-center p-10 text-center">
        <TitleBar />
        <div>
          <ZeroMark size={48} className="mx-auto" />
          <p className="mt-5 font-display text-xl font-semibold">No hay conexión con ZERO</p>
          <p className="mt-1 text-sm text-sub">{offline}</p>
          <Button className="mt-6" icon="refresh" onClick={retry}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <>
        <TitleBar />
        <Login />
      </>
    );
  }
  return <Shell />;
}

function Shell() {
  const { user, info, logout } = useZero();
  const confirm = useConfirm();
  const [page, setPage] = useState('home');
  const mac = info?.platform === 'darwin';
  const go = (p) => setPage(p);
  return (
    <div className="flex h-full">
      <TitleBar />
      <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-card/70 px-4 pb-4 backdrop-blur">
        <div className={cx('flex h-11 items-center', mac ? 'pl-[68px]' : 'pl-2')} />
        <div className="mb-6 mt-2 px-2">
          <ZeroWord height={20} />
        </div>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => go(n.id)}
              className={cx('relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition', page === n.id ? 'text-blue' : 'text-sub hover:bg-raised hover:text-ink')}
            >
              {page === n.id && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-blue-soft dark:bg-blue/15" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <Icon name={n.icon} className="relative text-[17px]" />
              <span className="relative">{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-1">
          <button type="button" onClick={() => go('about')} className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition', page === 'about' ? 'bg-raised text-ink' : 'text-mute hover:text-ink')}>
            <Icon name="info" /> Acerca de
          </button>
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue to-sky-400 text-[13px] font-bold text-white">{user.initials}</span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] font-semibold">{user.name}</span>
              <span className="block truncate text-[11.5px] text-mute">{user.email}</span>
            </span>
            <button
              type="button"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              onClick={async () => {
                if (await confirm({ title: 'Cerrar sesión', body: 'Las ventanas de las apps abiertas se cerrarán. Tus apps instaladas se mantienen.', confirm: 'Cerrar sesión' })) logout();
              }}
              className="grid h-8 w-8 place-items-center rounded-lg text-mute hover:bg-raised hover:text-rose-500"
            >
              <Icon name="sign-out-alt" />
            </button>
          </div>
        </div>
      </aside>
      <main className="scroll-thin relative flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-10 pb-16 pt-14">
          <AnimatePresence mode="wait">
            <motion.div key={page} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}>
              {page === 'home' && <Home go={go} />}
              {page === 'apps' && <MyApps />}
              {page === 'account' && <Account />}
              {page === 'plan' && <Billing />}
              {page === 'security' && <Security />}
              {page === 'about' && <About />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
