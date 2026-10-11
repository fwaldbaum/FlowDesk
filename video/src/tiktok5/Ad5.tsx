import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  AlarmClock, AtSign, Bell, FileSpreadsheet, Globe, Mail, MessageCircle, NotebookPen, Plug, StickyNote, SquareKanban, Users,
} from 'lucide-react';
import { colors, fontFamily } from '../theme';
import { clamp, Cursor, FPS, gradientText, LogoMark, sp } from '../tiktok/kit';

/**
 * Track 5 is a fast "edit" sound: "Love me!" every ~2.3 s, triple "Jump!" hits in between,
 * then "Welcome to the morgue", "Uh oh" and "Get it! Get it!". Every cue below was snapped to
 * a detected onset, so each word on screen lands exactly on the sound.
 */
export const AD5_SECONDS = 18.96;
export const AD5_DURATION = Math.ceil(AD5_SECONDS * FPS);
const s = (t: number) => Math.round(t * FPS);

const LOVE = [0.12, 2.41, 4.69, 6.98, 9.26, 11.56, 13.84, 16.14];
const JUMPS = [
  [1.28, 1.58, 1.86],
  [3.58, 3.85, 4.13],
  [5.85, 6.13, 6.43],
];
const MORGUE = [7.85, 8.36, 8.66];
const MONTAGE = [11.56, 12.14, 12.7, 13.28, 13.84, 14.42];
const HITS = [...LOVE, ...JUMPS.flat(), ...MORGUE, 10.4, 10.98, ...MONTAGE, 15.56, 15.84, 16.72, 17.28, 17.55].sort((a, b) => a - b);

const hype: CSSProperties = { fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95, textTransform: 'uppercase' };

/** 1 on a hit, decaying over ~8 frames. Uses absolute frames. */
function useKick(absFrame: number) {
  const last = HITS.reduce((acc, h) => (absFrame >= s(h) ? s(h) : acc), -999);
  return interpolate(absFrame - last, [0, 8], [1, 0], clamp);
}

// ---- Look ---------------------------------------------------------------------------

function Backdrop() {
  const frame = useCurrentFrame();
  const kick = useKick(frame);
  const morgue = interpolate(frame, [s(7.7), s(7.9), s(10.9), s(11.0)], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: '#06070C' }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 40% at 50% 40%, rgba(99,102,241,${(0.28 + kick * 0.18) * (1 - morgue)}), transparent 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 40% at 50% 70%, rgba(120,130,150,${0.16 * morgue}), transparent 70%)` }} />
      <AbsoluteFill
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 4px)',
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  );
}

/** Camera punch + shake + RGB split on every hit: the "edit" feel. */
function Punch({ children, offset }: { children: ReactNode; offset: number }) {
  const frame = useCurrentFrame();
  const kick = useKick(frame + offset);
  const shakeX = Math.sin((frame + offset) * 5.3) * 10 * kick;
  const shakeY = Math.cos((frame + offset) * 4.1) * 8 * kick;
  const split = 7 * kick;
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${1 + 0.07 * kick}) translate(${shakeX}px, ${shakeY}px)`,
        filter: split > 0.3 ? `drop-shadow(${split}px 0 0 rgba(255,40,90,0.55)) drop-shadow(${-split}px 0 0 rgba(40,200,255,0.55))` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

function WhiteFlash() {
  const frame = useCurrentFrame();
  const big = [6.98, 9.26, 10.98, 15.56, 17.28].map(s);
  const last = big.reduce((acc, h) => (frame >= h ? h : acc), -999);
  const o = interpolate(frame - last, [0, 1, 6], [0, 0.55, 0], clamp);
  return <AbsoluteFill style={{ backgroundColor: '#fff', opacity: o, pointerEvents: 'none' }} />;
}

function Slam({ text, at, size = 170, style }: { text: ReactNode; at: number; size?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = sp(frame, at, { damping: 11, mass: 0.5 });
  return (
    <div style={{ ...hype, fontSize: size, textAlign: 'center', transform: `scale(${1.6 - 0.6 * Math.min(p, 1)})`, opacity: Math.min(1, p * 2), ...style }}>
      {text}
    </div>
  );
}

function Scene({ children, start }: { children: ReactNode; start: number }) {
  return (
    <AbsoluteFill style={{ fontFamily, color: colors.fg }}>
      <Punch offset={start}>{children}</Punch>
    </AbsoluteFill>
  );
}

// ---- Jumping card across a row of "places" --------------------------------------------

type Spot = { icon: typeof MessageCircle; label: string; color: string };

function JumpRow({ spots, jumps, start, card }: { spots: Spot[]; jumps: number[]; start: number; card: ReactNode }) {
  const frame = useCurrentFrame();
  const local = jumps.map((t) => s(t) - start);
  const idx = local.reduce((acc, f, i) => (frame >= f ? i + 1 : acc), 0);
  const from = Math.max(0, idx - 1);
  const t = idx === 0 ? 0 : interpolate(frame, [local[idx - 1]!, local[idx - 1]! + 7], [0, 1], clamp);
  const pos = idx === 0 ? 0 : from + t;
  const slotX = (i: number) => 90 + i * 300;
  const x = slotX(Math.min(pos, spots.length - 1));
  const arc = Math.sin(t * Math.PI) * 120;
  const squash = idx > 0 && t > 0.85 ? 1 - (1 - t) * 1.2 : 1;
  return (
    <div style={{ position: 'relative', width: 1080, height: 640 }}>
      {spots.map((sp_, i) => {
        const Icon = sp_.icon;
        const lit = Math.round(pos) === i;
        return (
          <div key={sp_.label} style={{ position: 'absolute', left: slotX(i), top: 410, width: 300 - 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 150, height: 150, borderRadius: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${sp_.color}${lit ? '33' : '14'}`, border: `3px solid ${sp_.color}${lit ? 'AA' : '44'}`, transform: `scale(${lit ? 1.08 : 1})` }}>
              <Icon size={78} color={sp_.color} strokeWidth={2} />
            </span>
            <span style={{ fontSize: 34, fontWeight: 700, color: lit ? colors.fg : colors.subtle }}>{sp_.label}</span>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: x - 40, top: 150 - arc, transform: `rotate(${(t - 0.5) * 18 * (idx > 0 ? 1 : 0)}deg) scale(${1 / squash}, ${squash})`, transformOrigin: '50% 100%' }}>{card}</div>
    </div>
  );
}

function LeadChip({ name = 'Camila', sub = '¿precio?' }: { name?: string; sub?: string }) {
  return (
    <div style={{ width: 340, padding: '22px 26px', borderRadius: 26, backgroundColor: colors.surface, border: '3px solid rgba(129,140,248,0.85)', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.9)' }}>
      <div style={{ fontSize: 38, fontWeight: 700 }}>{name}</div>
      <div style={{ fontSize: 28, color: colors.muted, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

// ---- A. "Tus leads saltan" (0–2.35) ---------------------------------------------------

function SceneA() {
  return (
    <Scene start={0}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 260 }}>
        <Slam text="Tus leads" at={s(0.12)} size={150} />
        <Slam text={<span style={gradientText}>saltan</span>} at={s(0.6)} size={190} />
        <div style={{ marginTop: 90 }}>
          <JumpRow
            start={0}
            jumps={JUMPS[0]!}
            card={<LeadChip />}
            spots={[
              { icon: MessageCircle, label: 'WhatsApp', color: '#25D366' },
              { icon: AtSign, label: 'Instagram', color: '#E1306C' },
              { icon: Mail, label: 'Correo', color: '#EA4335' },
            ]}
          />
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- B. "de app en app" (2.35–4.65) -----------------------------------------------------

function SceneB() {
  const start = s(2.35);
  return (
    <Scene start={start}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 260 }}>
        <Slam text="de app" at={s(2.41) - start} size={160} />
        <Slam text={<span style={gradientText}>en app</span>} at={s(2.66) - start} size={190} />
        <div style={{ marginTop: 90 }}>
          <JumpRow
            start={start}
            jumps={JUMPS[1]!}
            card={<LeadChip sub="cotización" />}
            spots={[
              { icon: FileSpreadsheet, label: 'Excel', color: '#0F9D58' },
              { icon: NotebookPen, label: 'Notas', color: '#A5B4FC' },
              { icon: StickyNote, label: 'Post-it', color: '#FCD34D' },
            ]}
          />
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- C. "y nadie les responde" (4.65–6.95) ------------------------------------------------

function SceneC() {
  const start = s(4.65);
  const frame = useCurrentFrame();
  const counts = [12, 27, 48];
  const local = JUMPS[2]!.map((t) => s(t) - start);
  const idx = local.reduce((acc, f, i) => (frame >= f ? i : acc), -1);
  const n = idx < 0 ? 5 : counts[idx]!;
  const pop = idx < 0 ? 0 : interpolate(frame - local[idx]!, [0, 6], [1, 0], clamp);
  return (
    <Scene start={start}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 260 }}>
        <Slam text="Y nadie" at={s(4.69) - start} size={160} />
        <Slam text="les responde" at={s(4.88) - start} size={130} style={{ color: '#FCA5A5' }} />
        <div style={{ marginTop: 90, position: 'relative', width: 420, height: 420, borderRadius: 110, backgroundColor: 'rgba(37,211,102,0.12)', border: '4px solid rgba(37,211,102,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageCircle size={230} color="#25D366" strokeWidth={1.6} />
          <div style={{ position: 'absolute', right: -50, top: -50, minWidth: 190, height: 190, padding: '0 30px', boxSizing: 'border-box', borderRadius: 190, backgroundColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 104, fontWeight: 900, transform: `scale(${1 + pop * 0.35})`, boxShadow: '0 20px 50px -10px rgba(239,68,68,0.8)' }}>
            {n}
          </div>
        </div>
        <div style={{ marginTop: 60, fontSize: 44, fontWeight: 700, color: colors.muted }}>mensajes sin responder</div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- D. "Welcome to the morgue" (6.95–9.4) ------------------------------------------------

const TOMBS = [
  { t: 'Camila', s: '3 días en visto', at: 8.36, x: 70, r: -4 },
  { t: '$4.100', s: 'cotización sin enviar', at: 8.66, x: 390, r: 3 },
  { t: 'Tomás', s: 'nadie lo llamó', at: 9.0, x: 710, r: -2 },
];

function SceneD() {
  const start = s(6.95);
  const frame = useCurrentFrame();
  return (
    <Scene start={start}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 260 }}>
        <Slam text="Bienvenido al" at={s(7.85) - start} size={110} style={{ color: colors.muted }} />
        <Slam text={<>cementerio<br />de leads</>} at={s(8.36) - start} size={128} />
      </AbsoluteFill>
      {frame < s(7.85) - start && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 200 }}>
          <Slam text="Resultado:" at={s(6.98) - start} size={150} />
        </AbsoluteFill>
      )}
      {TOMBS.map((tb) => {
        const at = s(tb.at) - start;
        const p = sp(frame, at, { damping: 13, mass: 0.6 });
        if (frame < at) return null;
        return (
          <div key={tb.t} style={{ position: 'absolute', left: tb.x, top: 1020 + (1 - Math.min(p, 1)) * 400, width: 300, height: 420, borderRadius: '150px 150px 20px 20px', background: 'linear-gradient(180deg,#3A3F4B 0%,#22252D 100%)', border: '3px solid #4B5160', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 70, boxSizing: 'border-box', transform: `rotate(${tb.r}deg)`, boxShadow: '0 40px 60px -20px rgba(0,0,0,0.9)' }}>
            <span style={{ fontSize: 50, fontWeight: 900, color: '#9CA3AF', letterSpacing: '0.1em' }}>RIP</span>
            <span style={{ fontSize: 44, fontWeight: 800, marginTop: 18, color: '#E5E7EB' }}>{tb.t}</span>
            <span style={{ fontSize: 26, color: '#9CA3AF', marginTop: 10, textAlign: 'center', padding: '0 20px' }}>{tb.s}</span>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1400, height: 520, background: 'linear-gradient(180deg, #14161D 0%, #06070C 100%)', borderTop: '3px solid #2A2E38' }} />
    </Scene>
  );
}

// ---- E. "Love me! … Uh oh" → reveal (9.4–11.5) ---------------------------------------------

function SceneE() {
  const start = s(9.4);
  const frame = useCurrentFrame();
  const revealAt = s(10.98) - start;
  const spin = interpolate(frame, [s(10.4) - start, revealAt], [0, 1], clamp);
  const logo = sp(frame, revealAt, { damping: 11, mass: 0.5 });
  const ring = interpolate(frame, [revealAt, revealAt + 16], [0, 1], clamp);
  const revealed = frame >= revealAt;
  return (
    <Scene start={start}>
      {!revealed && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 260 }}>
          <Slam text="Hasta que" at={0} size={150} />
          <Slam text="llegó…" at={s(10.4) - start} size={170} style={{ ...gradientText }} />
          <div style={{ marginTop: 60, opacity: spin, transform: `rotate(${spin * 360}deg) scale(${0.3 + spin * 0.5})` }}>
            <LogoMark size={160} id="ad5-spin" />
          </div>
        </AbsoluteFill>
      )}
      {revealed && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 220 }}>
          <div style={{ position: 'absolute', top: 960 - 220 - 200, width: 400, height: 400, borderRadius: 400, border: '5px solid rgba(165,180,252,0.8)', transform: `scale(${1 + ring * 3})`, opacity: 1 - ring }} />
          <div style={{ width: 320, height: 320, borderRadius: 88, backgroundColor: '#0B0F17', border: `3px solid ${colors.lineStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 160px -10px rgba(99,102,241,0.9)', transform: `scale(${Math.min(logo, 1.1)})` }}>
            <LogoMark size={210} id="ad5-logo" />
          </div>
          <div style={{ ...hype, textTransform: 'none', fontSize: 200, marginTop: 50, transform: `scale(${1.5 - 0.5 * Math.min(logo, 1)})` }}>
            <span style={{ fontWeight: 900 }}>Flow</span>
            <span style={{ fontWeight: 500 }}>Desk</span>
          </div>
        </AbsoluteFill>
      )}
    </Scene>
  );
}

// ---- F. Montage (11.5–15.5): one feature per beat ---------------------------------------------

const SLIDES = [
  { icon: SquareKanban, a: 'Todos tus leads', b: 'en un tablero', c: '#818CF8' },
  { icon: Bell, a: 'Te avisa', b: 'al instante', c: '#A5B4FC' },
  { icon: AlarmClock, a: 'Sabes a quién', b: 'llamar hoy', c: '#FCD34D' },
  { icon: MessageCircle, a: 'WhatsApp', b: 'en 1 clic', c: '#25D366' },
  { icon: Users, a: 'Tu equipo', b: 'en vivo', c: '#22D3EE' },
  { icon: Plug, a: '+20', b: 'integraciones', c: '#F472B6' },
];

function SceneF() {
  const start = s(11.5);
  const frame = useCurrentFrame();
  const local = MONTAGE.map((t) => s(t) - start);
  const i = local.reduce((acc, f, k) => (frame >= f ? k : acc), 0);
  const sl = SLIDES[i]!;
  const p = sp(frame, local[i]!, { damping: 12, mass: 0.5 });
  const Icon = sl.icon;
  return (
    <Scene start={start}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 260 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 70 }}>
          {SLIDES.map((_, k) => (
            <span key={k} style={{ width: k === i ? 60 : 18, height: 18, borderRadius: 18, backgroundColor: k <= i ? sl.c : colors.lineStrong }} />
          ))}
        </div>
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${1.4 - 0.4 * Math.min(p, 1)}) rotate(${(1 - Math.min(p, 1)) * (i % 2 ? 6 : -6)}deg)`, opacity: Math.min(1, p * 2) }}>
          <span style={{ width: 260, height: 260, borderRadius: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${sl.c}22`, border: `4px solid ${sl.c}88`, boxShadow: `0 0 120px -10px ${sl.c}99` }}>
            <Icon size={140} color={sl.c} strokeWidth={1.8} />
          </span>
          <div style={{ ...hype, fontSize: 130, marginTop: 70, textAlign: 'center' }}>{sl.a}</div>
          <div style={{ ...hype, fontSize: 130, textAlign: 'center', color: sl.c }}>{sl.b}</div>
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- G. CTA: "Get it! Get it!" (15.5–end) -----------------------------------------------------

function SceneG() {
  const start = s(15.5);
  const frame = useCurrentFrame();
  const url = sp(frame, s(16.72) - start, { damping: 11, mass: 0.5 });
  const punch = interpolate(frame, [s(17.28) - start, s(17.28) - start + 8], [1.12, 1], clamp);
  const tap = s(17.55) - start;
  const cur = sp(frame, tap - 10);
  const press = interpolate(frame, [tap - 2, tap, tap + 7], [0, 1, 0], clamp);
  const ring = interpolate(frame, [tap, tap + 16], [0, 1], clamp);
  return (
    <Scene start={start}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 300 }}>
        <div style={{ width: 180, height: 180, borderRadius: 50, backgroundColor: '#0B0F17', border: `3px solid ${colors.lineStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 110px -10px rgba(99,102,241,0.85)' }}>
          <LogoMark size={116} id="ad5-cta" />
        </div>
        <div style={{ marginTop: 60 }}>
          <Slam text="Pruébalo" at={s(15.56) - start} size={170} />
          <Slam text={<span style={gradientText}>gratis</span>} at={s(15.84) - start} size={210} />
        </div>
        <div style={{ position: 'relative', marginTop: 80, opacity: frame >= s(16.72) - start ? 1 : 0, transform: `scale(${(1.5 - 0.5 * Math.min(url, 1)) * punch * (1 - 0.04 * press)})` }}>
          {ring > 0 && ring < 1 && <div style={{ position: 'absolute', inset: -10, borderRadius: 40, border: '4px solid rgba(165,180,252,0.9)', transform: `scale(${1 + ring * 0.25})`, opacity: 1 - ring }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '34px 46px', borderRadius: 32, background: 'linear-gradient(180deg,#5B54F0 0%,#4F46E5 100%)', boxShadow: '0 30px 80px -20px rgba(79,70,229,0.95), inset 0 1px 0 rgba(255,255,255,0.2)', fontSize: 46, fontWeight: 700 }}>
            <Globe size={46} strokeWidth={2.2} /> flowdesk-ten-ruby.vercel.app
          </div>
          <div style={{ position: 'absolute', right: 40, top: 70, opacity: Math.min(1, cur * 2) }}>
            <Cursor x={interpolate(cur, [0, 1], [160, 0])} y={interpolate(cur, [0, 1], [200, 0])} press={press} />
          </div>
        </div>
        <div style={{ marginTop: 50, fontSize: 40, fontWeight: 700, color: colors.muted, opacity: frame >= s(17.28) - start ? 1 : 0 }}>
          Sin tarjeta · listo en minutos
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

const TIMELINE: [() => JSX.Element, number, number | null][] = [
  [SceneA, 0, 2.35],
  [SceneB, 2.35, 4.65],
  [SceneC, 4.65, 6.95],
  [SceneD, 6.95, 9.4],
  [SceneE, 9.4, 11.5],
  [SceneF, 11.5, 15.5],
  [SceneG, 15.5, null],
];

export function TikTokAd5() {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Backdrop />
      {TIMELINE.map(([Comp, from, to], i) => {
        const start = s(from);
        const end = to === null ? durationInFrames : s(to);
        return (
          <Sequence key={i} from={start} durationInFrames={end - start}>
            <Comp />
          </Sequence>
        );
      })}
      <WhiteFlash />
      <Audio src={staticFile('audio/track5.mp3')} volume={(f) => interpolate(f, [durationInFrames - 15, durationInFrames - 1], [1, 0], clamp)} />
    </AbsoluteFill>
  );
}

