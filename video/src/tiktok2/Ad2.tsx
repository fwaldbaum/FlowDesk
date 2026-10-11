import type { ReactNode } from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  AlarmClock, AtSign, Check, Globe, Mail, Megaphone, MessageCircle, MessagesSquare, Phone as PhoneIcon, Target, Webhook,
} from 'lucide-react';
import { colors, fontFamily, stages } from '../theme';
import { clamp, Cursor, FPS, gradientText, LogoMark, sp, Window, Words } from '../tiktok/kit';
import { AUDIO2_DURATION } from './beats';
import { b2, Flash, Kicker, local2, Phone, Stage, usePulse2 } from './parts';

export const AD2_DURATION = Math.ceil(AUDIO2_DURATION * FPS);

function Scene({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 8], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  return (
    <AbsoluteFill style={{ fontFamily, color: colors.fg, opacity: p, transform: `scale(${1.05 - 0.05 * p})`, filter: `blur(${(1 - p) * 10}px)` }}>
      {children}
    </AbsoluteFill>
  );
}

// ---- 1. Hook (beats 0–3) -----------------------------------------------------------

function Hook() {
  const b = local2(0);
  const frame = useCurrentFrame();
  const line = interpolate(frame, [b(2), b(2) + 12], [0, 1], clamp);
  return (
    <Scene>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 160 }}>
        <Words words={['Cada', 'mensaje', 'es', 'una']} at={[b(0), b(0) + 4, b(1), b(1) + 4]} size={150} weight={700} />
        <div style={{ position: 'relative', marginTop: 10 }}>
          <Words words={['venta.']} at={[b(2)]} size={230} weight={800} accent={[0]} />
          <div style={{ height: 10, borderRadius: 10, marginTop: 6, background: 'linear-gradient(90deg,#818CF8,#60A5FA)', transform: `scaleX(${line})`, transformOrigin: '0 50%' }} />
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- 2. Problem (beats 3–7): notifications flood a phone ---------------------------------

const NOTIFS = [
  { app: 'WhatsApp', icon: MessageCircle, color: '#25D366', text: 'Hola, ¿tienen disponibilidad?' },
  { app: 'Instagram', icon: AtSign, color: '#E1306C', text: 'Precio por favor' },
  { app: 'Correo', icon: Mail, color: '#EA4335', text: 'Solicitud de cotización' },
  { app: 'Messenger', icon: MessagesSquare, color: '#0084FF', text: '¿Hacen envíos a regiones?' },
  { app: 'WhatsApp', icon: MessageCircle, color: '#25D366', text: '¿Me pueden llamar?' },
  { app: 'Instagram', icon: AtSign, color: '#E1306C', text: 'Info!!' },
  { app: 'WhatsApp', icon: MessageCircle, color: '#25D366', text: 'Sigo esperando respuesta' },
];

function Problem() {
  const start = b2(3);
  const b = local2(start);
  const frame = useCurrentFrame();
  const every = Math.round((b(7) - b(3)) / (NOTIFS.length + 0.5));
  const shown = Math.min(NOTIFS.length, Math.floor(frame / every) + 1);
  const unread = Math.round(interpolate(frame, [0, b(7) - 4], [3, 48], clamp));
  const phoneIn = sp(frame, 0, { damping: 18 });
  const title = sp(frame, b(4), { damping: 16 });
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 200 }}>
        <div style={{ textAlign: 'center', opacity: title, transform: `translateY(${(1 - title) * 30}px)` }}>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1.05 }}>
            ¿Cuántas se te
            <br />
            <span style={{ color: '#FCA5A5' }}>escapan?</span>
          </div>
        </div>
        <div style={{ marginTop: 70, transform: `translateY(${(1 - phoneIn) * 500}px) rotate(${(1 - phoneIn) * 8}deg)` }}>
          <Phone>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1E1B4B 0%, #0B0F17 70%)' }} />
            <div style={{ position: 'relative', textAlign: 'center', marginTop: 70 }}>
              <div style={{ fontSize: 120, fontWeight: 300, letterSpacing: '-0.04em' }}>9:41</div>
              <div style={{ fontSize: 26, color: colors.muted, marginTop: -6 }}>
                <span style={{ color: '#FCA5A5', fontWeight: 700 }}>{unread}</span> mensajes sin responder
              </div>
            </div>
            <div style={{ position: 'relative', padding: '30px 22px 0' }}>
              {NOTIFS.slice(0, shown)
                .map((n, i) => ({ n, i }))
                .reverse()
                .slice(0, 6)
                .map(({ n, i }, slot) => {
                  const p = sp(frame, i * every, { damping: 15, mass: 0.6 });
                  const Icon = n.icon;
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: 16,
                        alignItems: 'center',
                        marginBottom: 12,
                        padding: '18px 20px',
                        borderRadius: 26,
                        backgroundColor: 'rgba(40,46,62,0.78)',
                        backdropFilter: 'blur(10px)',
                        transform: `translateY(${(1 - p) * -80}px) scale(${1 - slot * 0.015})`,
                        opacity: Math.min(1, p * 1.4) * (1 - slot * 0.08),
                      }}
                    >
                      <span style={{ width: 58, height: 58, borderRadius: 16, backgroundColor: `${n.color}26`, color: n.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={32} strokeWidth={2.2} />
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 21, color: colors.muted }}>
                          <span style={{ fontWeight: 600, color: colors.fg }}>{n.app}</span>
                          <span>ahora</span>
                        </div>
                        <div style={{ fontSize: 24, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.text}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Phone>
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- 3. Reveal (beats 7–10) -------------------------------------------------------

function Reveal() {
  const start = b2(7);
  const b = local2(start);
  const frame = useCurrentFrame();
  const pulse = usePulse2(start);
  const wipe = interpolate(frame, [0, 10], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 4 });
  const draw = interpolate(frame, [2, b(8) + 6], [0, 1], clamp);
  const word = sp(frame, b(8), { damping: 14, mass: 0.6 });
  const tag = sp(frame, b(9), { damping: 200 });
  return (
    <AbsoluteFill style={{ fontFamily, color: '#fff' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 100% 70% at 50% 40%, #6366F1 0%, #4338CA 50%, #1E1B4B 100%)', clipPath: `inset(${(1 - wipe) * 50}% 0 ${(1 - wipe) * 50}% 0)` }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 140, gap: 56 }}>
        <div
          style={{
            width: 280,
            height: 280,
            borderRadius: 76,
            backgroundColor: '#07090F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 50px 120px -30px rgba(0,0,0,0.7), 0 0 ${70 + pulse * 60}px rgba(199,210,254,${0.3 + pulse * 0.25})`,
            transform: `scale(${0.9 + 0.1 * Math.min(1, wipe) + pulse * 0.025})`,
          }}
        >
          <LogoMark size={180} draw={draw} id="ad2-reveal" />
        </div>
        <div style={{ fontSize: 196, letterSpacing: '-0.055em', lineHeight: 1, opacity: Math.min(1, word * 2), transform: `translateY(${(1 - Math.min(word, 1)) * 60}px)` }}>
          <span style={{ fontWeight: 800 }}>Flow</span>
          <span style={{ fontWeight: 500 }}>Desk</span>
        </div>
        <div style={{ fontSize: 48, fontWeight: 500, color: 'rgba(255,255,255,0.88)', opacity: tag, transform: `translateY(${(1 - tag) * 20}px)` }}>
          Ninguna venta se te escapa.
        </div>
      </AbsoluteFill>
      <Flash at={0} />
    </AbsoluteFill>
  );
}

// ---- 4. Product (beats 10–15): 3D board with a phone in front ------------------------

const CARDS: { name: string; meta: string; value: string }[][] = [
  [
    { name: 'Valentina Rojas', meta: 'Formulario web', value: '$1.800' },
    { name: 'Tomás Herrera', meta: 'TikTok Ads', value: '$4.200' },
  ],
  [
    { name: 'Martín Vidal', meta: 'Referido', value: '$8.900' },
    { name: 'Isidora Campos', meta: 'Instagram', value: '$750' },
  ],
  [{ name: 'Felipe Araya', meta: 'Web', value: '$2.600' }],
  [{ name: 'Benjamín Rojas', meta: 'Referido', value: '$12.500' }],
];

function Product() {
  const start = b2(10);
  const b = local2(start);
  const frame = useCurrentFrame();
  const enter = sp(frame, 0, { damping: 20, mass: 0.9 });
  const orbit = interpolate(frame, [0, b(15)], [-24, -12], clamp);
  const hit = b(13); // strong hit: a deal moves forward and the phone buzzes
  const move = sp(frame, hit, { damping: 20 });
  const phone = sp(frame, b(11), { damping: 16, mass: 0.8 });
  const notif = sp(frame, hit + 4, { damping: 14 });
  const title = sp(frame, 4, { damping: 18 });
  const COL = 300;
  const colX = (c: number) => 24 + c * (COL + 20);
  const cardY = (i: number) => 92 + i * 132;
  // Isidora moves from "En Contacto" to "Propuesta" on the hit.
  const ix = interpolate(move, [0, 1], [colX(1), colX(2)]);
  const iy = interpolate(move, [0, 1], [cardY(1), cardY(1)]);
  const lift = interpolate(frame, [hit - 8, hit - 2, hit + 14, hit + 22], [0, 1, 1, 0], clamp);
  const cursorP = sp(frame, hit - 18);
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 190 }}>
        <div style={{ textAlign: 'center', opacity: title, transform: `translateY(${(1 - title) * 30}px)` }}>
          <Kicker p={title}>Tu CRM de leads</Kicker>
          <div style={{ marginTop: 26, fontSize: 100, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1.03 }}>
            Todos tus leads.
            <br />
            <span style={gradientText}>Un solo tablero.</span>
          </div>
        </div>
      </AbsoluteFill>
      {/* Board in perspective */}
      <div
        style={{
          position: 'absolute',
          left: -60,
          top: 760,
          width: 1310,
          transform: `perspective(2400px) rotateY(${orbit}deg) rotateX(10deg) translateX(${(1 - enter) * 300}px) scale(1.12)`,
          transformOrigin: '30% 50%',
          opacity: Math.min(1, enter * 1.4),
        }}
      >
        <Window style={{ height: 620, position: 'relative' }}>
          {stages.map((s, i) => (
            <div key={s.id} style={{ position: 'absolute', left: colX(i), top: 20, width: COL, height: 580, borderRadius: 20, border: '1.5px solid rgba(38,45,61,0.9)', backgroundColor: 'rgba(22,27,38,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 20px', fontSize: 24, fontWeight: 600 }}>
                <span style={{ width: 12, height: 12, borderRadius: 12, backgroundColor: s.color }} /> {s.label}
              </div>
            </div>
          ))}
          {CARDS.map((col, c) =>
            col.map((card, i) => {
              if (card.name === 'Isidora Campos') return null;
              const y = c === 2 ? cardY(i) : cardY(i);
              return <MiniCard key={card.name} x={colX(c) + 12} y={y} card={card} />;
            }),
          )}
          <MiniCard x={ix + 12} y={iy} card={CARDS[1]![1]!} lift={lift} />
          <div style={{ position: 'absolute', left: ix + 200, top: iy + 70, opacity: Math.min(cursorP * 2, interpolate(frame, [hit + 26, hit + 34], [1, 0], clamp)) }}>
            <Cursor x={interpolate(cursorP, [0, 1], [160, 0])} y={interpolate(cursorP, [0, 1], [200, 0])} label="Camila" press={lift} />
          </div>
        </Window>
      </div>
      {/* Phone in front, receiving the push */}
      <div style={{ position: 'absolute', right: 70, top: 1080, transform: `translateY(${(1 - phone) * 700}px) rotate(${-6 + (1 - phone) * 10}deg) scale(0.62)`, transformOrigin: '100% 0%' }}>
        <Phone glow={notif}>
          <div style={{ padding: '40px 30px' }}>
            <div style={{ fontSize: 40, fontWeight: 700 }}>Nuevo Lead</div>
            {[
              { n: 'Sofía Pérez', s: 'Facebook Ads', icon: Target, c: '#1877F2' },
              { n: 'Diego Morales', s: 'Formulario web', icon: Globe, c: '#818CF8' },
              { n: 'Camila Fuentes', s: 'Instagram', icon: AtSign, c: '#E1306C' },
            ].map((l, i) => {
              const Icon = l.icon;
              const fresh = i === 0;
              const p = fresh ? notif : 1;
              return (
                <div
                  key={l.n}
                  style={{
                    marginTop: 18,
                    padding: '22px 22px',
                    borderRadius: 24,
                    backgroundColor: fresh ? '#1A1D33' : colors.surface,
                    border: `2px solid ${fresh ? 'rgba(99,102,241,0.8)' : colors.line}`,
                    opacity: Math.min(1, p * 1.4),
                    transform: `translateY(${(1 - Math.min(p, 1)) * -40}px)`,
                  }}
                >
                  <div style={{ fontSize: 30, fontWeight: 600 }}>{l.n}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 24, color: l.c }}>
                    <Icon size={24} /> {l.s}
                  </div>
                </div>
              );
            })}
          </div>
        </Phone>
      </div>
      <Flash at={hit} />
    </Scene>
  );
}

function MiniCard({ x, y, card, lift = 0 }: { x: number; y: number; card: { name: string; meta: string; value: string }; lift?: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 276,
        height: 118,
        boxSizing: 'border-box',
        padding: '20px 22px',
        borderRadius: 18,
        backgroundColor: colors.surface,
        border: `2px solid ${lift > 0 ? 'rgba(129,140,248,0.85)' : colors.line}`,
        boxShadow: lift > 0 ? `0 ${30 * lift}px ${60 * lift}px -16px rgba(0,0,0,0.95)` : 'none',
        transform: `scale(${1 + 0.05 * lift}) rotate(${2 * lift}deg)`,
        zIndex: lift > 0 ? 10 : 1,
      }}
    >
      <div style={{ fontSize: 27, fontWeight: 600 }}>{card.name}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 22 }}>
        <span style={{ color: colors.muted }}>{card.meta}</span>
        <span style={{ fontWeight: 700 }}>{card.value}</span>
      </div>
    </div>
  );
}

// ---- 5. Features (beats 15–21): phone carousel on the hits ---------------------------

const FEATURES = [
  { kicker: 'Captura automática', title: 'Llegan solos.', body: 'Formulario web, TikTok, Facebook, Instagram o webhook.', beat: 15 },
  { kicker: 'Vista Hoy', title: 'A quién llamar.', body: 'Recordatorios, vencidos y leads que se enfrían.', beat: 17 },
  { kicker: 'WhatsApp', title: 'Un clic.', body: 'Mensaje listo y registrado en el historial.', beat: 19 },
];

function FeatureScreen({ index, frame, at }: { index: number; frame: number; at: number }) {
  if (index === 0) {
    const sources = [
      { n: 'Valentina Rojas', s: 'Formulario web', icon: Globe, c: '#818CF8' },
      { n: 'Tomás Herrera', s: 'TikTok Ads', icon: Megaphone, c: '#FF3B6B' },
      { n: 'Sofía Pérez', s: 'Facebook Ads', icon: Target, c: '#1877F2' },
      { n: 'Diego Morales', s: 'Webhook', icon: Webhook, c: '#A5B4FC' },
    ];
    return (
      <div style={{ padding: '40px 28px' }}>
        <div style={{ fontSize: 38, fontWeight: 700, marginBottom: 10 }}>Nuevo Lead</div>
        {sources.map((l, i) => {
          const p = sp(frame, at + 4 + i * 5, { damping: 15, mass: 0.6 });
          const Icon = l.icon;
          return (
            <div key={l.n} style={{ marginTop: 16, padding: '22px 22px', borderRadius: 24, backgroundColor: i === 0 ? '#1A1D33' : colors.surface, border: `2px solid ${i === 0 ? 'rgba(99,102,241,0.8)' : colors.line}`, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - Math.min(p, 1)) * -40}px)` }}>
              <div style={{ fontSize: 30, fontWeight: 600 }}>{l.n}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 24, color: l.c }}>
                <Icon size={24} /> {l.s}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  if (index === 1) {
    const tasks = [
      { t: 'Llamar a Martín', tag: 'Vencido', red: true },
      { t: 'Enviar propuesta', tag: '10:30' },
      { t: 'Confirmar reunión', tag: '15:00' },
      { t: 'Seguimiento', tag: 'mañana' },
    ];
    return (
      <div style={{ padding: '40px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 38, fontWeight: 700, marginBottom: 14 }}>
          <AlarmClock size={38} color="#FCD34D" /> Para hoy
        </div>
        {tasks.map((task, i) => {
          const done = i < 2 && frame >= at + 10 + i * 8;
          return (
            <div key={task.t} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '24px 6px', borderBottom: `1.5px solid ${colors.line}` }}>
              <span style={{ width: 40, height: 40, borderRadius: 40, border: `3px solid ${done ? '#34D399' : colors.lineStrong}`, backgroundColor: done ? '#34D399' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.canvas, flexShrink: 0 }}>
                {done && <Check size={24} strokeWidth={3.5} />}
              </span>
              <span style={{ flex: 1, fontSize: 30, fontWeight: 600, color: done ? colors.subtle : colors.fg, textDecoration: done ? 'line-through' : 'none' }}>{task.t}</span>
              <span style={{ fontSize: 22, padding: '4px 12px', borderRadius: 999, backgroundColor: task.red ? 'rgba(239,68,68,0.15)' : colors.raised, color: task.red ? '#FCA5A5' : colors.muted }}>{task.tag}</span>
            </div>
          );
        })}
      </div>
    );
  }
  const msg = 'Hola Valentina, te escribo de Estudio Norte. ¿Conversamos?';
  const typed = Math.round(interpolate(frame, [at + 8, at + 30], [0, msg.length], clamp));
  return (
    <div style={{ position: 'absolute', inset: 0, top: 70, backgroundColor: '#0B141A' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '22px 26px', backgroundColor: '#1F2C33' }}>
        <span style={{ width: 56, height: 56, borderRadius: 56, backgroundColor: '#2A3942', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#E9EDEF' }}>VR</span>
        <span style={{ fontSize: 30, fontWeight: 600, color: '#E9EDEF' }}>Valentina Rojas</span>
        <PhoneIcon size={28} color="#E9EDEF" style={{ marginLeft: 'auto' }} />
      </div>
      <div style={{ padding: 26 }}>
        <div style={{ marginLeft: 'auto', maxWidth: '88%', padding: '20px 22px', borderRadius: 22, borderTopRightRadius: 6, backgroundColor: '#005C4B', color: '#E9EDEF', fontSize: 28, lineHeight: 1.4 }}>
          {msg.slice(0, typed)}
          {typed >= msg.length && <div style={{ textAlign: 'right', fontSize: 20, opacity: 0.6, marginTop: 4 }}>ahora</div>}
        </div>
        {typed >= msg.length && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginTop: 34, fontSize: 22, color: '#6EE7B7' }}>
            <Check size={22} /> Contacto registrado en FlowDesk
          </div>
        )}
      </div>
    </div>
  );
}

function Features() {
  const start = b2(15);
  const b = local2(start);
  const frame = useCurrentFrame();
  const hits = FEATURES.map((f) => b(f.beat));
  const current = hits.reduce((acc, h, i) => (frame >= h ? i : acc), 0);
  const f = FEATURES[current]!;
  const p = sp(frame, hits[current]!, { damping: 16, mass: 0.7 });
  const slide = (1 - Math.min(p, 1)) * (current === 0 ? 0 : 1);
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 190 }}>
        <div key={current} style={{ textAlign: 'center', opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - Math.min(p, 1)) * 40}px)`, filter: `blur(${Math.max(0, 1 - p) * 8}px)` }}>
          <Kicker>{f.kicker}</Kicker>
          <div style={{ marginTop: 24, fontSize: 132, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 1 }}>
            <span style={gradientText}>{f.title}</span>
          </div>
          <div style={{ marginTop: 22, fontSize: 38, color: colors.muted, maxWidth: 860 }}>{f.body}</div>
        </div>
        <div style={{ marginTop: 60, display: 'flex', gap: 14, marginBottom: 40 }}>
          {FEATURES.map((_, i) => (
            <span key={i} style={{ width: i === current ? 56 : 16, height: 16, borderRadius: 16, backgroundColor: i <= current ? colors.accentSoft : colors.lineStrong }} />
          ))}
        </div>
        <div style={{ transform: `translateX(${slide * 700}px) rotate(${slide * 8}deg) scale(0.86)`, transformOrigin: '50% 0%' }}>
          <Phone glow={0.4}>
            <FeatureScreen index={current} frame={frame} at={hits[current]!} />
          </Phone>
        </div>
      </AbsoluteFill>
      {hits.slice(1).map((h) => <Flash key={h} at={h} duration={8} />)}
    </Scene>
  );
}

// ---- 6. Call to action (beat 21 → end) -------------------------------------------------

function Cta() {
  const start = b2(21);
  const b = local2(start);
  const frame = useCurrentFrame();
  const pulse = usePulse2(start);
  const logo = sp(frame, 0, { damping: 14, mass: 0.6 });
  const head = sp(frame, b(22), { damping: 16 });
  const url = sp(frame, b(23), { damping: 14 });
  const tap = b(25);
  const cur = sp(frame, tap - 14);
  const press = interpolate(frame, [tap - 2, tap, tap + 7], [0, 1, 0], clamp);
  const ring = interpolate(frame, [tap, tap + 18], [0, 1], clamp);
  return (
    <Scene>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 45% at 50% 40%, rgba(79,70,229,0.45), transparent 70%)' }} />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 300 }}>
        <div style={{ width: 210, height: 210, borderRadius: 58, border: `2px solid ${colors.lineStrong}`, backgroundColor: '#07090F', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 ${80 + pulse * 50}px -10px rgba(99,102,241,0.8)`, transform: `scale(${Math.min(logo, 1.05) + pulse * 0.02})` }}>
          <LogoMark size={132} id="ad2-cta" />
        </div>
        <div style={{ marginTop: 64, textAlign: 'center', opacity: Math.min(1, head * 1.5), transform: `translateY(${(1 - Math.min(head, 1)) * 40}px)` }}>
          <div style={{ fontSize: 132, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 1 }}>
            Pruébalo <span style={gradientText}>gratis.</span>
          </div>
          <div style={{ fontSize: 40, color: colors.muted, marginTop: 26 }}>Sin tarjeta · Listo en minutos</div>
        </div>
        <div style={{ position: 'relative', marginTop: 80, opacity: Math.min(1, url * 1.5), transform: `scale(${(0.75 + 0.25 * Math.min(url, 1.04)) * (1 - 0.04 * press)})` }}>
          {ring > 0 && ring < 1 && <div style={{ position: 'absolute', inset: -10, borderRadius: 40, border: '4px solid rgba(165,180,252,0.9)', transform: `scale(${1 + ring * 0.25})`, opacity: 1 - ring }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '34px 46px', borderRadius: 32, background: 'linear-gradient(180deg,#5B54F0 0%,#4F46E5 100%)', boxShadow: '0 30px 80px -20px rgba(79,70,229,0.95), inset 0 1px 0 rgba(255,255,255,0.2)', fontSize: 46, fontWeight: 700, letterSpacing: '-0.02em' }}>
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
  [Hook, 0, 3],
  [Problem, 3, 7],
  [Reveal, 7, 10],
  [Product, 10, 15],
  [Features, 15, 21],
  [Cta, 21, null],
];

export function TikTokAd2() {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Stage offset={0} />
      {TIMELINE.map(([Comp, from, to], i) => {
        const start = i === 0 ? 0 : b2(from);
        const end = to === null ? durationInFrames : b2(to);
        return (
          <Sequence key={i} from={start} durationInFrames={end - start}>
            <Comp />
          </Sequence>
        );
      })}
      <Audio
        src={staticFile('audio/track2.mp3')}
        volume={(f) => interpolate(f, [durationInFrames - 20, durationInFrames - 1], [1, 0], clamp)}
      />
    </AbsoluteFill>
  );
}
