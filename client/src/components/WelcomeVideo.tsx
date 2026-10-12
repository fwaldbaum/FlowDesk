import { useEffect, useRef, useState } from 'react';
import { Plus, Volume2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../auth/AuthContext';
import { useStore } from '../store/AppStore';
import { dialogMotion, overlayMotion } from './motion';
import { Button, IconButton } from './ui';

const VIDEO = '/media/flowdesk-tour.mp4';
const POSTER = '/media/flowdesk-tour.jpg';

/** One-time welcome popup with the product tour, shown right after a new account lands in the app. */
export function WelcomeVideo() {
  const { user, dismissWelcome } = useAuth();
  const { setNewLeadOpen } = useStore();
  const open = Boolean(user?.needs_welcome);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismissWelcome();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismissWelcome]);

  const start = () => {
    dismissWelcome();
    setNewLeadOpen(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="welcome" {...overlayMotion} className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-[2px]">
          <div className="fixed inset-0" onClick={dismissWelcome} />
          <motion.div
            {...dialogMotion}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
            className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-line bg-surface shadow-overlay"
          >
            <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
              <div>
                <h2 id="welcome-title" className="text-base font-semibold">
                  Te damos la bienvenida{user ? `, ${user.name.split(' ')[0]}` : ''}
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">Un recorrido de un minuto por lo mejor de FlowDesk.</p>
              </div>
              <IconButton label="Cerrar" onClick={dismissWelcome}>
                <X size={16} />
              </IconButton>
            </div>
            <TourPlayer />
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3">
              {/* Only owners with a confirmed inbox get the welcome email. */}
              {user?.role === 'owner' && user.email_verified && (
                <p className="mr-auto text-xs text-subtle">También te lo enviamos por correo.</p>
              )}
              <Button variant="ghost" onClick={dismissWelcome}>Cerrar</Button>
              <Button variant="primary" onClick={start}>
                <Plus size={14} /> Crear mi primer lead
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TourPlayer() {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  // Try with sound first (the user just clicked through sign-up); browsers that refuse
  // still autoplay muted, and the burned-in subtitles carry the message.
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.play().catch(() => {
      video.muted = true;
      setMuted(true);
      video.play().catch(() => {});
    });
  }, []);

  const unmute = () => {
    const video = ref.current;
    if (!video) return;
    video.muted = false;
    setMuted(false);
    if (video.ended) video.currentTime = 0;
    video.play().catch(() => {});
  };

  return (
    <div className="relative bg-canvas">
      <video
        ref={ref}
        src={VIDEO}
        poster={POSTER}
        controls
        playsInline
        preload="auto"
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
        className="block aspect-video w-full"
      />
      {muted && (
        <button
          onClick={unmute}
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-line bg-canvas/85 px-2.5 py-1.5 text-xs font-medium text-fg backdrop-blur transition-colors hover:border-accent/60"
        >
          <Volume2 size={14} /> Activar sonido
        </button>
      )}
    </div>
  );
}
