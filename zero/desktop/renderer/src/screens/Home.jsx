import { useState } from 'react';
import { motion } from 'motion/react';
import BlurText from '../components/reactbits/BlurText';
import { AppMark } from '../components/Brand';
import { Badge, Button, Card, Icon, useToast } from '../components/ui';
import { useZero } from '../lib/store';
import { AppCard, InstallDialog, useAppActions } from './Apps';

function greeting() {
  const h = new Date().getHours();
  return h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
}

export function Home({ go }) {
  const { user, apps, installed } = useZero();
  const actions = useAppActions();
  const toast = useToast();
  const [installing, setInstalling] = useState(null);
  const [sending, setSending] = useState(false);
  const mine = (apps || []).filter((a) => installed.includes(a.id));
  const paid = (apps || []).filter((a) => a.tier !== 'free');

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold text-blue">{greeting()}</p>
        <BlurText key={user.first_name} text={`Hola, ${user.first_name}`} animateBy="words" delay={60} className="font-display text-[34px] font-bold tracking-tight" />
        <p className="mt-1 text-sm text-sub">Todo lo de tu cuenta ZERO, desde tu computador.</p>
      </div>

      {!user.verified && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-6 flex items-center gap-4 border-amber-500/30 bg-amber-500/[0.06] p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600">
              <Icon name="envelope-dot" />
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold">Confirma tu correo para abrir las apps</p>
              <p className="text-sub">Te enviamos un enlace a {user.email}.</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              loading={sending}
              onClick={async () => {
                setSending(true);
                try {
                  await window.zero.api('POST', '/verify/resend');
                  toast('Te reenviamos el correo de confirmación');
                } catch (e) {
                  toast(e.message, 'bad');
                } finally {
                  setSending(false);
                }
              }}
            >
              Reenviar
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Quick launch */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <Card className="col-span-2 p-5">
          <div className="flex items-center justify-between">
            <p className="font-display font-semibold">Abrir rápido</p>
            <button type="button" onClick={() => go('apps')} className="text-[13px] font-semibold text-blue hover:underline">
              Mis apps <Icon name="angle-small-right" />
            </button>
          </div>
          {mine.length ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {mine.map((app) => (
                <motion.button key={app.id} type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => actions.open(app)} className="flex items-center gap-3 rounded-xl border border-line bg-canvas py-2 pl-2 pr-4 transition hover:border-blue/40">
                  <AppMark app={app} size={36} />
                  <span className="text-sm font-semibold">{actions.busy === `open:${app.id}` ? 'Abriendo…' : app.name}</span>
                </motion.button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-sub">Instala una app aquí abajo y aparecerá en este lugar para abrirla con un clic.</p>
          )}
        </Card>
        <Card className="flex flex-col p-5">
          <p className="font-display font-semibold">Tu plan</p>
          <div className="mt-3 flex flex-1 flex-wrap content-start gap-1.5">
            {paid.length ? paid.map((a) => <Badge key={a.id} tone="gold" icon="crown">{a.name} {a.tier === 'max' ? 'Max' : 'Pro'}</Badge>) : <Badge>Gratis</Badge>}
          </div>
          <button type="button" onClick={() => go('plan')} className="mt-3 text-left text-[13px] font-semibold text-blue hover:underline">
            Ver plan y pagos <Icon name="angle-small-right" />
          </button>
        </Card>
      </div>

      <h2 className="mb-4 font-display text-lg font-semibold">Apps de ZERO</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
        {(apps || []).map((app, i) => (
          <AppCard key={app.id} app={app} installed={installed.includes(app.id)} actions={actions} onInstall={setInstalling} index={i} />
        ))}
      </div>
      <InstallDialog app={installing} onClose={() => setInstalling(null)} actions={actions} />
    </div>
  );
}
