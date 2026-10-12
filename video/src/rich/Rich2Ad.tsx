import type { ReactNode } from 'react';
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, fontFamily } from '../theme';
import { clamp, FPS, sp } from '../tiktok/kit';
import { Phone } from '../tiktok2/parts';
import { Flash, GOLD, glow, goldGlow, PopWords, Reveal, Shade, Step } from './RichAd';

/**
 * Second "cómo hacerse millonario" cut: same three steps, a new 129 BPM track
 * (public/audio/rich2-music.mp3), the user's own cars up front (plates blurred in
 * public/rich2/*) and a DM call to action built on their screen recording of typing "Flow".
 */
export const RICH2_SECONDS = 22.71;
export const RICH2_DURATION = Math.round(RICH2_SECONDS * FPS);
const s = (t: number) => Math.round(t * FPS);

type Clip = { at: number; src: string; offset?: number; image?: boolean };

const CLIPS: Clip[] = [
  { at: 0, src: 'rich2/corvette.jpg', image: true },
  { at: 1.32, src: 'rich2/img3947b.mp4', offset: 0.15 },
  { at: 2.25, src: 'rich2/img3948b.mp4', offset: 2.55 },
  // Paso 1
  { at: 3.13, src: 'rich/lux2.mp4', offset: 3.01 },
  { at: 4.06, src: 'rich/lux2.mp4', offset: 3.68 },
  { at: 4.97, src: 'rich/lux2.mp4', offset: 4.44 },
  { at: 5.87, src: 'rich/lux2.mp4', offset: 0.92 },
  // Paso 2
  { at: 6.32, src: 'rich/lux2.mp4', offset: 5.04 },
  { at: 7.24, src: 'rich/lux2.mp4', offset: 5.74 },
  { at: 8.15, src: 'rich/lux2.mp4', offset: 6.44 },
  { at: 9.06, src: 'rich/lux2.mp4', offset: 2.38 },
  // Paso 3
  { at: 9.52, src: 'rich/lux2.mp4', offset: 7.18 },
  { at: 10.43, src: 'rich2/img3947b.mp4', offset: 0.9 },
  { at: 11.33, src: 'rich/lux2.mp4', offset: 8.47 },
  { at: 12.24, src: 'rich2/corvette.jpg', image: true },
];
const STEPS = [
  { n: 1, at: 3.13, words: ['Responde', 'a', 'cada', 'cliente', 'en', 'minutos.'], keys: [5] },
  { n: 2, at: 6.32, words: ['No', 'dejes', 'ningún', 'seguimiento', 'para', 'mañana.'], keys: [3] },
  { n: 3, at: 9.52, words: ['Cierra', 'ventas', 'todas', 'las', 'semanas.'], keys: [1] },
];
const REVEAL = 12.68;
const DM = 15.88;

function ClipView({ clip, duration }: { clip: Clip; duration: number }) {
  const frame = useCurrentFrame();
  const zoom = clip.image ? interpolate(frame, [0, duration], [1.45, 1.65], clamp) : interpolate(frame, [0, duration], [1.04, 1.12], clamp);
  const kick = interpolate(frame, [0, 5], [1.1, 1], clamp);
  const style = { width: '100%', height: '100%', objectFit: 'cover' as const };
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom * kick})`, transformOrigin: clip.image ? '58% 64%' : '50% 50%' }}>
      {clip.image ? <Img src={staticFile(clip.src)} style={style} /> : <OffthreadVideo src={staticFile(clip.src)} startFrom={s(clip.offset ?? 0)} muted style={style} />}
    </AbsoluteFill>
  );
}

function Hook() {
  const frame = useCurrentFrame();
  const sub = sp(frame, s(1.79), { damping: 14 });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 200 }}>
      <PopWords words={['Cómo', 'hacerse']} at={s(0.09)} size={118} />
      <PopWords words={['millonario']} at={s(0.88)} keys={[0]} size={150} />
      <div style={{ marginTop: 26, fontFamily, fontSize: 40, fontWeight: 700, color: '#fff', opacity: Math.min(1, sub * 1.5), ...glow }}>
        en 3 pasos <span style={{ opacity: 0.75, fontWeight: 500 }}>(o al menos, dejar de perder clientes)</span>
      </div>
    </AbsoluteFill>
  );
}

/** Call to action: "write FLOW and I'll send you the info", over the real DM recording. */
function DmCta() {
  const frame = useCurrentFrame();
  const phone = sp(frame, 4, { damping: 16 });
  const word = sp(frame, s(16.79) - s(DM), { damping: 10, mass: 0.5 });
  const pulse = interpolate((frame - (s(16.79) - s(DM))) % s(0.92), [0, 8], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ fontFamily, color: colors.fg, backgroundColor: '#07080D', alignItems: 'center' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 40% at 50% 20%, rgba(245,196,81,0.2), transparent 70%)' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 45% at 50% 70%, rgba(99,102,241,0.3), transparent 70%)' }} />
      <div style={{ position: 'relative', marginTop: 150, textAlign: 'center' }}>
        <PopWords words={['¿Quieres', 'la', 'info?']} at={0} size={84} every={3} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, marginTop: 6 }}>
          <PopWords words={['Escríbeme']} at={s(16.35) - s(DM)} size={84} />
          <div
            style={{
              fontWeight: 900,
              fontSize: 92,
              letterSpacing: '-0.02em',
              padding: '2px 24px',
              borderRadius: 26,
              border: `5px solid ${GOLD}`,
              ...goldGlow,
              boxShadow: `0 0 ${30 + pulse * 40}px rgba(245,196,81,${0.35 + pulse * 0.3})`,
              opacity: frame >= s(16.79) - s(DM) ? Math.min(1, word * 2) : 0,
              transform: `scale(${(1.6 - 0.6 * Math.min(word, 1)) * (1 + pulse * 0.04)}) rotate(-3deg)`,
            }}
          >
            FLOW
          </div>
        </div>
        <div style={{ marginTop: 22, fontSize: 36, fontWeight: 600, color: 'rgba(255,255,255,0.8)', opacity: interpolate(frame, [s(17.4) - s(DM), s(17.7) - s(DM)], [0, 1], clamp) }}>
          por DM y te mando el link para empezar gratis
        </div>
      </div>
      <div style={{ position: 'relative', marginTop: 40, transform: `translateY(${(1 - Math.min(phone, 1)) * 600}px) scale(1.45) rotate(${(1 - Math.min(phone, 1)) * 6}deg)`, transformOrigin: '50% 0%' }}>
        <Phone glow={0.6}>
          <AbsoluteFill style={{ top: 0 }}>
            <OffthreadVideo src={staticFile('rich2/screen.mp4')} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </AbsoluteFill>
        </Phone>
      </div>
    </AbsoluteFill>
  );
}

function Seq({ from, to, children }: { from: number; to?: number; children: ReactNode }) {
  return (
    <Sequence from={s(from)} durationInFrames={to === undefined ? undefined : s(to) - s(from)}>
      {children}
    </Sequence>
  );
}

export function Rich2Ad() {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {CLIPS.map((c, i) => {
        const next = CLIPS[i + 1]?.at ?? REVEAL;
        return (
          <Seq key={i} from={c.at} to={next}>
            <ClipView clip={c} duration={s(next) - s(c.at)} />
          </Seq>
        );
      })}
      <Seq from={REVEAL} to={DM}>
        <ClipView clip={{ at: REVEAL, src: 'rich/lux2.mp4', offset: 8.2 }} duration={s(DM) - s(REVEAL)} />
      </Seq>
      <Shade />
      <Seq from={0} to={3.13}>
        <Hook />
      </Seq>
      {STEPS.map((st, i) => (
        <Seq key={st.n} from={st.at} to={STEPS[i + 1]?.at ?? REVEAL}>
          <Step n={st.n} words={st.words} keys={st.keys} />
        </Seq>
      ))}
      <Seq from={REVEAL} to={DM}>
        <Reveal />
      </Seq>
      <Seq from={DM}>
        <DmCta />
      </Seq>
      {[3.13, 6.32, 9.52, REVEAL, DM].map((t) => <Flash key={t} at={t} />)}
      <Audio src={staticFile('audio/rich2-music.mp3')} volume={(f) => interpolate(f, [durationInFrames - 15, durationInFrames - 1], [1, 0], clamp)} />
    </AbsoluteFill>
  );
}
