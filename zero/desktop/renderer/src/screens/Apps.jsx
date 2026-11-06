import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import SpotlightCard from '../components/reactbits/SpotlightCard';
import ClickSpark from '../components/reactbits/ClickSpark';
import { AppMark } from '../components/Brand';
import { Badge, Button, cx, Empty, Icon, Modal, PageTitle, timeAgo, useConfirm, useToast } from '../components/ui';
import { useZero } from '../lib/store';

export function useDark() {
  const q = '(prefers-color-scheme: dark)';
  const [dark, setDark] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setDark(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return dark;
}

const TIER = { pro: ['Pro', 'blue'], max: ['Max', 'gold'], plus: ['Plus', 'gold'] };

export function useAppActions() {
  const { setInstalled, info, user } = useZero();
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState('');
  const run = async (key, fn) => {
    setBusy(key);
    try {
      return await fn();
    } catch (e) {
      toast(e.message, 'bad');
      return null;
    } finally {
      setBusy('');
    }
  };
  return {
    busy,
    open: (app) => {
      if (!user?.verified) return toast(`Confirma tu correo para abrir ${app.name}.`, 'bad');
      return run(`open:${app.id}`, async () => {
        await window.zero.openApp(app.id);
        toast(`${app.name} abierta en su ventana`);
      });
    },
    browser: (app) => run(`browser:${app.id}`, async () => {
      await window.zero.openInBrowser(app.id);
      toast(`${app.name} se abrió en tu navegador`, 'info');
    }),
    install: (app, shortcut) =>
      run(`install:${app.id}`, async () => {
        const res = await window.zero.install(app.id, shortcut);
        setInstalled(res.installed);
        toast(res.shortcut ? `${app.name} instalada. Acceso directo en ${res.shortcut.where}.` : `${app.name} instalada`);
        return res;
      }),
    shortcut: (app) => run(`shortcut:${app.id}`, async () => {
      const res = await window.zero.shortcut(app.id);
      toast(`Acceso directo creado en ${res.where}`);
    }),
    uninstall: async (app) => {
      const ok = await confirm({
        title: `Desinstalar ${app.name}`,
        body: `Se quita de tus apps y del escritorio, y se borra la sesión de ${app.name} en este computador. Tus datos en ${app.name} no se tocan.`,
        confirm: 'Desinstalar',
        danger: true,
      });
      if (!ok) return;
      await run(`uninstall:${app.id}`, async () => {
        const res = await window.zero.uninstall(app.id);
        setInstalled(res.installed);
        toast(`${app.name} desinstalada`);
      });
    },
    platform: info?.platform,
  };
}

/** Install dialog: what "instalar" means, with the optional desktop shortcut. */
export function InstallDialog({ app, onClose, actions }) {
  const [shortcut, setShortcut] = useState(true);
  const [done, setDone] = useState(false);
  const mac = actions.platform === 'darwin';
  useEffect(() => {
    if (app) setDone(false);
  }, [app]);
  if (!app) return <Modal open={false} onClose={onClose} />;
  return (
    <Modal open={Boolean(app)} onClose={onClose} title={done ? `${app.name} está lista` : `Instalar ${app.name}`}>
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-4 rounded-2xl bg-raised p-4">
              <AppMark app={app} size={56} />
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold">{app.name}</p>
                <p className="text-sm text-sub">{app.category}</p>
              </div>
            </div>
            <ul className="mt-5 space-y-2.5 text-sm text-sub">
              <li className="flex gap-2.5"><Icon name="browser" className="mt-0.5 text-blue" /> Se abre en su propia ventana, sin navegador.</li>
              <li className="flex gap-2.5"><Icon name="shield-check" className="mt-0.5 text-blue" /> Entras con tu cuenta ZERO automáticamente.</li>
              <li className="flex gap-2.5"><Icon name="apps" className="mt-0.5 text-blue" /> Queda en «Mis apps» para abrirla con un clic.</li>
            </ul>
            {!mac ? (
              <label className="mt-5 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
                <span className="text-sm font-medium">Crear acceso directo en el escritorio</span>
                <input type="checkbox" checked={shortcut} onChange={(e) => setShortcut(e.target.checked)} className="h-5 w-5 accent-[#2563EB]" />
              </label>
            ) : (
              <p className="mt-5 rounded-xl bg-raised px-4 py-3 text-xs text-sub">En Mac la abres desde ZERO o con clic derecho en el ícono de ZERO en el Dock.</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <ClickSpark sparkColor="#2563EB" sparkCount={10}>
                <Button
                  icon="download"
                  loading={actions.busy === `install:${app.id}`}
                  onClick={async () => {
                    const res = await actions.install(app, !mac && shortcut);
                    if (res) setDone(true);
                  }}
                >
                  Instalar
                </Button>
              </ClickSpark>
            </div>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-2xl text-emerald-500">
              <Icon name="check" />
            </motion.span>
            <p className="mt-4 text-sm text-sub">La encuentras en «Mis apps»{!mac && shortcut ? ' y en tu escritorio' : ''}.</p>
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="secondary" onClick={onClose}>
                Listo
              </Button>
              <Button
                icon="arrow-up-right-from-square"
                loading={actions.busy === `open:${app.id}`}
                onClick={async () => {
                  await actions.open(app);
                  onClose();
                }}
              >
                Abrir {app.name}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

function AppMenu({ app, actions, installed }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [open]);
  const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-raised';
  return (
    <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="grid h-9 w-9 place-items-center rounded-xl text-mute hover:bg-raised hover:text-ink" aria-label={`Más opciones de ${app.name}`}>
        <Icon name="menu-dots-vertical" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="absolute right-0 top-10 z-30 w-60 rounded-xl border border-line bg-card p-1.5 shadow-lift">
            <button type="button" className={item} onClick={() => { setOpen(false); actions.browser(app); }}>
              <Icon name="browser" className="text-mute" /> Abrir en el navegador
            </button>
            {installed && actions.platform !== 'darwin' && (
              <button type="button" className={item} onClick={() => { setOpen(false); actions.shortcut(app); }}>
                <Icon name="desktop-arrow-down" className="text-mute" /> Crear acceso directo
              </button>
            )}
            {app.page && (
              <a href={app.page} target="_blank" rel="noreferrer" className={item} onClick={() => setOpen(false)}>
                <Icon name="info" className="text-mute" /> Ver detalles
              </a>
            )}
            {installed && (
              <button type="button" className={cx(item, 'text-rose-600 dark:text-rose-300')} onClick={() => { setOpen(false); actions.uninstall(app); }}>
                <Icon name="trash" /> Desinstalar
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppCard({ app, installed, actions, onInstall, index = 0 }) {
  const dark = useDark();
  const tier = TIER[app.tier];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * index, duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}>
      <SpotlightCard theme={dark ? 'dark' : 'light'} spotlightColor="#2563EB" intensity={dark ? 0.18 : 0.1} className={cx('flex h-full flex-col !rounded-2xl !p-5', dark && '[--spotlight-card-surface:#111623]')}>
        <div className="flex items-start justify-between gap-3">
          <AppMark app={app} size={52} />
          <div className="flex items-center gap-1">
            {tier && <Badge tone={tier[1]} icon="crown">{tier[0]}</Badge>}
            <AppMenu app={app} actions={actions} installed={installed} />
          </div>
        </div>
        <p className="mt-4 font-display text-lg font-semibold">{app.name}</p>
        <p className="text-[13px] font-medium text-blue">{app.category}</p>
        <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-sub">{app.summary}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xs text-mute">{installed ? (app.last_opened_at ? `Abierta ${timeAgo(app.last_opened_at)}` : 'Instalada') : 'No instalada'}</span>
          {installed ? (
            <Button size="sm" icon="arrow-up-right-from-square" loading={actions.busy === `open:${app.id}`} onClick={() => actions.open(app)}>
              Abrir
            </Button>
          ) : (
            <Button size="sm" variant="secondary" icon="download" onClick={() => onInstall(app)}>
              Instalar
            </Button>
          )}
        </div>
      </SpotlightCard>
    </motion.div>
  );
}

export function MyApps() {
  const { apps, installed } = useZero();
  const actions = useAppActions();
  const [installing, setInstalling] = useState(null);
  const mine = (apps || []).filter((a) => installed.includes(a.id));
  const others = (apps || []).filter((a) => !installed.includes(a.id));
  return (
    <div>
      <PageTitle title="Mis apps" sub="Las apps que instalaste en este computador se abren en su propia ventana, con tu sesión iniciada." />
      {mine.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
          {mine.map((app, i) => (
            <motion.button
              key={app.id}
              type="button"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.04 * i }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => actions.open(app)}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-line bg-card p-5 shadow-card transition hover:border-blue/40"
            >
              <AppMark app={app} size={64} className="transition group-hover:shadow-lift" />
              <span className="text-sm font-semibold">{app.name}</span>
              <span className="text-[11.5px] text-mute">{actions.busy === `open:${app.id}` ? 'Abriendo…' : app.last_opened_at ? timeAgo(app.last_opened_at) : 'Lista para abrir'}</span>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line">
          <Empty icon="box-open" title="Todavía no instalas ninguna app" body="Instala las que usas para abrirlas con un clic, en su propia ventana." />
        </div>
      )}
      {others.length > 0 && (
        <>
          <h2 className="mb-4 mt-10 font-display text-lg font-semibold">Disponibles para instalar</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {others.map((app, i) => (
              <AppCard key={app.id} app={app} installed={false} actions={actions} onInstall={setInstalling} index={i} />
            ))}
          </div>
        </>
      )}
      <InstallDialog app={installing} onClose={() => setInstalling(null)} actions={actions} />
    </div>
  );
}
