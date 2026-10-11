import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, fontFamily, stages } from './theme';


const SCENES = {
  intro: { from: 0, duration: 80 },
  headline: { from: 70, duration: 105 },
  board: { from: 165, duration: 185 },
  features: { from: 340, duration: 70 },
  cta: { from: 400, duration: 80 },
};
export const PROMO_DURATION = SCENES.cta.from + SCENES.cta.duration;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// ---- Shared pieces ----------------------------------------------------------------

function Background() {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.canvas }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(to right, rgba(38,45,61,0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(38,45,61,0.45) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 70% 70% at 50% 40%, #000 30%, transparent 100%)',
        }}
      />
      <AbsoluteFill
        style={{ background: 'radial-gradient(ellipse 45% 40% at 50% 30%, rgba(79,70,229,0.22), transparent 70%)' }}
      />
    </AbsoluteFill>
  );
}

/** Fades a scene in and out so cuts feel like one continuous piece. */
function Scene({ duration, children }: { duration: number; children: ReactNode }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12, duration - 12, duration], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{ opacity, fontFamily, color: colors.fg }}>{children}</AbsoluteFill>;
}

function LogoMark({ size, draw = 1 }: { size: number; draw?: number }) {
  // Path lengths are approximate; strokeDashoffset reveals each stroke from its start.
  const paths = [
    { d: 'M5 26V13a7 7 0 0 1 7-7h5', len: 28 },
    { d: 'M5 16.5h7.5', len: 8 },
    { d: 'M17 6a10 10 0 0 1 0 20h-4.5V12', len: 50 },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="fd-logo" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <g stroke="url(#fd-logo)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {paths.map((p) => (
          <path key={p.d} d={p.d} strokeDasharray={p.len} strokeDashoffset={p.len * (1 - draw)} />
        ))}
      </g>
    </svg>
  );
}

function useSpring(delay: number, config = { damping: 200 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
}

// ---- 1. Intro ---------------------------------------------------------------------

function Intro() {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [4, 40], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const word = useSpring(30);
  const tag = useSpring(44);
  return (
    <Scene duration={SCENES.intro.duration}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <LogoMark size={128} draw={draw} />
          <div
            style={{
              fontSize: 108,
              letterSpacing: '-0.035em',
              opacity: word,
              transform: `translateX(${interpolate(word, [0, 1], [-24, 0])}px)`,
            }}
          >
            <span style={{ fontWeight: 700 }}>Flow</span>
            <span style={{ fontWeight: 500 }}>Desk</span>
          </div>
        </div>
        <div style={{ fontSize: 34, color: colors.muted, opacity: tag, transform: `translateY(${(1 - tag) * 16}px)` }}>
          El CRM de leads para emprendedores y pymes
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- 2. Headline ------------------------------------------------------------------

function Headline() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = ['Convierte', 'leads', 'en', 'clientes,'];
  const reveal = (i: number) => spring({ frame: frame - 6 - i * 5, fps, config: { damping: 200 } });
  const accent = reveal(words.length + 1);
  const shine = interpolate(frame, [40, 95], [100, 0], clamp);
  const wordStyle = (p: number): CSSProperties => ({
    display: 'inline-block',
    opacity: p,
    transform: `translateY(${(1 - p) * 40}px)`,
    filter: `blur(${(1 - p) * 10}px)`,
  });
  return (
    <Scene duration={SCENES.headline.duration}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 124, fontWeight: 600, letterSpacing: '-0.045em', lineHeight: 1.05, maxWidth: 1800 }}>
          {words.map((w, i) => (
            <span key={w} style={{ ...wordStyle(reveal(i)), marginRight: '0.25em' }}>{w}</span>
          ))}
          <br />
          <span
            style={{
              ...wordStyle(accent),
              backgroundImage: 'linear-gradient(110deg,#93A5FF 0%,#A5B4FC 40%,#EEF0FF 50%,#A5B4FC 60%,#60A5FA 100%)',
              backgroundSize: '250% 100%',
              backgroundPosition: `${shine}% 0%`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              paddingBottom: 8,
            }}
          >
            sin perder ninguno.
          </span>
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- 3. Board ---------------------------------------------------------------------

const COL_W = 330;
const COL_GAP = 20;
const CARD_H = 104;
const CARD_GAP = 12;
const colX = (c: number) => 24 + c * (COL_W + COL_GAP);
const cardY = (i: number) => 76 + i * (CARD_H + CARD_GAP);

type Card = { name: string; meta: string; value: string; when: string };

const C = {
  valentina: { name: 'Valentina Rojas', meta: 'Estudio Norte · Formulario web', value: '$1.800', when: 'justo ahora' },
  andres: { name: 'Andrés Salinas', meta: 'Salinas Arquitectos · LinkedIn', value: '$5.400', when: 'Sin contacto' },
  lucia: { name: 'Lucía Paredes', meta: 'Clínica Sonríe · Google Ads', value: '$2.000', when: 'Sin contacto' },
  martin: { name: 'Martín Vidal', meta: 'Vidal Transportes · Referido', value: '$8.900', when: 'ayer' },
  isidora: { name: 'Isidora Campos', meta: 'Yoga Prana · Instagram', value: '$750', when: 'hace 5 días' },
  felipe: { name: 'Felipe Araya', meta: 'Araya Contadores · Web', value: '$2.600', when: 'ayer' },
  josefina: { name: 'Josefina Lagos', meta: 'Mapuche Arte · Feria', value: '$4.100', when: 'hace 3 días' },
  benjamin: { name: 'Benjamín Rojas', meta: 'Rojas Ferretería · Referido', value: '$12.500', when: 'la semana pasada' },
} satisfies Record<string, Card>;

const ARRIVE = 34; // new lead lands
const GRAB = 92; // cursor picks up Josefina
const DROP = 104; // card starts travelling to Ganado

function CardView({ card, x, y, highlight = 0, lift = 0 }: { card: Card; x: number; y: number; highlight?: number; lift?: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x + 10,
        top: y,
        width: COL_W - 20,
        height: CARD_H,
        boxSizing: 'border-box',
        padding: '14px 16px',
        borderRadius: 10,
        backgroundColor: highlight > 0 ? `rgba(26,29,51,${0.6 + highlight * 0.4})` : colors.surface,
        border: `1px solid ${highlight > 0 ? `rgba(79,70,229,${0.3 + highlight * 0.5})` : colors.line}`,
        boxShadow: lift ? `0 ${24 * lift}px ${50 * lift}px -16px rgba(0,0,0,0.9), 0 0 0 1px rgba(129,140,248,${0.4 * lift})` : 'none',
        transform: `scale(${1 + 0.04 * lift}) rotate(${1.5 * lift}deg)`,
        zIndex: lift ? 10 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 19, fontWeight: 600 }}>
        <span>{card.name}</span>
        {highlight > 0.2 && <span style={{ fontSize: 14, color: colors.accentSoft, opacity: highlight }}>Nuevo</span>}
      </div>
      <div style={{ fontSize: 15, color: colors.muted, marginTop: 4 }}>{card.meta}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 17 }}>
        <span style={{ fontWeight: 600 }}>{card.value}</span>
        <span style={{ fontSize: 14, color: colors.subtle }}>{card.when}</span>
      </div>
    </div>
  );
}

function Board() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 40 });
  const arrive = spring({ frame: frame - ARRIVE, fps, config: { damping: 18, mass: 0.7 } });
  const push = spring({ frame: frame - ARRIVE, fps, config: { damping: 200 } });
  const move = spring({ frame: frame - DROP, fps, config: { damping: 22, mass: 0.9 } });
  const grabbed = frame >= GRAB && frame < DROP + 28;
  const lift = grabbed ? interpolate(frame, [GRAB, GRAB + 6, DROP + 20, DROP + 28], [0, 1, 1, 0], clamp) : 0;
  const glow = interpolate(frame, [ARRIVE, ARRIVE + 10, ARRIVE + 90], [0, 1, 0.25], clamp);
  const toast = interpolate(frame, [ARRIVE + 4, ARRIVE + 14, ARRIVE + 64, ARRIVE + 74], [0, 1, 1, 0], clamp);

  // Josefina travels from the bottom of "Propuesta" to the top of "Ganado".
  const jx = interpolate(move, [0, 1], [colX(2), colX(3)]);
  const jy = interpolate(move, [0, 1], [cardY(1), cardY(0)]);

  // Cursor: approaches the card, holds it during the drag, then drifts away.
  const cursorIn = spring({ frame: frame - (GRAB - 26), fps, config: { damping: 200 } });
  const cx = interpolate(cursorIn, [0, 1], [colX(3) + 360, colX(2) + 220]) + (jx - colX(2));
  const cy = interpolate(cursorIn, [0, 1], [cardY(3) + 140, cardY(1) + 56]) + (jy - cardY(1));
  const cursorOut = interpolate(frame, [DROP + 36, DROP + 52], [1, 0], clamp);
  const cursorOpacity = Math.min(interpolate(frame, [GRAB - 26, GRAB - 14], [0, 1], clamp), cursorOut);

  const counts = [2 + (frame >= ARRIVE ? 1 : 0), 2, frame >= DROP + 6 ? 1 : 2, frame >= DROP + 6 ? 2 : 1];

  return (
    <Scene duration={SCENES.board.duration}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: 70, fontSize: 52, fontWeight: 600, letterSpacing: '-0.03em', opacity: enter }}>
          Todo tu pipeline, en un tablero claro
        </div>
        <div
          style={{
            position: 'relative',
            marginTop: 110,
            width: 1424,
            height: 600,
            borderRadius: 22,
            border: `1px solid ${colors.lineStrong}`,
            backgroundColor: colors.canvas,
            boxShadow: '0 60px 140px -40px rgba(0,0,0,0.95)',
            overflow: 'hidden',
            opacity: enter,
            transform: `perspective(1800px) rotateX(${(1 - enter) * 16}deg) translateY(${(1 - enter) * 60}px)`,
          }}
        >
          {stages.map((s, i) => (
            <div
              key={s.id}
              style={{
                position: 'absolute',
                left: colX(i),
                top: 20,
                width: COL_W,
                height: 560,
                borderRadius: 14,
                border: `1px solid ${i === 3 && lift > 0 ? 'rgba(79,70,229,0.45)' : 'rgba(38,45,61,0.8)'}`,
                backgroundColor: 'rgba(22,27,38,0.45)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', fontSize: 18, fontWeight: 600 }}>
                <span style={{ width: 9, height: 9, borderRadius: 9, backgroundColor: s.color }} />
                {s.label}
                <span style={{ fontSize: 14, color: colors.muted, backgroundColor: colors.raised, padding: '1px 8px', borderRadius: 5 }}>
                  {counts[i]}
                </span>
              </div>
            </div>
          ))}

          {/* Nuevo Lead: Valentina drops in and pushes the rest down */}
          {frame >= ARRIVE && (
            <div style={{ opacity: Math.min(arrive, 1), transform: `translateY(${(1 - arrive) * -30}px)` }}>
              <CardView card={C.valentina} x={colX(0)} y={cardY(0)} highlight={glow} />
            </div>
          )}
          <CardView card={C.andres} x={colX(0)} y={cardY(0) + push * (CARD_H + CARD_GAP)} />
          <CardView card={C.lucia} x={colX(0)} y={cardY(1) + push * (CARD_H + CARD_GAP)} />

          <CardView card={C.martin} x={colX(1)} y={cardY(0)} />
          <CardView card={C.isidora} x={colX(1)} y={cardY(1)} />

          <CardView card={C.felipe} x={colX(2)} y={cardY(0)} />
          <CardView card={C.benjamin} x={colX(3)} y={cardY(0) + move * (CARD_H + CARD_GAP)} />
          <CardView card={{ ...C.josefina, when: frame >= DROP + 10 ? 'justo ahora' : C.josefina.when }} x={jx} y={jy} lift={lift} />

          {/* Teammate cursor */}
          <div style={{ position: 'absolute', left: cx, top: cy, opacity: cursorOpacity, zIndex: 20 }}>
            <svg width="30" height="30" viewBox="0 0 18 18" style={{ transform: `scale(${1 - 0.1 * lift})` }}>
              <path d="M2 1.5 15.5 8.2 9.4 9.6 6.6 15.4Z" fill="#818CF8" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            <span
              style={{
                display: 'inline-block',
                marginLeft: 20,
                marginTop: -4,
                padding: '3px 10px',
                borderRadius: 6,
                backgroundColor: colors.accent,
                fontSize: 15,
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              Camila · Ventas
            </span>
          </div>

          {/* Webhook toast */}
          <div
            style={{
              position: 'absolute',
              right: 28,
              bottom: 28,
              width: 400,
              padding: '16px 18px',
              borderRadius: 12,
              backgroundColor: colors.surface,
              border: `1px solid ${colors.lineStrong}`,
              boxShadow: '0 20px 40px -12px rgba(0,0,0,0.7)',
              opacity: toast,
              transform: `translateY(${(1 - toast) * 24}px)`,
              zIndex: 30,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 600 }}>Nuevo lead vía webhook</div>
            <div style={{ fontSize: 15, color: colors.muted, marginTop: 4 }}>Valentina Rojas · Formulario web</div>
          </div>
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- 4. Features ------------------------------------------------------------------

function Features() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [
    { title: 'Vista Hoy', body: 'A quién llamar y qué está vencido' },
    { title: 'WhatsApp en un clic', body: 'Mensaje listo y registrado en el historial' },
    { title: 'Formulario y webhook', body: 'Los leads de tu web llegan solos' },
  ];
  return (
    <Scene duration={SCENES.features.duration}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 28, flexDirection: 'row' }}>
        {items.map((it, i) => {
          const p = spring({ frame: frame - 4 - i * 7, fps, config: { damping: 200 } });
          return (
            <div
              key={it.title}
              style={{
                width: 460,
                padding: '36px 36px',
                borderRadius: 20,
                border: `1px solid ${colors.line}`,
                backgroundColor: colors.surface,
                opacity: p,
                transform: `translateY(${(1 - p) * 40}px)`,
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: 12, backgroundColor: colors.accentSoft, marginBottom: 22 }} />
              <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em' }}>{it.title}</div>
              <div style={{ fontSize: 24, color: colors.muted, marginTop: 10, lineHeight: 1.4 }}>{it.body}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    </Scene>
  );
}

// ---- 5. Call to action ------------------------------------------------------------

function Cta() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 200 } });
  const button = spring({ frame: frame - 12, fps, config: { damping: 14 } });
  return (
    <Scene duration={SCENES.cta.duration + 12}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 40 }}>
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 32,
            border: `1px solid ${colors.lineStrong}`,
            backgroundColor: colors.canvas,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 90px -10px rgba(99,102,241,0.6)',
            transform: `scale(${0.8 + 0.2 * p})`,
            opacity: p,
          }}
        >
          <LogoMark size={76} />
        </div>
        <div style={{ fontSize: 96, fontWeight: 600, letterSpacing: '-0.04em', opacity: p }}>Ordena tu pipeline hoy</div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 500,
            padding: '22px 44px',
            borderRadius: 16,
            backgroundColor: colors.accent,
            boxShadow: '0 20px 60px -16px rgba(79,70,229,0.9)',
            transform: `scale(${button})`,
          }}
        >
          Crea tu cuenta gratis
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

export function FlowDeskPromo() {
  return (
    <AbsoluteFill>
      <Background />
      <Sequence from={SCENES.intro.from} durationInFrames={SCENES.intro.duration}><Intro /></Sequence>
      <Sequence from={SCENES.headline.from} durationInFrames={SCENES.headline.duration}><Headline /></Sequence>
      <Sequence from={SCENES.board.from} durationInFrames={SCENES.board.duration}><Board /></Sequence>
      <Sequence from={SCENES.features.from} durationInFrames={SCENES.features.duration}><Features /></Sequence>
      <Sequence from={SCENES.cta.from} durationInFrames={SCENES.cta.duration}><Cta /></Sequence>
    </AbsoluteFill>
  );
}

