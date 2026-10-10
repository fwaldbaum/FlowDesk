import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { Logo } from '../../components/Logo';
import { ease } from '../../components/motion';
import { CtaLink } from './shared';

const LINKS = [
  { href: '#funciones', label: 'Funciones' },
  { href: '#demo', label: 'Demo' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#para-quien', label: 'Para quién' },
  { href: '#preguntas', label: 'Preguntas' },
];

export function Nav() {
  const { status } = useAuth();
  const authed = status === 'authenticated';
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={clsx(
        'sticky top-0 z-40 border-b transition-[background-color,border-color] duration-300',
        scrolled || open ? 'border-line/70 bg-canvas/85 backdrop-blur-xl' : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 md:px-6">
        <Link to="/" aria-label="FlowDesk, inicio" onClick={() => setOpen(false)}>
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 text-[13px] text-muted md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-md px-3 py-1.5 transition-colors hover:bg-raised/60 hover:text-fg">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {authed ? (
            <CtaLink to="/app" size="sm">
              Ir al tablero <ArrowRight size={14} />
            </CtaLink>
          ) : (
            <>
              <Link to="/login" className="rounded-md px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-fg">
                Iniciar sesión
              </Link>
              <CtaLink to="/registro" size="sm">Crear cuenta</CtaLink>
            </>
          )}
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-fg md:hidden"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className={clsx(
          'absolute inset-x-0 -bottom-px h-px origin-left bg-gradient-to-r from-accent/0 via-accent-soft to-accent-soft transition-opacity duration-300',
          scrolled && !open ? 'opacity-100' : 'opacity-0',
        )}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'calc(100dvh - 64px)' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden border-t border-line/70 md:hidden"
          >
            <motion.nav
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
              className="flex h-full flex-col px-4 pb-8 pt-4"
            >
              {LINKS.map((l) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  className="border-b border-line/60 py-4 text-lg font-medium text-fg"
                >
                  {l.label}
                </motion.a>
              ))}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                className="mt-auto flex flex-col gap-2"
              >
                {authed ? (
                  <CtaLink to="/app" size="lg">Ir al tablero</CtaLink>
                ) : (
                  <>
                    <CtaLink to="/registro" size="lg">Crear cuenta gratis</CtaLink>
                    <CtaLink to="/login" variant="secondary" size="lg">Iniciar sesión</CtaLink>
                  </>
                )}
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
