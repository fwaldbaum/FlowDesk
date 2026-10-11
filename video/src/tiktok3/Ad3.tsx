import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  AtSign, Check, FileSpreadsheet, Globe, Mail, Megaphone, MessageCircle, Music2, NotebookPen, Phone as PhoneIcon,
  ShoppingBag, StickyNote, Target, Workflow,
} from 'lucide-react';
import { colors, fontFamily, stages } from '../theme';
import { clamp, Cursor, FPS, gradientText, LogoMark, sp, Window, Words } from '../tiktok/kit';
import { Kicker } from '../tiktok2/parts';

/** Soft white bloom on a hit; tuned for the near-black noir backdrop. */
function Flash({ at, duration = 10 }: { at: number; duration?: number }) {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 2, at + duration], [0, 0.22, 0], clamp);
  return <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 45%, rgba(199,210,254,0.9), transparent 75%)', opacity: o, pointerEvents: 'none' }} />;
}

/**
 * Track 3 opens with the "Smooth Criminal" hook, so the ad plays a case file: someone is stealing
 * your sales, the culprit is the mess, FlowDesk closes the case. Times are seconds measured on the
 * track (lyrics with faster-whisper, hits with librosa onsets).
 */
export const AUDIO3_DURATION = 24.74;
export const AD3_DURATION = Math.ceil(AUDIO3_DURATION * FPS);
const s = (t: number) => Math.round(t * FPS);

const HITS = [1.21, 3.02, 7.45, 8.66, 9.85, 11.03, 12.24, 13.42, 14.61, 17.0, 18.78, 19.83, 20.57, 21.76];
const RED = '#F87171';

// ---- Shared look -------------------------------------------------------------------

function Grain() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 12} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
}

/** Noir backdrop: a soft spotlight that drifts, red before the reveal and indigo after it. */
function Noir() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const solved = interpolate(frame, [s(7.3), s(7.7)], [0, 1], clamp);
  const hit = HITS.reduce((acc, h) => (frame >= s(h) ? s(h) : acc), -999);
  const kick = interpolate(frame - hit, [0, 10], [1, 0], clamp);
  const x = 50 + Math.sin(t / 1.7) * 14;
  const red = `rgba(248,113,113,${0.16 * (1 - solved)})`;
  const indigo = `rgba(99,102,241,${0.34 * solved})`;
  return (
    <AbsoluteFill style={{ backgroundColor: '#05060A' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 42% 60% at ${x}% 18%, rgba(255,255,255,${0.09 + kick * 0.05}), transparent 70%)`,
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 40% at 50% 45%, ${red}, transparent 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 42% at 50% 42%, ${indigo}, transparent 72%)`, opacity: 0.8 + kick * 0.2 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 90% 75% at 50% 45%, transparent 50%, rgba(0,0,0,0.7) 100%)' }} />
    </AbsoluteFill>
  );
}

function Scene({ children, from = 'zoom' }: { children: ReactNode; from?: 'zoom' | 'right' }) {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 7], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const transform = from === 'right' ? `translateX(${(1 - p) * 260}px)` : `scale(${1.06 - 0.06 * p})`;
  return (
    <AbsoluteFill style={{ fontFamily, color: colors.fg, opacity: p, transform, filter: `blur(${(1 - p) * 12}px)` }}>
      {children}
    </AbsoluteFill>
  );
}

const big: CSSProperties = { fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 1 };

// ---- 1. Hook: "You've been hit by" ---------------------------------------------------

function Hook() {
  const frame = useCurrentFrame();
  const shake = frame >= s(1.21) ? Math.sin(frame * 3) * interpolate(frame, [s(1.21), s(1.21) + 8], [12, 0], clamp) : 0;
  return (
    <Scene>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 200, transform: `translateX(${shake}px)` }}>
        <Words words={['Te', 'están', 'robando']} at={[s(0.1), s(0.45), s(0.78)]} size={150} />
        <div style={{ ...big, fontSize: 230, color: RED, marginTop: 6, opacity: frame >= s(1.21) ? 1 : 0, transform: `scale(${1 + interpolate(frame, [s(1.21), s(1.21) + 6], [0.25, 0], clamp)})` }}>
          clientes.
        </div>
      </AbsoluteFill>
      <Flash at={s(1.21)} />
    </Scene>
  );
}

// ---- 2. Evidence: "you've been struck by" -------------------------------------------

function Evidence() {
  const start = s(1.65);
  const frame = useCurrentFrame();
  const card = sp(frame, 0, { damping: 16 });
  const stampAt = s(3.02) - start;
  const stamp = sp(frame, stampAt, { damping: 10, mass: 0.5 });
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 330 }}>
        <Kicker p={card}>Evidencia #1</Kicker>
        <div style={{ position: 'relative', marginTop: 60, width: 880, transform: `translateY(${(1 - card) * 120}px) rotate(-2deg)`, opacity: Math.min(1, card * 1.5) }}>
          <div style={{ borderRadius: 34, overflow: 'hidden', border: '2px solid #22303A', backgroundColor: '#0B141A', boxShadow: '0 60px 120px -40px rgba(0,0,0,0.95)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '26px 30px', backgroundColor: '#1F2C33' }}>
              <span style={{ width: 70, height: 70, borderRadius: 70, backgroundColor: '#2A3942', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#E9EDEF' }}>CF</span>
              <div>
                <div style={{ fontSize: 36, fontWeight: 600, color: '#E9EDEF' }}>Camila Fuentes</div>
                <div style={{ fontSize: 24, color: '#8696A0' }}>últ. vez hace 3 días</div>
              </div>
            </div>
            <div style={{ padding: 34, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {['Hola! Vi su anuncio en Instagram', '¿Me envían la cotización? Necesito decidir esta semana'].map((m) => (
                <div key={m} style={{ maxWidth: '85%', padding: '22px 26px', borderRadius: 24, borderTopLeftRadius: 6, backgroundColor: '#202C33', color: '#E9EDEF', fontSize: 34, lineHeight: 1.35 }}>
                  {m}
                  <div style={{ textAlign: 'right', fontSize: 22, color: '#8696A0', marginTop: 4 }}>lun 10:42</div>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              right: -10,
              bottom: -60,
              padding: '18px 34px',
              border: `6px solid ${RED}`,
              borderRadius: 18,
              color: RED,
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: '0.04em',
              backgroundColor: 'rgba(5,6,10,0.75)',
              transform: `rotate(-9deg) scale(${frame >= stampAt ? 2.2 - 1.2 * Math.min(stamp, 1) : 0})`,
              opacity: frame >= stampAt ? Math.min(1, stamp * 2) : 0,
            }}
          >
            SIN RESPUESTA
          </div>
        </div>
      </AbsoluteFill>
      <Flash at={stampAt} />
    </Scene>
  );
}

// ---- 3. Culprit: "a smooth criminal" ------------------------------------------------

function Culprit() {
  const start = s(3.35);
  const frame = useCurrentFrame();
  const at = s(4.1) - start;
  const p = sp(frame, at, { damping: 13, mass: 0.6 });
  const light = interpolate(frame, [0, at, at + 8], [0.4, 0.4, 1], clamp);
  return (
    <Scene>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 30% at 50% 47%, rgba(255,255,255,${0.1 * light}), transparent 70%)` }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 200 }}>
        <Words words={['El', 'culpable:']} at={[0, 6]} size={110} weight={600} style={{ color: colors.muted }} />
        <div style={{ ...big, fontSize: 190, marginTop: 30, textAlign: 'center', opacity: Math.min(1, p * 1.5), transform: `scale(${0.7 + 0.3 * Math.min(p, 1.05)})`, filter: `blur(${Math.max(0, 1 - p) * 14}px)` }}>
          el
          <br />
          <span style={{ color: RED }}>desorden.</span>
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- 4. The mess converges ----------------------------------------------------------

const MESS = [
  { icon: FileSpreadsheet, label: 'clientes_v7_FINAL.xlsx', color: '#0F9D58', x: 90, y: 360, r: -8 },
  { icon: MessageCircle, label: '23 chats sin leer', color: '#25D366', x: 520, y: 520, r: 6 },
  { icon: StickyNote, label: 'llamar a ¿Pedro?', color: '#FCD34D', x: 120, y: 760, r: 5 },
  { icon: Mail, label: 'Re: Re: cotización', color: '#EA4335', x: 470, y: 980, r: -5 },
  { icon: NotebookPen, label: 'notas_ventas.txt', color: '#A5B4FC', x: 160, y: 1180, r: 7 },
  { icon: AtSign, label: 'DM: ¿precio?', color: '#E1306C', x: 560, y: 1290, r: -7 },
];

function Mess() {
  const start = s(5.15);
  const frame = useCurrentFrame();
  const pull = interpolate(frame, [s(6.6) - start, s(7.4) - start], [0, 1], { ...clamp, easing: (t) => t ** 3 });
  const words = ['Excel.', 'WhatsApp.', 'Post-its.', 'Correo.'];
  const wordAt = [5.09, 5.71, 6.29, 6.87].map((t) => s(t) - start);
  const current = wordAt.reduce((acc, f, i) => (frame >= f ? i : acc), 0);
  return (
    <Scene>
      {MESS.map((m, i) => {
        const p = sp(frame, i * 4, { damping: 14, mass: 0.6 });
        const Icon = m.icon;
        const float = Math.sin((frame + i * 20) / 14) * 14;
        const cx = 540 - 300;
        const cy = 900;
        return (
          <div
            key={m.label}
            style={{
              position: 'absolute',
              left: m.x + (cx - m.x) * pull,
              top: m.y + float + (cy - m.y) * pull,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '22px 28px',
              borderRadius: 24,
              backgroundColor: 'rgba(22,27,38,0.92)',
              border: `2px solid ${colors.lineStrong}`,
              fontSize: 34,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              opacity: Math.min(1, p * 1.5) * (1 - pull * 0.9),
              transform: `rotate(${m.r * (1 - pull) + pull * 180}deg) scale(${Math.min(p, 1) * (1 - pull * 0.8)})`,
            }}
          >
            <Icon size={40} color={m.color} /> {m.label}
          </div>
        );
      })}
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 420, opacity: 1 - pull }}>
        <div key={current} style={{ ...big, fontSize: 150, textShadow: '0 10px 40px rgba(0,0,0,0.9)', transform: `scale(${1 + interpolate(frame - wordAt[current]!, [0, 6], [0.15, 0], clamp)})` }}>
          {words[current]}
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- 5. Reveal: case closed ---------------------------------------------------------

function Reveal() {
  const frame = useCurrentFrame();
  const burst = interpolate(frame, [0, 22], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const logo = sp(frame, 0, { damping: 12, mass: 0.6 });
  const word = sp(frame, 6, { damping: 14 });
  const solvedAt = s(8.66) - s(7.45);
  const solved = sp(frame, solvedAt, { damping: 12, mass: 0.6 });
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 180 }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 640 - 160,
              width: 320,
              height: 320,
              borderRadius: 320,
              border: '3px solid rgba(165,180,252,0.6)',
              transform: `scale(${1 + burst * (3 + i * 2)})`,
              opacity: 1 - burst,
            }}
          />
        ))}
        <div style={{ width: 300, height: 300, borderRadius: 82, backgroundColor: '#0B0F17', border: `2px solid ${colors.lineStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 140px -10px rgba(99,102,241,0.8)', transform: `scale(${Math.min(logo, 1.08)})` }}>
          <LogoMark size={190} id="ad3-logo" />
        </div>
        <div style={{ fontSize: 190, letterSpacing: '-0.055em', lineHeight: 1, marginTop: 60, opacity: Math.min(1, word * 2), transform: `translateY(${(1 - Math.min(word, 1)) * 50}px)` }}>
          <span style={{ fontWeight: 800 }}>Flow</span>
          <span style={{ fontWeight: 500 }}>Desk</span>
        </div>
        <div
          style={{
            marginTop: 50,
            padding: '16px 36px',
            border: '5px solid #34D399',
            borderRadius: 16,
            color: '#6EE7B7',
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: '0.04em',
            transform: `rotate(-4deg) scale(${frame >= solvedAt ? 2 - Math.min(solved, 1) : 0})`,
            opacity: frame >= solvedAt ? Math.min(1, solved * 2) : 0,
          }}
        >
          CASO RESUELTO
        </div>
      </AbsoluteFill>
      <Flash at={0} />
      <Flash at={solvedAt} />
    </Scene>
  );
}

// ---- 6. Features: one per hit ---------------------------------------------------------

const FEATURE_HITS = [9.85, 11.03, 12.24, 13.42];
const FEATURES = [
  { a: 'Cada lead,', b: 'registrado.' },
  { a: 'Cada seguimiento,', b: 'a tiempo.' },
  { a: 'Cada cliente,', b: 'en un clic.' },
  { a: 'Todo tu equipo,', b: 'al día.' },
];

function FeatureVisual({ index, f }: { index: number; f: number }) {
  if (index === 0) {
    const leads = [
      { n: 'Camila Fuentes', s: 'Instagram', icon: AtSign, c: '#E1306C' },
      { n: 'Tomás Herrera', s: 'TikTok Ads', icon: Megaphone, c: '#FF3B6B' },
      { n: 'Valentina Rojas', s: 'Formulario web', icon: Globe, c: '#818CF8' },
    ];
    return (
      <Window title="Nuevo Lead">
        <div style={{ padding: 24 }}>
          {leads.map((l, i) => {
            const p = sp(f, 3 + i * 4, { damping: 15, mass: 0.6 });
            const Icon = l.icon;
            return (
              <div key={l.n} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 26px', marginBottom: 16, borderRadius: 22, backgroundColor: i === 0 ? '#1A1D33' : colors.surface, border: `2px solid ${i === 0 ? 'rgba(99,102,241,0.8)' : colors.line}`, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - Math.min(p, 1)) * -40}px)` }}>
                <span style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: `${l.c}22`, color: l.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={34} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 36, fontWeight: 600 }}>{l.n}</div>
                  <div style={{ fontSize: 26, color: colors.muted }}>{l.s} · justo ahora</div>
                </div>
              </div>
            );
          })}
        </div>
      </Window>
    );
  }
  if (index === 1) {
    const tasks = ['Enviar cotización a Camila', 'Llamar a Tomás', 'Confirmar reunión'];
    return (
      <Window title="Para hoy">
        {tasks.map((t, i) => {
          const done = f >= 6 + i * 7;
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '30px 34px', borderBottom: i < 2 ? `1.5px solid ${colors.line}` : 'none' }}>
              <span style={{ width: 50, height: 50, borderRadius: 50, border: `3px solid ${done ? '#34D399' : colors.lineStrong}`, backgroundColor: done ? '#34D399' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.canvas, flexShrink: 0 }}>
                {done && <Check size={30} strokeWidth={3.5} />}
              </span>
              <span style={{ fontSize: 36, fontWeight: 600, color: done ? colors.subtle : colors.fg, textDecoration: done ? 'line-through' : 'none' }}>{t}</span>
            </div>
          );
        })}
      </Window>
    );
  }
  if (index === 2) {
    const msg = 'Hola Camila, te envío la cotización. ¿La revisamos hoy?';
    const typed = Math.round(interpolate(f, [4, 26], [0, msg.length], clamp));
    return (
      <div style={{ borderRadius: 34, overflow: 'hidden', border: '2px solid #22303A', backgroundColor: '#0B141A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '24px 30px', backgroundColor: '#1F2C33' }}>
          <span style={{ width: 64, height: 64, borderRadius: 64, backgroundColor: '#2A3942', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#E9EDEF' }}>CF</span>
          <span style={{ fontSize: 34, fontWeight: 600, color: '#E9EDEF' }}>Camila Fuentes</span>
          <PhoneIcon size={30} color="#E9EDEF" style={{ marginLeft: 'auto' }} />
        </div>
        <div style={{ padding: 32, minHeight: 220 }}>
          <div style={{ marginLeft: 'auto', maxWidth: '86%', padding: '22px 26px', borderRadius: 24, borderTopRightRadius: 6, backgroundColor: '#005C4B', color: '#E9EDEF', fontSize: 34, lineHeight: 1.4 }}>
            {msg.slice(0, typed)}
            {typed >= msg.length && <div style={{ textAlign: 'right', fontSize: 22, opacity: 0.6, marginTop: 4 }}>ahora</div>}
          </div>
        </div>
      </div>
    );
  }
  const mates = [
    { n: 'Camila · Ventas', c: '#4F46E5', x: [80, 420], y: [80, 260] },
    { n: 'Matías · Soporte', c: '#0E7490', x: [520, 200], y: [300, 120] },
    { n: 'Ana · Gerencia', c: '#B45309', x: [300, 560], y: [420, 380] },
  ];
  return (
    <div style={{ position: 'relative' }}>
      <Window title="Tablero · 3 en línea">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: 22, height: 460, boxSizing: 'border-box' }}>
          {[stages[1], stages[2]].map((st) => (
            <div key={st.id} style={{ borderRadius: 22, border: '2px solid rgba(38,45,61,0.9)', backgroundColor: 'rgba(22,27,38,0.5)', padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 28, fontWeight: 600, marginBottom: 14 }}>
                <span style={{ width: 14, height: 14, borderRadius: 14, backgroundColor: st.color }} /> {st.label}
              </div>
              {[0, 1].map((k) => (
                <div key={k} style={{ height: 110, marginBottom: 14, borderRadius: 18, backgroundColor: colors.surface, border: `2px solid ${colors.line}` }} />
              ))}
            </div>
          ))}
        </div>
      </Window>
      {mates.map((m, i) => {
        const p = sp(f, 4 + i * 3, { damping: 20 });
        return <Cursor key={m.n} x={m.x[0]! + (m.x[1]! - m.x[0]!) * p} y={76 + m.y[0]! + (m.y[1]! - m.y[0]!) * p} label={m.n} color={m.c} />;
      })}
    </div>
  );
}

function Features() {
  const start = s(9.85);
  const frame = useCurrentFrame();
  const hits = FEATURE_HITS.map((t) => s(t) - start);
  const current = hits.reduce((acc, h, i) => (frame >= h ? i : acc), 0);
  const f = frame - hits[current]!;
  const p = sp(frame, hits[current]!, { damping: 16, mass: 0.6 });
  const x = (1 - Math.min(p, 1)) * (current === 0 ? 0 : 900);
  const item = FEATURES[current]!;
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 260, paddingLeft: 70, paddingRight: 70 }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 50 }}>
          {FEATURES.map((_, i) => (
            <span key={i} style={{ width: i === current ? 56 : 16, height: 16, borderRadius: 16, backgroundColor: i <= current ? colors.accentSoft : colors.lineStrong }} />
          ))}
        </div>
        <div key={current} style={{ width: '100%', transform: `translateX(${x}px)`, opacity: Math.min(1, p * 1.5), filter: `blur(${Math.max(0, 1 - p) * 10}px)` }}>
          <div style={{ ...big, fontSize: 112, textAlign: 'center' }}>
            {item.a}
            <br />
            <span style={gradientText}>{item.b}</span>
          </div>
          <div style={{ marginTop: 70 }}>
            <FeatureVisual index={current} f={f} />
          </div>
        </div>
      </AbsoluteFill>
      {hits.slice(1).map((h) => <Flash key={h} at={h} duration={8} />)}
    </Scene>
  );
}

// ---- 7. Pipeline: numbers that matter --------------------------------------------------

function Pipeline() {
  const frame = useCurrentFrame();
  const count = (to: number, delay: number) => Math.round(interpolate(frame, [delay, delay + 26], [0, to], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 }));
  const kpis = [
    { label: 'Pipeline abierto', value: `$${count(26150, 6).toLocaleString('es-CL')}` },
    { label: 'Ganado', value: `$${count(12500, 10).toLocaleString('es-CL')}`, green: true },
    { label: 'Tasa de cierre', value: `${count(50, 14)}%` },
  ];
  const bars = [
    { id: 'new', n: 9 },
    { id: 'contacted', n: 6 },
    { id: 'proposal', n: 4 },
    { id: 'won', n: 2 },
  ] as const;
  return (
    <Scene from="right">
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 250, paddingLeft: 70, paddingRight: 70 }}>
        <Words words={['Tus', 'números,', 'claros.']} at={[0, 3, 7]} size={120} accent={[2]} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, width: '100%', marginTop: 70 }}>
          {kpis.map((k, i) => {
            const p = sp(frame, 4 + i * 4, { damping: 16 });
            return (
              <div key={k.label} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '30px 38px', borderRadius: 28, backgroundColor: colors.surface, border: `2px solid ${colors.line}`, opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - Math.min(p, 1)) * 120}px)` }}>
                <span style={{ fontSize: 34, color: colors.muted }}>{k.label}</span>
                <span style={{ fontSize: 76, fontWeight: 700, letterSpacing: '-0.03em', color: k.green ? '#6EE7B7' : colors.fg }}>{k.value}</span>
              </div>
            );
          })}
        </div>
        <div style={{ width: '100%', marginTop: 24, padding: '30px 38px', boxSizing: 'border-box', borderRadius: 28, backgroundColor: colors.surface, border: `2px solid ${colors.line}` }}>
          {bars.map((bar, i) => {
            const st = stages.find((x) => x.id === bar.id)!;
            const w = interpolate(frame, [16 + i * 4, 40 + i * 4], [0, bar.n / 9], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
            return (
              <div key={bar.id} style={{ display: 'grid', gridTemplateColumns: '280px 1fr 50px', alignItems: 'center', gap: 20, marginBottom: i < 3 ? 22 : 0 }}>
                <span style={{ fontSize: 30, color: colors.muted }}>{st.label}</span>
                <span style={{ height: 22, borderRadius: 22, backgroundColor: colors.raised, overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${w * 100}%`, borderRadius: 22, backgroundColor: st.color }} />
                </span>
                <span style={{ fontSize: 30, fontWeight: 700, textAlign: 'right' }}>{Math.round(w * 9)}</span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- 8. Orbit: every channel feeds the board -------------------------------------------

const ORBIT = [
  { n: 'TikTok', icon: Music2, c: '#FF3B6B' },
  { n: 'Instagram', icon: AtSign, c: '#E1306C' },
  { n: 'Facebook', icon: Target, c: '#1877F2' },
  { n: 'WhatsApp', icon: MessageCircle, c: '#25D366' },
  { n: 'Google Ads', icon: Megaphone, c: '#FBBC04' },
  { n: 'Tu web', icon: Globe, c: '#818CF8' },
  { n: 'Shopify', icon: ShoppingBag, c: '#95BF47' },
  { n: 'Make', icon: Workflow, c: '#A855F7' },
];

function Orbit() {
  const frame = useCurrentFrame();
  const center = { x: 540, y: 960 };
  const spin = frame / 70;
  const label = sp(frame, s(18.78) - s(17.0), { damping: 14 });
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 250 }}>
        <Words words={['Conecta', 'tus', 'canales.']} at={[0, 3, 6]} size={118} accent={[2]} />
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: center.x - 400, top: center.y - 400, width: 800, height: 800, borderRadius: 800, border: '2px dashed rgba(129,140,248,0.25)' }} />
      {ORBIT.map((o, i) => {
        const p = sp(frame, 4 + i * 3, { damping: 14, mass: 0.6 });
        const a = (i / ORBIT.length) * Math.PI * 2 + spin;
        const r = 400 * Math.min(p, 1);
        const Icon = o.icon;
        return (
          <div key={o.n} style={{ position: 'absolute', left: center.x + Math.cos(a) * r - 80, top: center.y + Math.sin(a) * r - 80, width: 160, height: 160, borderRadius: 40, backgroundColor: `${o.c}1A`, border: `2px solid ${o.c}55`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: Math.min(1, p * 1.5) }}>
            <Icon size={52} color={o.c} />
            <span style={{ fontSize: 24, fontWeight: 600 }}>{o.n}</span>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: center.x - 130, top: center.y - 130, width: 260, height: 260, borderRadius: 72, backgroundColor: '#0B0F17', border: `2px solid ${colors.lineStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 120px -10px rgba(99,102,241,0.75)' }}>
        <LogoMark size={160} id="ad3-orbit" />
      </div>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 380 }}>
        <div style={{ fontSize: 54, fontWeight: 700, opacity: Math.min(1, label * 1.5), transform: `translateY(${(1 - Math.min(label, 1)) * 30}px)` }}>
          <span style={gradientText}>+20</span> integraciones
        </div>
      </AbsoluteFill>
      <Flash at={s(18.78) - s(17.0)} />
    </Scene>
  );
}

// ---- 9. CTA: close the case ---------------------------------------------------------------

function Cta() {
  const start = s(19.83);
  const frame = useCurrentFrame();
  const head = sp(frame, 0, { damping: 12, mass: 0.6 });
  const sub = sp(frame, s(20.57) - start, { damping: 14 });
  const url = sp(frame, s(21.18) - start, { damping: 14 });
  const tap = s(21.76) - start;
  const cur = sp(frame, tap - 12);
  const press = interpolate(frame, [tap - 2, tap, tap + 7], [0, 1, 0], clamp);
  const ring = interpolate(frame, [tap, tap + 18], [0, 1], clamp);
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 330 }}>
        <div style={{ width: 190, height: 190, borderRadius: 52, backgroundColor: '#0B0F17', border: `2px solid ${colors.lineStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 110px -10px rgba(99,102,241,0.8)', transform: `scale(${Math.min(head, 1.06)})` }}>
          <LogoMark size={120} id="ad3-cta" />
        </div>
        <div style={{ ...big, fontSize: 158, marginTop: 64, textAlign: 'center', opacity: Math.min(1, head * 1.5), transform: `scale(${0.8 + 0.2 * Math.min(head, 1)})` }}>
          Cierra
          <br />
          el <span style={gradientText}>caso.</span>
        </div>
        <div style={{ fontSize: 44, color: colors.muted, marginTop: 34, opacity: Math.min(1, sub * 1.5) }}>Pruébalo gratis · sin tarjeta</div>
        <div style={{ position: 'relative', marginTop: 70, opacity: Math.min(1, url * 1.5), transform: `scale(${(0.75 + 0.25 * Math.min(url, 1.04)) * (1 - 0.04 * press)})` }}>
          {ring > 0 && ring < 1 && <div style={{ position: 'absolute', inset: -10, borderRadius: 40, border: '4px solid rgba(165,180,252,0.9)', transform: `scale(${1 + ring * 0.25})`, opacity: 1 - ring }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '34px 46px', borderRadius: 32, background: 'linear-gradient(180deg,#5B54F0 0%,#4F46E5 100%)', boxShadow: '0 30px 80px -20px rgba(79,70,229,0.95), inset 0 1px 0 rgba(255,255,255,0.2)', fontSize: 46, fontWeight: 700 }}>
            <Globe size={46} strokeWidth={2.2} /> flowdesk-ten-ruby.vercel.app
          </div>
          <div style={{ position: 'absolute', right: 40, top: 70, opacity: Math.min(1, cur * 2) }}>
            <Cursor x={interpolate(cur, [0, 1], [180, 0])} y={interpolate(cur, [0, 1], [220, 0])} press={press} />
          </div>
        </div>
      </AbsoluteFill>
      <Flash at={0} />
    </Scene>
  );
}

const TIMELINE: [() => JSX.Element, number, number | null][] = [
  [Hook, 0, 1.65],
  [Evidence, 1.65, 3.35],
  [Culprit, 3.35, 5.15],
  [Mess, 5.15, 7.45],
  [Reveal, 7.45, 9.85],
  [Features, 9.85, 14.61],
  [Pipeline, 14.61, 17.0],
  [Orbit, 17.0, 19.83],
  [Cta, 19.83, null],
];

export function TikTokAd3() {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Noir />
      {TIMELINE.map(([Comp, from, to], i) => {
        const start = s(from);
        const end = to === null ? durationInFrames : s(to);
        return (
          <Sequence key={i} from={start} durationInFrames={end - start}>
            <Comp />
          </Sequence>
        );
      })}
      <Grain />
      <Audio src={staticFile('audio/track3.mp3')} volume={(f) => interpolate(f, [durationInFrames - 24, durationInFrames - 1], [1, 0], clamp)} />
    </AbsoluteFill>
  );
}
