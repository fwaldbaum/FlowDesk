import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Gauge, KeyRound, ShieldCheck, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { LogoMark } from './Logo';
import { dialogMotion, overlayMotion } from './motion';
import { Button, IconButton } from './ui';

const ZERO_URL = 'https://zerosolutions.cl';
const SEEN_KEY = 'fd_zero_announcement_v1';

const seen = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

const markSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Private mode: it may show again next visit, which is harmless.
  }
};

const POINTS = [
  { icon: Gauge, title: 'Mejor rendimiento', text: 'Más velocidad y estabilidad en todo FlowDesk.' },
  { icon: Sparkles, title: 'Más mejoras para FlowDesk', text: 'Un equipo dedicado y nuevas funciones en camino.' },
  { icon: KeyRound, title: 'Una cuenta ZERO', text: 'Entra a FlowDesk y a las próximas apps con un solo acceso.' },
  { icon: ShieldCheck, title: 'Todo sigue igual', text: 'Tu cuenta, tus leads y tu historial están intactos.' },
];

/**
 * One-time announcement (per browser) that FlowDesk joined ZERO Solutions. `suppress` is set for
 * brand-new accounts (they get the welcome video instead, and the news isn't news to them).
 */
export function ZeroAnnouncement({ suppress = false }: { suppress?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (suppress) return markSeen();
    if (seen()) return;
    const timer = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(timer);
  }, [suppress]);

  const close = () => {
    setOpen(false);
    markSeen();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="zero" {...overlayMotion} className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-[2px]">
          <div className="fixed inset-0" onClick={close} />
          <motion.div
            {...dialogMotion}
            role="dialog"
            aria-modal="true"
            aria-labelledby="zero-title"
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-overlay"
          >
            <div className="relative border-b border-line bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,rgba(37,99,235,0.22),transparent_70%)] px-6 pb-6 pt-7">
              <IconButton label="Cerrar" onClick={close} className="absolute right-3 top-3">
                <X size={16} />
              </IconButton>
              <div className="flex items-center justify-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-canvas">
                  <LogoMark size={28} />
                </span>
                <ArrowRight size={18} className="text-subtle" aria-hidden="true" />
                <span className="flex h-12 items-center gap-2.5 rounded-xl border border-line bg-canvas px-3.5">
                  <img src="/brand/zero-mark.svg" alt="" width={26} height={26} />
                  <img src="/brand/zero-word-light.svg" alt="ZERO" height={15} className="h-[15px] w-auto" />
                </span>
              </div>
              <p className="mt-5 text-center text-2xs font-semibold uppercase tracking-[0.14em] text-[#60A5FA]">Novedad</p>
              <h2 id="zero-title" className="mt-1.5 text-center text-xl font-semibold tracking-tight">
                Nos mudamos con ZERO Solutions
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-center text-[13px] leading-relaxed text-muted">
                Junto a ZERO decidimos unirnos: FlowDesk ahora es parte de ZERO Solutions, una empresa chilena que crea
                software simple para emprendedores y pymes.
              </p>
            </div>

            <ul className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              {POINTS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#2563EB]/30 bg-[#2563EB]/10 text-[#60A5FA]">
                    <Icon size={15} />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-fg">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
              <Button variant="ghost" onClick={close}>Seguir en FlowDesk</Button>
              <a
                href={ZERO_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-[#2563EB] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1D4ED8]"
              >
                Conocer ZERO Solutions <ArrowUpRight size={14} />
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
