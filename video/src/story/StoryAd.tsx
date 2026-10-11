import type { CSSProperties } from 'react';
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Globe } from 'lucide-react';
import { colors, fontFamily } from '../theme';
import { clamp, Cursor, FPS, LogoMark, sp } from '../tiktok/kit';
import narration from './narration.json';

/**
 * "La historia de Matías": Veo clips (public/story/clips.mp4, already cropped to 9:16), a
 * fast lifestyle montage cut on the music's beats (public/story/lux.mp4), the es-MX Jorge
 * narration (public/story/narration.wav, word timings in narration.json) and a FlowDesk CTA.
 * Hard limit: 25 seconds.
 */
export const STORY_SECONDS = 25;
export const STORY_DURATION = STORY_SECONDS * FPS;
const s = (t: number) => Math.round(t * FPS);

const STARTS = narration.starts;
const MUSIC_BEATS = [15.63, 16.09, 16.58, 17.04, 17.53, 18.0, 18.46, 18.92, 19.41, 19.88, 20.34, 20.78, 21.29, 21.76, 22.22];
const LUX_FROM = MUSIC_BEATS[0]!;
const CTA_FROM = 22.22;

/** Story shots: [absolute start (s), offset into clips.mp4 (s)]. Cuts follow the narration. */
const STORY_SHOTS: [number, number][] = [
  [0, 0.2], // rubbing his eyes, messages on "seen"
  [STARTS[1]! - 0.1, 6.0], // staring at the phone
  [STARTS[2]! - 0.1, 15.3], // the mentor
  [STARTS[3]! - 0.1, 25.4], // laptop, ordering everything
  [STARTS[4]! - 0.1, 38.2], // notifications start arriving, surprised
  [13.9, 42.4], // golden notifications, huge smile
];

/** One lifestyle shot per music beat; offsets into lux.mp4. */
const LUX_OFFSETS = [0.2, 1.7, 3.2, 4.7, 6.2, 7.7, 9.2, 10.7, 12.2, 13.7, 15.2, 16.7, 19.7, 22.6];

const KEY_WORDS = ['clientes', 'desorden', 'flowdesk', 'gratis', 'soñó', 'parar'];

function Shot({ src, offset, duration, zoom = 0.06, punch = false }: { src: string; offset: number; duration: number; zoom?: number; punch?: boolean }) {
  const frame = useCurrentFrame();
  const slow = interpolate(frame, [0, duration], [1, 1 + zoom], clamp);
  const kick = punch ? interpolate(frame, [0, 6], [1.12, 1], clamp) : 1;
  return (
    <AbsoluteFill style={{ transform: `scale(${slow * kick})` }}>
      <OffthreadVideo src={staticFile(src)} startFrom={s(offset)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </AbsoluteFill>
  );
}

function Flash({ at, peak = 0.5, length = 6 }: { at: number; peak?: number; length?: number }) {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [s(at), s(at) + 1, s(at) + length], [0, peak, 0], clamp);
  return <AbsoluteFill style={{ backgroundColor: '#fff', opacity: o, pointerEvents: 'none' }} />;
}

/** Word-by-word glowing caption, timed by the TTS word boundaries. */
function Captions() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const ctaWords = narration.words.filter((w) => w.line === 6);
  const current = narration.words.find((w, i) => {
    const next = narration.words[i + 1];
    const until = next && next.line === w.line ? next.start : w.end + 0.25;
    return t >= w.start - 0.03 && t < until;
  });
  if (!current || ctaWords.includes(current)) return null;
  const p = sp(frame, s(current.start), { damping: 12, mass: 0.45 });
  const clean = current.w.replace(/[.,:…¿?¡!]/g, '');
  const key = KEY_WORDS.includes(clean.toLowerCase());
  const style: CSSProperties = {
    fontFamily,
    fontSize: clean.length > 9 ? 112 : 132,
    fontWeight: 900,
    letterSpacing: '-0.02em',
    textTransform: 'uppercase',
    color: key ? '#C7D2FE' : '#fff',
    textShadow: key
      ? '0 0 18px rgba(129,140,248,0.95), 0 0 46px rgba(99,102,241,0.85), 0 6px 18px rgba(0,0,0,0.7)'
      : '0 0 16px rgba(255,255,255,0.85), 0 0 40px rgba(255,255,255,0.45), 0 6px 18px rgba(0,0,0,0.75)',
    transform: `scale(${0.75 + 0.25 * Math.min(p, 1.08)})`,
    opacity: Math.min(1, p * 2),
  };
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
      <div style={style}>{clean}</div>
    </AbsoluteFill>
  );
}

function Grade() {
  // Light vignette + bottom gradient so captions always read, like the reference edits.
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', background: 'radial-gradient(ellipse 90% 75% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
  );
}

function Cta() {
  const frame = useCurrentFrame();
  const logo = sp(frame, 0, { damping: 12, mass: 0.6 });
  const head = sp(frame, 6, { damping: 13 });
  const url = sp(frame, 16, { damping: 13 });
  const tap = 48;
  const cur = sp(frame, tap - 12);
  const press = interpolate(frame, [tap - 2, tap, tap + 7], [0, 1, 0], clamp);
  const ring = interpolate(frame, [tap, tap + 16], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ fontFamily, color: colors.fg, backgroundColor: '#07080D', alignItems: 'center', paddingTop: 360 }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 42% at 50% 40%, rgba(99,102,241,0.42), transparent 70%)' }} />
      <div style={{ width: 230, height: 230, borderRadius: 62, backgroundColor: '#0B0F17', border: `2px solid ${colors.lineStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 120px -10px rgba(99,102,241,0.9)', transform: `scale(${Math.min(logo, 1.08)})` }}>
        <LogoMark size={150} id="story-cta" />
      </div>
      <div style={{ fontSize: 170, letterSpacing: '-0.055em', marginTop: 50, opacity: Math.min(1, head * 2), transform: `translateY(${(1 - Math.min(head, 1)) * 40}px)` }}>
        <span style={{ fontWeight: 800 }}>Flow</span>
        <span style={{ fontWeight: 500 }}>Desk</span>
      </div>
      <div style={{ fontSize: 50, fontWeight: 700, marginTop: 14, color: '#C7D2FE', textShadow: '0 0 24px rgba(129,140,248,0.8)', opacity: Math.min(1, head * 2) }}>EMPIEZA GRATIS HOY</div>
      <div style={{ position: 'relative', marginTop: 70, opacity: Math.min(1, url * 1.5), transform: `scale(${(0.75 + 0.25 * Math.min(url, 1.04)) * (1 - 0.04 * press)})` }}>
        {ring > 0 && ring < 1 && <div style={{ position: 'absolute', inset: -10, borderRadius: 40, border: '4px solid rgba(165,180,252,0.9)', transform: `scale(${1 + ring * 0.25})`, opacity: 1 - ring }} />}
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

export function StoryAd() {
  const { durationInFrames } = useVideoConfig();
  const storyEnd = LUX_FROM;
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {STORY_SHOTS.map(([at, offset], i) => {
        const next = STORY_SHOTS[i + 1]?.[0] ?? storyEnd;
        const d = s(next) - s(at);
        return (
          <Sequence key={`st${i}`} from={s(at)} durationInFrames={d}>
            <Shot src="story/clips.mp4" offset={offset} duration={d} punch={i > 0} />
          </Sequence>
        );
      })}
      {LUX_OFFSETS.map((offset, i) => {
        const at = MUSIC_BEATS[i]!;
        const next = MUSIC_BEATS[i + 1] ?? CTA_FROM;
        const d = s(next) - s(at);
        return (
          <Sequence key={`lx${i}`} from={s(at)} durationInFrames={d}>
            <Shot src="story/lux.mp4" offset={offset} duration={d} zoom={0.1} punch />
          </Sequence>
        );
      })}
      <Grade />
      <Sequence from={s(CTA_FROM)}>
        <Cta />
      </Sequence>
      <Captions />
      <Flash at={LUX_FROM} peak={0.8} length={8} />
      <Flash at={CTA_FROM} peak={0.6} length={8} />
      <Audio src={staticFile('story/narration.wav')} />
      <Audio
        src={staticFile('audio/story-music.mp3')}
        volume={(f) => {
          const t = f / FPS;
          const base = t < LUX_FROM - 0.2 ? 0.22 : t < CTA_FROM ? 0.85 : 0.45;
          const swell = interpolate(t, [LUX_FROM - 0.6, LUX_FROM], [0, 1], clamp);
          const level = t < LUX_FROM - 0.6 ? 0.22 : t < LUX_FROM ? 0.22 + (0.85 - 0.22) * swell : base;
          return level * interpolate(f, [durationInFrames - 20, durationInFrames - 1], [1, 0], clamp);
        }}
      />
    </AbsoluteFill>
  );
}
