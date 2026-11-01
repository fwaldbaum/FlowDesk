import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react';

// React versions of the ZERO motion kit (zero/public_html/assets/js/zfx.js), used on the landing page only.

const ease = [0.2, 0.8, 0.2, 1] as const;

/** Letters rise out of a mask one after another the first time the text scrolls into view. */
export function SplitText({ text, className, delay = 0, by = 'char', as: Tag = 'span' }: {
  text: string;
  className?: string;
  delay?: number;
  by?: 'char' | 'word';
  as?: 'span' | 'div';
}) {
  const reduced = useReducedMotion();
  const words = text.split(' ');
  let i = 0;
  if (reduced) return <Tag className={className}>{text}</Tag>;
  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, wi) => (
        <Fragment key={wi}>
        <span aria-hidden className="inline-block whitespace-nowrap">
          {(by === 'char' ? [...w] : [w]).map((part, pi) => {
            const n = i++;
            return (
              <span key={pi} className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-top">
                <motion.span
                  className="inline-block"
                  initial={{ y: '105%', rotate: 7, opacity: 0 }}
                  whileInView={{ y: 0, rotate: 0, opacity: 1 }}
                  viewport={{ once: true, margin: '0px 0px -40px 0px' }}
                  transition={{ duration: 0.85, ease, delay: delay + n * (by === 'char' ? 0.026 : 0.07) }}
                >
                  {part}
                </motion.span>
              </span>
            );
          })}
        </span>
        {wi < words.length - 1 && ' '}
        </Fragment>
      ))}
    </Tag>
  );
}

/** Swaps one word for the next with a short flip; holds the first word with reduced motion. */
export function RotatingText({ words, every = 2400, className }: { words: string[]; every?: number; className?: string }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setN((v) => (v + 1) % words.length), every);
    return () => window.clearInterval(t);
  }, [reduced, every, words.length]);
  return (
    <span className={clsx('relative inline-flex overflow-hidden pb-[0.1em] align-top', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[n]}
          className="inline-block whitespace-nowrap"
          initial={{ y: '100%', rotateX: -70, opacity: 0 }}
          animate={{ y: 0, rotateX: 0, opacity: 1 }}
          exit={{ y: '-100%', rotateX: 70, opacity: 0 }}
          transition={{ duration: 0.55, ease }}
        >
          {words[n]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Canvas grid of dots that light up and push away from the pointer (React Bits "Dot Grid"). */
export function DotGrid({ className, gap = 28, color = '165,180,252', accent = '129,140,248' }: {
  className?: string;
  gap?: number;
  color?: string;
  accent?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const area = canvas.parentElement!;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    const pointer = { x: -9999, y: -9999 };
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let y = gap / 2; y < h; y += gap) {
        for (let x = gap / 2; x < w; x += gap) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          const near = Math.max(0, 1 - d / 170);
          const push = near * 7;
          const px = d ? x + (dx / d) * push : x;
          const py = d ? y + (dy / d) * push : y;
          ctx.fillStyle = near > 0 ? `rgba(${accent},${0.18 + near * 0.7})` : `rgba(${color},0.14)`;
          ctx.beginPath();
          ctx.arc(px, py, 1.1 + near * 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    const loop = () => {
      if (visible) draw();
      raf = requestAnimationFrame(loop);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const leave = () => { pointer.x = -9999; pointer.y = -9999; };
    size();
    draw();
    const ro = new ResizeObserver(() => { size(); draw(); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    if (!reduced) {
      area.addEventListener('pointermove', move);
      area.addEventListener('pointerleave', leave);
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      area.removeEventListener('pointermove', move);
      area.removeEventListener('pointerleave', leave);
    };
  }, [gap, color, accent, reduced]);
  return <canvas ref={ref} aria-hidden className={clsx('pointer-events-none absolute inset-0 h-full w-full', className)} />;
}

/** Pulls its child a few pixels toward the pointer and lets it spring back. */
export function Magnet({ children, strength = 0.25, className }: { children: ReactNode; strength?: number; className?: string }) {
  const reduced = useReducedMotion();
  const x = useSpring(0, { stiffness: 260, damping: 18 });
  const y = useSpring(0, { stiffness: 260, damping: 18 });
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={clsx('inline-flex', className)}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.div>
  );
}

/** Short burst of lines where the visitor clicks inside it (React Bits "Click Spark"). */
export function ClickSpark({ children, color = '#A5B4FC', className }: { children: ReactNode; color?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const sparks = useRef<{ x: number; y: number; a: number; t: number }[]>([]);
  const raf = useRef(0);

  const tick = () => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = performance.now();
    sparks.current = sparks.current.filter((s) => now - s.t < 420);
    for (const s of sparks.current) {
      const p = (now - s.t) / 420;
      const eased = p * (2 - p);
      const d = eased * 26;
      const len = 9 * (1 - eased);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 1 - p;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x + d * Math.cos(s.a), s.y + d * Math.sin(s.a));
      ctx.lineTo(s.x + (d + len) * Math.cos(s.a), s.y + (d + len) * Math.sin(s.a));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    raf.current = sparks.current.length ? requestAnimationFrame(tick) : 0;
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <div
      className={clsx('relative', className)}
      onPointerDown={(e) => {
        const canvas = ref.current;
        if (reduced || !canvas) return;
        const r = canvas.getBoundingClientRect();
        if (canvas.width !== Math.round(r.width) || canvas.height !== Math.round(r.height)) {
          canvas.width = Math.round(r.width);
          canvas.height = Math.round(r.height);
        }
        const now = performance.now();
        for (let k = 0; k < 8; k++) sparks.current.push({ x: e.clientX - r.left, y: e.clientY - r.top, a: (Math.PI * 2 * k) / 8, t: now });
        if (!raf.current) raf.current = requestAnimationFrame(tick);
      }}
    >
      {children}
      <canvas ref={ref} aria-hidden className="pointer-events-none absolute -inset-10 h-[calc(100%+80px)] w-[calc(100%+80px)]" />
    </div>
  );
}

/** A row that drifts sideways and speeds up with the scroll (React Bits "Scroll Velocity"). */
export function VelocityMarquee({ children, speed = 40, className }: { children: ReactNode; speed?: number; className?: string }) {
  const reduced = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [-2000, 0, 2000], [5, 0, 5], { clamp: false });
  const x = useMotionValue(0);
  useAnimationFrame((_, delta) => {
    const el = track.current;
    if (reduced || !el) return;
    const half = el.scrollWidth / 2;
    let next = x.get() - (speed * (1 + Math.abs(boost.get())) * delta) / 1000;
    if (next <= -half) next += half;
    x.set(next);
  });
  return (
    <div className={clsx('overflow-hidden', className)}>
      <motion.div ref={track} className="flex w-max" style={{ x }}>
        {children}
        <span aria-hidden className="contents">{children}</span>
      </motion.div>
    </div>
  );
}
