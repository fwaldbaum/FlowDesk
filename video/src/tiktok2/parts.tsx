import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { colors } from '../theme';
import { clamp, FPS, usePulse } from '../tiktok/kit';
import { BEATS2 } from './beats';

/** Absolute frame of beat `i` of track 2. */
export const b2 = (i: number) => Math.round(BEATS2[i]! * FPS);
export const local2 = (start: number) => (i: number) => b2(i) - start;
export const usePulse2 = (offset: number, every = 1) => usePulse(offset, every, BEATS2);

/** Deep, slow-moving backdrop: a softer, more cinematic take than the first ad. */
export function Stage({ offset, hue = 'rgba(79,70,229,0.32)' }: { offset: number; hue?: string }) {
  const frame = useCurrentFrame() + offset;
  const pulse = usePulse2(offset);
  const t = frame / 30;
  return (
    <AbsoluteFill style={{ backgroundColor: '#07090F', overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 35% at ${50 + Math.sin(t / 2) * 12}% ${34 + Math.cos(t / 3) * 6}%, ${hue}, transparent 70%)`,
          opacity: 0.8 + pulse * 0.2,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 50% 30% at ${40 - Math.sin(t / 2.5) * 14}% 82%, rgba(59,130,246,0.16), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(38,45,61,0.38) 1px, transparent 1px), linear-gradient(to bottom, rgba(38,45,61,0.38) 1px, transparent 1px)',
          backgroundSize: '90px 90px',
          maskImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, #000 10%, transparent 90%)',
          transform: `perspective(900px) rotateX(58deg) translateY(${380 + ((frame * 1.2) % 90)}px) scale(2.2)`,
          transformOrigin: '50% 100%',
          opacity: 0.55,
        }}
      />
      {/* Film-like vignette keeps the eye in the centre */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
    </AbsoluteFill>
  );
}

/** Modern phone frame with a dynamic island. Content is laid out at 470px width. */
export function Phone({ children, style, glow = 0 }: { children: ReactNode; style?: CSSProperties; glow?: number }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 520,
        height: 1060,
        borderRadius: 86,
        padding: 14,
        boxSizing: 'border-box',
        background: 'linear-gradient(145deg, #3A4152 0%, #1A1F2B 40%, #0E1118 100%)',
        boxShadow: `0 90px 160px -50px rgba(0,0,0,0.95), 0 0 0 2px rgba(255,255,255,0.06) inset, 0 0 ${120 * glow}px rgba(99,102,241,${0.45 * glow})`,
        ...style,
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 72, overflow: 'hidden', backgroundColor: colors.canvas }}>
        <div style={{ position: 'absolute', top: 18, left: '50%', width: 150, height: 42, marginLeft: -75, borderRadius: 42, backgroundColor: '#000', zIndex: 40 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 44px 0', fontSize: 22, fontWeight: 600, color: colors.fg }}>
          <span>9:41</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ width: 30, height: 14, borderRadius: 4, border: `2px solid ${colors.fg}`, position: 'relative' }}>
              <span style={{ position: 'absolute', inset: 2, right: 8, borderRadius: 2, backgroundColor: colors.fg }} />
            </span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Small uppercase label above big headlines. */
export function Kicker({ children, p = 1 }: { children: ReactNode; p?: number }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 22px',
        borderRadius: 999,
        border: '1.5px solid rgba(129,140,248,0.35)',
        backgroundColor: 'rgba(79,70,229,0.12)',
        color: '#C7D2FE',
        fontSize: 28,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        opacity: p,
        transform: `translateY(${(1 - p) * 16}px)`,
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: 10, backgroundColor: colors.accentSoft }} />
      {children}
    </div>
  );
}

/** Light sweep across the frame on a hit; adds polish to hard cuts. */
export function Flash({ at, duration = 10 }: { at: number; duration?: number }) {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 2, at + duration], [0, 0.35, 0], clamp);
  return <AbsoluteFill style={{ backgroundColor: '#C7D2FE', opacity: o, mixBlendMode: 'overlay', pointerEvents: 'none' }} />;
}
