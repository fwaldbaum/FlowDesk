import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, fontFamily } from '../theme';
import { BEATS } from './beats';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

/** Absolute frame of beat `i`. */
export const bf = (i: number) => Math.round(BEATS[i]! * FPS);

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/**
 * 1 right on a beat, decaying to 0 before the next one. `offset` is the absolute frame where the
 * current sequence starts, so scenes can pulse in sync with the song.
 */
export function usePulse(offset: number, every = 1, beats: readonly number[] = BEATS) {
  const frame = useCurrentFrame() + offset;
  let last = -Infinity;
  for (let i = 0; i < beats.length; i += every) {
    const f = beats[i]! * FPS;
    if (f > frame) break;
    last = f;
  }
  return interpolate(frame - last, [0, 9], [1, 0], clamp);
}

/** Spring without hooks, for use inside loops and conditionals. */
export function sp(frame: number, delay: number, config: Parameters<typeof spring>[0]['config'] = { damping: 200 }) {
  return spring({ frame: frame - delay, fps: FPS, config });
}

export function useIn(delay: number, config: Parameters<typeof spring>[0]['config'] = { damping: 200 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
}

/** Every scene starts on a beat with a short punch-in, the way motion-graphics edits cut. */
export function Cut({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 7], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  return (
    <AbsoluteFill
      style={{
        fontFamily,
        color: colors.fg,
        transform: `scale(${1.08 - 0.08 * p})`,
        filter: `blur(${(1 - p) * 14}px)`,
        opacity: Math.min(1, p * 1.6),
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

export function Backdrop({ offset, tint = 'rgba(79,70,229,0.28)' }: { offset: number; tint?: string }) {
  const frame = useCurrentFrame() + offset;
  const pulse = usePulse(offset);
  const drift = Math.sin(frame / 50) * 60;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.canvas }}>
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(38,45,61,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(38,45,61,0.5) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          backgroundPosition: `0 ${(frame * 0.6) % 72}px`,
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 45%, #000 20%, transparent 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 38% at ${50 + drift / 20}% 38%, ${tint}, transparent 70%)`,
          opacity: 0.75 + pulse * 0.25,
        }}
      />
    </AbsoluteFill>
  );
}

/** Big kinetic headline: each word lands on its own frame. */
export function Words({
  words,
  at,
  size = 140,
  accent = [],
  align = 'center',
  weight = 700,
  style,
}: {
  words: string[];
  at: number[];
  size?: number;
  accent?: number[];
  align?: 'center' | 'left';
  weight?: number;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: weight,
        letterSpacing: '-0.05em',
        lineHeight: 1.02,
        textAlign: align,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const p = spring({ frame: frame - (at[i] ?? 0), fps, config: { damping: 16, mass: 0.6 } });
        const shown = frame >= (at[i] ?? 0);
        return (
          <span
            key={`${w}-${i}`}
            style={{
              display: 'inline-block',
              marginRight: '0.22em',
              opacity: shown ? Math.min(1, p * 1.5) : 0,
              transform: `translateY(${(1 - p) * 0.5 * size}px) scale(${0.9 + 0.1 * Math.min(p, 1)})`,
              filter: `blur(${Math.max(0, 1 - p) * 12}px)`,
              ...(accent.includes(i) ? gradientText : null),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}

export const gradientText: CSSProperties = {
  backgroundImage: 'linear-gradient(100deg, #A5B4FC 0%, #818CF8 45%, #60A5FA 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  paddingBottom: '0.08em',
};

export function Pill({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 26px',
        borderRadius: 999,
        border: `1.5px solid ${colors.lineStrong}`,
        backgroundColor: 'rgba(22,27,38,0.85)',
        fontSize: 32,
        fontWeight: 500,
        color: colors.muted,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** App-like window frame used for the product shots. */
export function Window({ children, style, title }: { children: ReactNode; style?: CSSProperties; title?: string }) {
  return (
    <div
      style={{
        borderRadius: 34,
        border: `2px solid ${colors.lineStrong}`,
        backgroundColor: colors.canvas,
        boxShadow: '0 80px 160px -40px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.03) inset',
        overflow: 'hidden',
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            height: 76,
            padding: '0 28px',
            borderBottom: `1.5px solid ${colors.line}`,
            backgroundColor: 'rgba(22,27,38,0.7)',
            fontSize: 30,
            fontWeight: 600,
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

export function LogoMark({ size, draw = 1, id = 'fd-logo-tt' }: { size: number; draw?: number; id?: string }) {
  const paths = [
    { d: 'M5 26V13a7 7 0 0 1 7-7h5', len: 28 },
    { d: 'M5 16.5h7.5', len: 8 },
    { d: 'M17 6a10 10 0 0 1 0 20h-4.5V12', len: 50 },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id={id} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${id})`} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {paths.map((p) => (
          <path key={p.d} d={p.d} strokeDasharray={p.len} strokeDashoffset={p.len * (1 - draw)} />
        ))}
      </g>
    </svg>
  );
}

export function Cursor({ x, y, label, color = colors.accent, press = 0 }: { x: number; y: number; label?: string; color?: string; press?: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: 50, transform: `scale(${1 - 0.12 * press})`, transformOrigin: '0 0' }}>
      <svg width="54" height="54" viewBox="0 0 18 18" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))' }}>
        <path d="M2 1.5 15.5 8.2 9.4 9.6 6.6 15.4Z" fill={color === colors.accent ? '#818CF8' : color} stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
      {label && (
        <span
          style={{
            display: 'inline-block',
            marginLeft: 34,
            marginTop: -10,
            padding: '6px 16px',
            borderRadius: 10,
            backgroundColor: color,
            fontSize: 26,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            color: '#fff',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
