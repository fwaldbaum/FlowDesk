import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Globe } from 'lucide-react';
import { colors, fontFamily, stages } from '../theme';
import { clamp, Cursor, FPS, LogoMark, sp, Window } from '../tiktok/kit';

/**
 * "Cómo hacerse millonario… en 3 pasos": the trend format over lifestyle b-roll
 * (public/rich/lux2.mp4) cut on the beats of public/audio/rich-music.mp3 (~83 BPM, 14.3 s).
 * Each step is real sales advice and the payoff is FlowDesk; the subtitle keeps it tongue
 * in cheek instead of promising money.
 */
export const RICH_SECONDS = 14.28;
export const RICH_DURATION = Math.round(RICH_SECONDS * FPS);
const s = (t: number) => Math.round(t * FPS);

const B = [0.09, 0.81, 1.53, 2.28, 3.0, 3.72, 4.44, 5.15, 5.87, 6.59, 7.31, 8.03, 8.75, 9.47, 10.19, 10.91, 11.63, 12.35, 13.07];
const GOLD = '#F5C451';

/** [absolute start, offset into lux2.mp4]; every cut lands on a beat. */
const SHOTS: [number, number][] = [
  [0, 0.1], // man with his car
  [B[1]!, 0.92], // red supercar at night
  [B[2]!, 2.38], // G-wagon
  [B[3]!, 3.01], // helicopter over the bay
  [B[4]!, 3.68], // hotel hallway
  [B[5]!, 4.44], // Rolls-Royce
  [B[6]!, 5.04], // mansion
  [B[7]!, 5.74], // Bugatti
  [B[8]!, 6.44], // cash
  [B[9]!, 7.18], // jewelry
  [B[10]!, 8.47], // watch
  [B[11]!, 8.88], // car at night
]
const REVEAL = B[12]!;
const CTA = B[16]!;

const STEPS = [
  { n: 1, at: B[3]!, words: ['Responde', 'a', 'cada', 'cliente', 'en', 'minutos.'], key: [5] },
  { n: 2, at: B[6]!, words: ['No', 'dejes', 'ningún', 'seguimiento', 'para', 'mañana.'], key: [3] },
  { n: 3, at: B[9]!, words: ['Cierra', 'ventas', 'todas', 'las', 'semanas.'], key: [1] },
];

const glow: CSSProperties = { textShadow: '0 0 18px rgba(255,255,255,0.55), 0 6px 22px rgba(0,0,0,0.85)' };
const goldGlow: CSSProperties = { color: GOLD, textShadow: '0 0 20px rgba(245,196,81,0.75), 0 6px 22px rgba(0,0,0,0.85)' };

function Shot({ offset, duration }: { offset: number; duration: number }) {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, duration], [1.04, 1.12], clamp);
  const kick = interpolate(frame, [0, 5], [1.1, 1], clamp);
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom * kick})` }}>
      <OffthreadVideo src={staticFile('rich/lux2.mp4')} startFrom={s(offset)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </AbsoluteFill>
  );
}

/** Darkens the footage so white text always reads. */
function Shade({ strength = 0.45 }: { strength?: number }) {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, rgba(0,0,0,${strength}) 0%, rgba(0,0,0,${strength * 0.35}) 40%, rgba(0,0,0,${strength * 0.35}) 60%, rgba(0,0,0,${strength}) 100%)`,
      }}
    />
  );
}

function PopWords({ words, at, keys = [], size = 96, every = 3 }: { words: string[]; at: number; keys?: number[]; size?: number; every?: number }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ textAlign: 'center', fontFamily, fontWeight: 900, fontSize: size, lineHeight: 1.05, letterSpacing: '-0.035em', textTransform: 'uppercase', padding: '0 60px' }}>
      {words.map((w, i) => {
        const start = at + i * every;
        const p = sp(frame, start, { damping: 12, mass: 0.45 });
        return (
          <span key={i} style={{ display: 'inline-block', marginRight: '0.22em', opacity: frame >= start ? Math.min(1, p * 2) : 0, transform: `scale(${0.7 + 0.3 * Math.min(p, 1.08)})`, ...(keys.includes(i) ? goldGlow : { color: '#fff', ...glow }) }}>
            {w}
          </span>
        );
      })}
    </div>
  );
}

function Hook() {
  const frame = useCurrentFrame();
  const sub = sp(frame, s(1.53), { damping: 14 });
  const out = interpolate(frame, [s(2.2), s(2.28)], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 200, opacity: out }}>
      <PopWords words={['Cómo', 'hacerse']} at={s(0.09)} size={118} />
      <PopWords words={['millonario']} at={s(0.81)} keys={[0]} size={150} />
      <div style={{ marginTop: 26, fontFamily, fontSize: 40, fontWeight: 700, color: '#fff', opacity: Math.min(1, sub * 1.5), ...glow }}>
        en 3 pasos <span style={{ opacity: 0.75, fontWeight: 500 }}>(o al menos, dejar de perder clientes)</span>
      </div>
    </AbsoluteFill>
  );
}

function Step({ n, words, keys }: { n: number; words: string[]; keys: number[] }) {
  const frame = useCurrentFrame();
  const chip = sp(frame, 0, { damping: 11, mass: 0.5 });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 200 }}>
      <div style={{ fontFamily, fontSize: 44, fontWeight: 900, letterSpacing: '0.12em', color: '#111', backgroundColor: GOLD, padding: '12px 32px', borderRadius: 999, marginBottom: 34, transform: `scale(${Math.min(chip, 1.1)})`, boxShadow: '0 0 40px rgba(245,196,81,0.6)' }}>
        PASO {n}
      </div>
      <PopWords words={words} at={4} keys={keys} size={92} />
    </AbsoluteFill>
  );
}

function MiniBoard() {
  const frame = useCurrentFrame();
  const cards: [number, string, string][] = [
    [0, 'Valentina Rojas', '$1.800'],
    [0, 'Tomás Herrera', '$4.200'],
    [1, 'Martín Vidal', '$8.900'],
    [2, 'Felipe Araya', '$2.600'],
  ];
  const move = sp(frame, 26, { damping: 18 });
  return (
    <Window title="FlowDesk · Tablero" style={{ width: 940 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: 18, height: 420, boxSizing: 'border-box', position: 'relative' }}>
        {[stages[0], stages[2], stages[3]].map((st) => (
          <div key={st.id} style={{ borderRadius: 18, border: '2px solid rgba(38,45,61,0.9)', backgroundColor: 'rgba(22,27,38,0.5)', padding: 12, color: colors.fg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
              <span style={{ width: 11, height: 11, borderRadius: 11, backgroundColor: st.color }} /> {st.label}
            </div>
          </div>
        ))}
        {cards.map(([col, name, value], i) => {
          const p = sp(frame, 4 + i * 4, { damping: 14 });
          const isMover = i === 3;
          const colIdx = isMover ? 1 + move : col === 1 ? 1 : col;
          const row = col === 0 ? i : isMover ? (move > 0.5 ? 0 : 1) : 0;
          const x = 18 + 12 + colIdx * ((940 - 36 - 32) / 3 + 16);
          return (
            <div key={name} style={{ position: 'absolute', left: x, top: 70 + row * 112, width: (940 - 36 - 32) / 3 - 24, padding: '16px 16px', boxSizing: 'border-box', borderRadius: 14, backgroundColor: colors.surface, border: `2px solid ${isMover && move > 0.9 ? 'rgba(16,185,129,0.8)' : colors.line}`, color: colors.fg, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - Math.min(p, 1)) * -30}px)` }}>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{name}</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6, color: isMover && move > 0.9 ? '#6EE7B7' : colors.fg }}>{value}</div>
            </div>
          );
        })}
      </div>
    </Window>
  );
}

function Reveal() {
  const frame = useCurrentFrame();
  const board = sp(frame, 8, { damping: 16 });
  return (
    <AbsoluteFill style={{ fontFamily, color: '#fff', alignItems: 'center', paddingTop: 300 }}>
      <AbsoluteFill style={{ backgroundColor: 'rgba(5,6,10,0.72)', backdropFilter: 'blur(14px)' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 40% at 50% 45%, rgba(99,102,241,0.35), transparent 70%)' }} />
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <PopWords words={['El', 'secreto:']} at={0} size={84} />
        <PopWords words={['todos', 'tus', 'clientes', 'en', 'un', 'solo', 'lugar.']} at={6} keys={[2]} size={84} every={2} />
      </div>
      <div style={{ position: 'relative', marginTop: 60, opacity: Math.min(1, board * 1.5), transform: `translateY(${(1 - Math.min(board, 1)) * 120}px) perspective(1600px) rotateX(${(1 - Math.min(board, 1)) * 20}deg)` }}>
        <MiniBoard />
      </div>
    </AbsoluteFill>
  );
}

function Cta() {
  const frame = useCurrentFrame();
  const logo = sp(frame, 0, { damping: 12, mass: 0.6 });
  const head = sp(frame, 6, { damping: 13 });
  const url = sp(frame, s(12.35) - s(CTA), { damping: 13 });
  const tap = s(13.07) - s(CTA);
  const cur = sp(frame, tap - 10);
  const press = interpolate(frame, [tap - 2, tap, tap + 7], [0, 1, 0], clamp);
  const ring = interpolate(frame, [tap, tap + 16], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ fontFamily, color: colors.fg, backgroundColor: '#07080D', alignItems: 'center', paddingTop: 380 }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 42% at 50% 40%, rgba(245,196,81,0.18), transparent 70%)' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 36% at 50% 46%, rgba(99,102,241,0.35), transparent 70%)' }} />
      <div style={{ width: 220, height: 220, borderRadius: 60, backgroundColor: '#0B0F17', border: `2px solid ${colors.lineStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 120px -10px rgba(99,102,241,0.9)', transform: `scale(${Math.min(logo, 1.08)})` }}>
        <LogoMark size={145} id="rich-cta" />
      </div>
      <div style={{ fontSize: 168, letterSpacing: '-0.055em', marginTop: 46, opacity: Math.min(1, head * 2), transform: `translateY(${(1 - Math.min(head, 1)) * 40}px)` }}>
        <span style={{ fontWeight: 800 }}>Flow</span>
        <span style={{ fontWeight: 500 }}>Desk</span>
      </div>
      <div style={{ fontSize: 50, fontWeight: 800, marginTop: 10, letterSpacing: '0.06em', ...goldGlow, opacity: Math.min(1, head * 2) }}>EMPIEZA GRATIS HOY</div>
      <div style={{ position: 'relative', marginTop: 70, opacity: Math.min(1, url * 1.5), transform: `scale(${(0.75 + 0.25 * Math.min(url, 1.04)) * (1 - 0.04 * press)})` }}>
        {ring > 0 && ring < 1 && <div style={{ position: 'absolute', inset: -10, borderRadius: 40, border: `4px solid ${GOLD}`, transform: `scale(${1 + ring * 0.25})`, opacity: 1 - ring }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '34px 46px', borderRadius: 32, background: 'linear-gradient(180deg,#5B54F0 0%,#4F46E5 100%)', boxShadow: '0 30px 80px -20px rgba(79,70,229,0.95), inset 0 1px 0 rgba(255,255,255,0.2)', fontSize: 46, fontWeight: 700 }}>
          <Globe size={46} strokeWidth={2.2} /> flowdesk-ten-ruby.vercel.app
        </div>
        <div style={{ position: 'absolute', right: 40, top: 70, opacity: Math.min(1, cur * 2) }}>
          <Cursor x={interpolate(cur, [0, 1], [160, 0])} y={interpolate(cur, [0, 1], [200, 0])} press={press} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Flash({ at, peak = 0.55 }: { at: number; peak?: number }) {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [s(at), s(at) + 1, s(at) + 7], [0, peak, 0], clamp);
  return <AbsoluteFill style={{ backgroundColor: '#fff', opacity: o, pointerEvents: 'none' }} />;
}

function Seq({ from, to, children }: { from: number; to?: number; children: ReactNode }) {
  return (
    <Sequence from={s(from)} durationInFrames={to === undefined ? undefined : s(to) - s(from)}>
      {children}
    </Sequence>
  );
}

export function RichAd() {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {SHOTS.map(([at, offset], i) => {
        const next = SHOTS[i + 1]?.[0] ?? REVEAL;
        return (
          <Seq key={i} from={at} to={next}>
            <Shot offset={offset} duration={s(next) - s(at)} />
          </Seq>
        );
      })}
      {/* Blurred last shot behind the product reveal */}
      <Seq from={REVEAL} to={CTA}>
        <Shot offset={8.2} duration={s(CTA) - s(REVEAL)} />
      </Seq>
      <Shade />
      <Seq from={0} to={B[3]!}>
        <Hook />
      </Seq>
      {STEPS.map((st, i) => (
        <Seq key={st.n} from={st.at} to={STEPS[i + 1]?.at ?? REVEAL}>
          <Step n={st.n} words={st.words} keys={st.key} />
        </Seq>
      ))}
      <Seq from={REVEAL} to={CTA}>
        <Reveal />
      </Seq>
      <Seq from={CTA}>
        <Cta />
      </Seq>
      {[B[3]!, B[6]!, B[9]!, REVEAL, CTA].map((t) => <Flash key={t} at={t} />)}
      <Audio src={staticFile('audio/rich-music.mp3')} volume={(f) => interpolate(f, [durationInFrames - 10, durationInFrames - 1], [1, 0], clamp)} />
    </AbsoluteFill>
  );
}
