import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useInView, useReducedMotion, type Variants } from 'motion/react';

/** Shared timing so every surface moves the same way. */
export const ease = [0.22, 1, 0.36, 1] as const;
export const spring = { type: 'spring', stiffness: 420, damping: 36, mass: 0.8 } as const;
export const softSpring = { type: 'spring', stiffness: 260, damping: 30 } as const;

export const overlayMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.16 } },
};

export const panelMotion = {
  initial: { x: 48, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: spring },
  exit: { x: 48, opacity: 0, transition: { duration: 0.18, ease } },
};

export const dialogMotion = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: spring },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.14 } },
};

export const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease } },
};

/** Route-level enter animation. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease }}
    >
      {children}
    </motion.div>
  );
}

/** Fades and lifts content into place the first time it scrolls into view. */
export function Reveal({ children, delay = 0, className, y = 16 }: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Animates a number from 0 (or its previous value) to `value`. */
export function CountUp({ value, format = (n) => String(Math.round(n)), className }: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const from = useRef(0);
  const [text, setText] = useState(format(reduced ? value : 0));

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setText(format(value));
      return;
    }
    const controls = animate(from.current, value, {
      duration: 0.9,
      ease,
      onUpdate: (n) => setText(format(n)),
    });
    from.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inView, reduced]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}

/** Pulsing placeholder block for loading states. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-raised/70 ${className ?? ''}`} />;
}
