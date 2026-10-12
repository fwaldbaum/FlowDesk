import type { CSSProperties } from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { Plus } from 'lucide-react';
import { colors, fontFamily } from '../theme';
import { clamp, FPS, LogoMark, sp } from '../tiktok/kit';
import narration from './narration.json';

/**
 * Horizontal product tour (YouTube style) shown as the welcome video for new accounts.
 * Footage is the real app recorded with Playwright (public/tour/clips), framed in a browser
 * window with a camera that zooms into each action, chapter titles, a chapter bar and
 * word-highlighted subtitles so it also works muted (the welcome popup autoplays muted).
 */
type NarrationKey = keyof typeof narration;
type Shot = { clip: string; from: number; to: number; rate: number; zoom: [number, number]; focus: [[number, number], [number, number]] };
type Chapter = { title: string; path: string; shots: Shot[]; voice: NarrationKey[] };

const s = (t: number) => Math.round(t * FPS);
const shotFrames = (sh: Shot) => s((sh.to - sh.from) / sh.rate);

const CHAPTERS: Chapter[] = [
  {
    title: 'Tablero de ventas',
    path: '/app',
    voice: ['board'],
    shots: [{ clip: 'board', from: 2.5, to: 15.5, rate: 1.75, zoom: [1, 1.24], focus: [[960, 540], [1010, 420]] }],
  },
  {
    title: 'Nuevo lead',
    path: '/app',
    voice: ['newlead'],
    shots: [
      { clip: 'newlead', from: 2.0, to: 5.6, rate: 1.4, zoom: [1.1, 1.5], focus: [[960, 540], [960, 440]] },
      { clip: 'newlead', from: 17.6, to: 23.0, rate: 1.5, zoom: [1.5, 1.18], focus: [[960, 600], [820, 430]] },
    ],
  },
  {
    title: 'Ficha y WhatsApp',
    path: '/app',
    voice: ['detail'],
    shots: [
      { clip: 'detail', from: 1.8, to: 6.0, rate: 1.3, zoom: [1, 1.35], focus: [[960, 540], [1300, 470]] },
      { clip: 'detail', from: 8.0, to: 14.5, rate: 2.2, zoom: [1.6, 1.7], focus: [[1600, 640], [1600, 660]] },
      { clip: 'detail', from: 17.0, to: 21.3, rate: 1.5, zoom: [1.55, 1.7], focus: [[1600, 300], [1560, 260]] },
    ],
  },
  {
    title: 'Vista Hoy',
    path: '/app/hoy',
    voice: ['today'],
    shots: [{ clip: 'today', from: 1.3, to: 10.7, rate: 1.4, zoom: [1, 1.26], focus: [[960, 540], [1080, 420]] }],
  },
  {
    title: 'Formulario web',
    path: '/app/configuracion',
    voice: ['settings', 'live'],
    shots: [
      { clip: 'settings', from: 1.5, to: 9.8, rate: 1.6, zoom: [1, 1.28], focus: [[960, 540], [1100, 600]] },
      { clip: 'form', from: 5.6, to: 9.9, rate: 1.3, zoom: [1.2, 1.3], focus: [[960, 560], [960, 600]] },
      { clip: 'live', from: 9.7, to: 12.6, rate: 1, zoom: [1, 1.05], focus: [[960, 540], [980, 560]] },
    ],
  },
  {
    title: 'Integraciones',
    path: '/app/integraciones',
    voice: ['integrations'],
    shots: [
      { clip: 'integrations', from: 1.6, to: 8.6, rate: 1.5, zoom: [1, 1.22], focus: [[960, 540], [1120, 460]] },
      { clip: 'integrations', from: 8.6, to: 13.6, rate: 1.5, zoom: [1.3, 1.36], focus: [[1100, 480], [1100, 540]] },
    ],
  },
  {
    title: 'Importar contactos',
    path: '/app/contactos',
    voice: ['contacts'],
    shots: [
      { clip: 'contacts', from: 1.8, to: 6.4, rate: 1.3, zoom: [1, 1.3], focus: [[960, 540], [960, 460]] },
      { clip: 'contacts', from: 11.2, to: 13.4, rate: 1.1, zoom: [1.4, 1.45], focus: [[960, 500], [960, 500]] },
      { clip: 'contacts', from: 16.6, to: 19.0, rate: 1, zoom: [1.2, 1.15], focus: [[1000, 420], [1000, 440]] },
    ],
  },
];

const INTRO = s(5.6);
const OUTRO = s(6.6);
const GAP = 0.25; // seconds of breath before each narration line

// Each chapter lasts as long as its footage, or its narration if that runs longer.
const TIMELINE = (() => {
  let at = INTRO;
  return CHAPTERS.map((ch) => {
    const footage = ch.shots.reduce((n, sh) => n + shotFrames(sh), 0);
    const voice = ch.voice.reduce((n, k) => n + s(narration[k].duration + GAP), 0) + s(0.5);
    const start = at;
    const length = Math.max(footage, voice);
    at += length;
    return { ...ch, start, length };
  });
})();

export const TOUR_DURATION = TIMELINE[TIMELINE.length - 1]!.start + TIMELINE[TIMELINE.length - 1]!.length + OUTRO;

// Browser window geometry on the 1920x1080 canvas.
const WIN = { left: 192, top: 132, w: 1536, h: 864, bar: 38 };
const FOOT_SCALE = WIN.w / 1920;
const ease = Easing.bezier(0.45, 0, 0.2, 1);

function Footage({ shot, length }: { shot: Shot; length: number }) {
  const frame = useCurrentFrame();
  const k = ease(interpolate(frame, [0, Math.min(length, s(1.1))], [0, 1], clamp));
  const drift = interpolate(frame, [0, length], [0, 0.025], clamp);
  const z = shot.zoom[0] + (shot.zoom[1] - shot.zoom[0]) * k + drift;
  const fx = shot.focus[0][0] + (shot.focus[1][0] - shot.focus[0][0]) * k;
  const fy = shot.focus[0][1] + (shot.focus[1][1] - shot.focus[0][1]) * k;
  // Keep the camera inside the recording.
  const ox = Math.min(Math.max(fx - 960 / z, 0), 1920 - 1920 / z);
  const oy = Math.min(Math.max(fy - 540 / z, 0), 1080 - 1080 / z);
  return (
    <AbsoluteFill style={{ width: 1920, height: 1080, transformOrigin: '0 0', transform: `scale(${FOOT_SCALE * z}) translate(${-ox}px, ${-oy}px)` }}>
      <OffthreadVideo
        src={staticFile(`tour/clips/${shot.clip}.mp4`)}
        trimBefore={s(shot.from)}
        playbackRate={shot.rate}
        muted
        style={{ width: 1920, height: 1080 }}
      />
    </AbsoluteFill>
  );
}

function BrowserWindow({ path, children, style }: { path: string; children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        position: 'absolute', left: WIN.left, top: WIN.top - WIN.bar, width: WIN.w, height: WIN.h + WIN.bar,
        borderRadius: 18, overflow: 'hidden', border: `1px solid ${colors.lineStrong}`, backgroundColor: colors.canvas,
        boxShadow: '0 40px 120px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.03)', ...style,
      }}
    >
      <div style={{ height: WIN.bar, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', backgroundColor: '#11151F', borderBottom: `1px solid ${colors.line}` }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <div key={c} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c, opacity: 0.85 }} />
        ))}
        <div style={{ margin: '0 auto', padding: '5px 18px', borderRadius: 8, backgroundColor: colors.canvas, border: `1px solid ${colors.line}`, fontFamily, fontSize: 15, color: colors.muted, transform: 'translateX(-30px)' }}>
          flowdesk-ten-ruby.vercel.app<span style={{ color: colors.subtle }}>{path}</span>
        </div>
      </div>
      <div style={{ position: 'relative', width: WIN.w, height: WIN.h, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

function Background() {
  return (
    <AbsoluteFill style={{ backgroundColor: '#07090F' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 55%, rgba(79,70,229,0.16), transparent 70%)' }} />
    </AbsoluteFill>
  );
}

/** Top-left chapter heading. */
function ChapterTitle({ index, title }: { index: number; title: string }) {
  const frame = useCurrentFrame();
  const p = sp(frame, 2, { damping: 18 });
  return (
    <div style={{ position: 'absolute', left: WIN.left, top: 34, display: 'flex', alignItems: 'center', gap: 14, fontFamily, opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 14}px)` }}>
      <div style={{ padding: '4px 10px', borderRadius: 8, backgroundColor: 'rgba(79,70,229,0.18)', border: '1px solid rgba(129,140,248,0.35)', color: '#C7D2FE', fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {String(index + 1).padStart(2, '0')}
      </div>
      <div style={{ color: colors.fg, fontSize: 32, fontWeight: 650, letterSpacing: '-0.02em' }}>{title}</div>
    </div>
  );
}

function Brand({ opacity = 1 }: { opacity?: number }) {
  return (
    <div style={{ position: 'absolute', right: WIN.left, top: 38, display: 'flex', alignItems: 'center', gap: 10, fontFamily, fontSize: 24, color: colors.fg, opacity }}>
      <LogoMark size={30} id="tour-brand" />
      <span><b style={{ fontWeight: 750 }}>Flow</b><span style={{ fontWeight: 500 }}>Desk</span></span>
    </div>
  );
}

/** YouTube-like chapter bar under the window. */
function ChapterBar({ opacity }: { opacity: number }) {
  const frame = useCurrentFrame();
  const total = TIMELINE.reduce((n, c) => n + c.length, 0);
  const gap = 6;
  const usable = WIN.w - gap * (TIMELINE.length - 1);
  let x = WIN.left;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity }}>
      {TIMELINE.map((c, i) => {
        const w = (c.length / total) * usable;
        const left = x;
        x += w + gap;
        const fill = interpolate(frame, [c.start, c.start + c.length], [0, 1], clamp);
        const active = frame >= c.start && frame < c.start + c.length;
        return (
          <div key={c.title} style={{ position: 'absolute', left, top: 1020, width: w }}>
            <div style={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{ width: `${fill * 100}%`, height: '100%', backgroundColor: active ? '#818CF8' : '#4F46E5' }} />
            </div>
            <div style={{ marginTop: 10, fontFamily, fontSize: 15, fontWeight: active ? 600 : 500, color: active ? colors.fg : colors.subtle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.title}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type Line = { key: NarrationKey; at: number };
const LINES: Line[] = [
  { key: 'intro', at: s(0.5) },
  ...TIMELINE.flatMap((c) => {
    let at = c.start + s(GAP);
    return c.voice.map((key, i) => {
      // The second form line waits for the live footage, which starts after the settings shot.
      if (c.title === 'Formulario web' && i === 1) at = Math.max(at, c.start + shotFrames(c.shots[0]!) + s(0.15));
      const line = { key, at };
      at += s(narration[key].duration + GAP);
      return line;
    });
  }),
  { key: 'outro', at: TIMELINE[TIMELINE.length - 1]!.start + TIMELINE[TIMELINE.length - 1]!.length + s(0.6) },
];

/** Splits a line into short caption chunks, breaking after punctuation when possible. */
function chunks(words: { w: string; start: number; end: number }[]) {
  const out: (typeof words)[] = [];
  let cur: typeof words = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= 7 || (/[.,:?!]$/.test(w.w) && cur.length >= 3)) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

function Subtitles() {
  const frame = useCurrentFrame();
  for (const line of LINES) {
    const n = narration[line.key];
    const t = (frame - line.at) / FPS;
    if (t < -0.05 || t > n.duration + 0.15) continue;
    const parts = chunks(n.words);
    const idx = parts.findIndex((c, i) => t < (parts[i + 1]?.[0]?.start ?? Infinity) - 0.02);
    const part = parts[Math.max(0, idx)]!;
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, top: 900, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 1300, padding: '12px 22px', borderRadius: 12, backgroundColor: 'rgba(7,9,15,0.84)', border: '1px solid rgba(255,255,255,0.08)', fontFamily, fontSize: 34, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.25, textAlign: 'center' }}>
          {part.map((w, i) => (
            <span key={i} style={{ color: t >= w.start - 0.03 ? colors.fg : 'rgba(243,244,246,0.45)' }}>
              {w.w}
              {i < part.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

function Intro() {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [4, 34], [0, 1], { ...clamp, easing: ease });
  const head = sp(frame, 10, { damping: 16 });
  const sub = sp(frame, 22, { damping: 18 });
  const out = interpolate(frame, [s(3.4), s(4.4)], [0, 1], { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: colors.fg, opacity: 1 - out, transform: `translateY(${-out * 80}px)` }}>
      <div style={{ width: 132, height: 132, borderRadius: 34, backgroundColor: colors.canvas, border: `1px solid ${colors.lineStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 90px -20px rgba(99,102,241,0.8)' }}>
        <LogoMark size={84} draw={draw} id="tour-intro" />
      </div>
      <div style={{ marginTop: 40, fontSize: 84, fontWeight: 750, letterSpacing: '-0.04em', opacity: Math.min(1, head * 1.5), transform: `translateY(${(1 - head) * 24}px)` }}>
        Te damos la bienvenida
      </div>
      <div style={{ marginTop: 16, fontSize: 32, color: colors.muted, opacity: Math.min(1, sub * 1.5), transform: `translateY(${(1 - sub) * 18}px)` }}>
        Lo mejor que puedes hacer, en un minuto
      </div>
    </AbsoluteFill>
  );
}

function Outro() {
  const frame = useCurrentFrame();
  const logo = sp(frame, s(0.5), { damping: 14 });
  const head = sp(frame, s(0.7), { damping: 16 });
  const btn = sp(frame, s(1.1), { damping: 14 });
  const press = interpolate(frame, [s(2.6), s(2.7), s(2.9)], [0, 1, 0], clamp);
  const ring = interpolate(frame, [s(2.7), s(3.3)], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: colors.fg }}>
      <div style={{ transform: `scale(${Math.min(logo, 1.06)})`, opacity: Math.min(1, logo * 2) }}>
        <LogoMark size={96} id="tour-outro" />
      </div>
      <div style={{ marginTop: 34, fontSize: 76, fontWeight: 750, letterSpacing: '-0.04em', opacity: Math.min(1, head * 1.5), transform: `translateY(${(1 - head) * 24}px)` }}>
        Ahora te toca a ti
      </div>
      <div style={{ marginTop: 14, fontSize: 30, color: colors.muted, opacity: Math.min(1, head * 1.5) }}>
        Crea tu primer lead y empieza a vender más ordenado.
      </div>
      <div style={{ position: 'relative', marginTop: 54, opacity: Math.min(1, btn * 1.5), transform: `scale(${(0.85 + 0.15 * Math.min(btn, 1.04)) * (1 - 0.04 * press)})` }}>
        {ring > 0 && ring < 1 && (
          <div style={{ position: 'absolute', inset: -8, borderRadius: 18, border: '3px solid rgba(165,180,252,0.9)', transform: `scale(${1 + ring * 0.18})`, opacity: 1 - ring }} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 34px', borderRadius: 14, backgroundColor: colors.accent, boxShadow: '0 24px 60px -18px rgba(79,70,229,0.9), inset 0 1px 0 rgba(255,255,255,0.18)', fontSize: 30, fontWeight: 650 }}>
          <Plus size={30} strokeWidth={2.4} /> Crear mi primer lead
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function TourVideo() {
  const frame = useCurrentFrame();
  const last = TIMELINE[TIMELINE.length - 1]!;
  const outroAt = last.start + last.length;
  const current = TIMELINE.find((c) => frame >= c.start && frame < c.start + c.length);

  // Window rises in at the end of the intro and shrinks away for the outro.
  const rise = interpolate(frame, [s(3.7), INTRO], [0, 1], { ...clamp, easing: ease });
  const leave = interpolate(frame, [outroAt, outroAt + s(0.7)], [0, 1], { ...clamp, easing: ease });
  const winStyle: CSSProperties = {
    opacity: Math.min(rise, 1 - leave),
    transform: `translateY(${(1 - rise) * 260 + leave * 40}px) scale(${0.94 + 0.06 * rise - 0.06 * leave})`,
  };
  const chrome = Math.min(rise, 1 - leave);

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background />
      <Sequence durationInFrames={INTRO + s(0.2)}>
        <Intro />
      </Sequence>

      <BrowserWindow path={current?.path ?? '/app'} style={winStyle}>
        {/* Idle board behind the intro transition. */}
        <Sequence from={0} durationInFrames={INTRO}>
          <Footage shot={{ clip: 'board', from: 0, to: 2.5, rate: 0.45, zoom: [1, 1], focus: [[960, 540], [960, 540]] }} length={INTRO} />
        </Sequence>
        {TIMELINE.map((c) => {
          let at = c.start;
          return c.shots.map((sh, i) => {
            const from = at;
            const isLast = i === c.shots.length - 1;
            const len = isLast ? c.start + c.length - from : shotFrames(sh);
            at += shotFrames(sh);
            return (
              <Sequence key={`${c.title}-${i}`} from={from} durationInFrames={len}>
                <Footage shot={sh} length={len} />
              </Sequence>
            );
          });
        })}
        {/* Hold the last frame under the outro transition. */}
        <Sequence from={outroAt} durationInFrames={s(1)}>
          <Footage shot={{ ...CHAPTERS[CHAPTERS.length - 1]!.shots[2]!, from: 18.0, to: 19.0 }} length={s(1)} />
        </Sequence>
      </BrowserWindow>

      {TIMELINE.map((c, i) => (
        <Sequence key={c.title} from={c.start} durationInFrames={c.length}>
          <ChapterTitle index={i} title={c.title} />
        </Sequence>
      ))}
      <Brand opacity={chrome} />
      <ChapterBar opacity={chrome} />
      <Subtitles />

      <Sequence from={outroAt}>
        <Outro />
      </Sequence>

      {LINES.map((l) => (
        <Sequence key={l.key} from={l.at}>
          <Audio src={staticFile(`tour/${l.key}.mp3`)} />
        </Sequence>
      ))}
      <Audio
        src={staticFile('tour/music.mp3')}
        volume={(f) => {
          // Duck under the voice with short ramps instead of hard switches.
          const duck = Math.max(0, ...LINES.map((l) => {
            const end = l.at + s(narration[l.key].duration);
            return interpolate(f, [l.at - 10, l.at, end, end + 14], [0, 1, 1, 0], clamp);
          }));
          return (0.32 - 0.17 * duck) * interpolate(f, [TOUR_DURATION - s(1.5), TOUR_DURATION - 1], [1, 0], clamp);
        }}
      />
    </AbsoluteFill>
  );
}
