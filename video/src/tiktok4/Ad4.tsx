import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { CalendarHeart, CheckCheck, Globe, Heart, HeartCrack, HeartHandshake, MessageCircle, Phone as PhoneIcon, Trophy } from 'lucide-react';
import { colors, fontFamily, stages } from '../theme';
import { clamp, Cursor, FPS, gradientText, LogoMark, sp, Window, Words } from '../tiktok/kit';
import { Kicker } from '../tiktok2/parts';

/**
 * Track 4 is a romantic Latin pop song, so the ad treats customers like a crush: leaving a lead
 * "on read" loses them, FlowDesk makes sure nobody is left on read. Cut at 33 s, on the song's
 * natural pause, to keep the video short enough for good retention.
 */
export const AD4_SECONDS = 33.0;
export const AD4_DURATION = Math.round(AD4_SECONDS * FPS);
const s = (t: number) => Math.round(t * FPS);

const PINK = '#F472B6';
const HITS = [0.07, 0.98, 7.22, 10.73, 15.72, 16.74, 17.21, 18.1, 20.74, 21.76, 22.76, 25.22, 27.2, 30.6];

const pinkText: CSSProperties = {
  backgroundImage: 'linear-gradient(100deg, #F9A8D4 0%, #F472B6 45%, #A5B4FC 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  paddingBottom: '0.08em',
};
const big: CSSProperties = { fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 1.02 };

// ---- Look ---------------------------------------------------------------------------

function Backdrop() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const love = interpolate(frame, [s(11.4), s(15.7)], [0, 1], clamp);
  const hit = HITS.reduce((acc, h) => (frame >= s(h) ? s(h) : acc), -999);
  const kick = interpolate(frame - hit, [0, 10], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: '#090A12' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 65% 38% at ${50 + Math.sin(t / 1.9) * 12}% 32%, rgba(99,102,241,${0.26 + kick * 0.08}), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 55% 32% at ${48 - Math.sin(t / 2.3) * 14}% 72%, rgba(244,114,182,${0.1 + love * 0.12}), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(38,45,61,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(38,45,61,0.4) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          backgroundPosition: `0 ${(frame * 0.5) % 80}px`,
          maskImage: 'radial-gradient(ellipse 75% 55% at 50% 45%, #000 15%, transparent 95%)',
          opacity: 0.6,
        }}
      />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 90% 75% at 50% 45%, transparent 55%, rgba(0,0,0,0.6) 100%)' }} />
    </AbsoluteFill>
  );
}

/** Hearts drifting upward; density follows `amount` (0..1). */
function Hearts({ amount, seed = 0 }: { amount: number; seed?: number }) {
  const frame = useCurrentFrame();
  if (amount <= 0) return null;
  const items = Array.from({ length: 14 }, (_, i) => {
    const r = Math.sin((i + 1) * 91.7 + seed) * 10000;
    const rand = r - Math.floor(r);
    const x = 60 + rand * 960;
    const speed = 2.2 + rand * 2.5;
    const y = 1900 - ((frame * speed + i * 160) % 2100);
    const size = 34 + rand * 46;
    return { i, x: x + Math.sin((frame + i * 30) / 20) * 30, y, size, o: (0.25 + rand * 0.5) * amount };
  });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {items.map((h) => (
        <Heart key={h.i} size={h.size} fill={PINK} color={PINK} style={{ position: 'absolute', left: h.x, top: h.y, opacity: h.o }} />
      ))}
    </AbsoluteFill>
  );
}

function Flash({ at, duration = 10, color = 'rgba(249,168,212,0.9)' }: { at: number; duration?: number; color?: string }) {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 2, at + duration], [0, 0.25, 0], clamp);
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 50% at 50% 45%, ${color}, transparent 75%)`, opacity: o, pointerEvents: 'none' }} />;
}

function Scene({ children, enter = 'zoom' }: { children: ReactNode; enter?: 'zoom' | 'up' }) {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 7], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const transform = enter === 'up' ? `translateY(${(1 - p) * 160}px)` : `scale(${1.06 - 0.06 * p})`;
  return <AbsoluteFill style={{ fontFamily, color: colors.fg, opacity: p, transform, filter: `blur(${(1 - p) * 12}px)` }}>{children}</AbsoluteFill>;
}

function ChatHeader({ name, initials, status }: { name: string; initials: string; status?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '24px 30px', backgroundColor: '#1F2C33' }}>
      <span style={{ width: 70, height: 70, borderRadius: 70, backgroundColor: '#2A3942', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#E9EDEF' }}>{initials}</span>
      <div>
        <div style={{ fontSize: 36, fontWeight: 600, color: '#E9EDEF' }}>{name}</div>
        {status && <div style={{ fontSize: 24, color: '#8696A0' }}>{status}</div>}
      </div>
      <PhoneIcon size={30} color="#E9EDEF" style={{ marginLeft: 'auto' }} />
    </div>
  );
}

function Bubble({ text, mine, time, read, p = 1 }: { text: string; mine?: boolean; time: string; read?: boolean; p?: number }) {
  return (
    <div
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '84%',
        padding: '22px 26px',
        borderRadius: 26,
        [mine ? 'borderTopRightRadius' : 'borderTopLeftRadius']: 6,
        backgroundColor: mine ? '#005C4B' : '#202C33',
        color: '#E9EDEF',
        fontSize: 34,
        lineHeight: 1.35,
        opacity: Math.min(1, p * 1.5),
        transform: `translateY(${(1 - Math.min(p, 1)) * 30}px) scale(${0.9 + 0.1 * Math.min(p, 1)})`,
        transformOrigin: mine ? '100% 0%' : '0% 0%',
      }}
    >
      {text}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, fontSize: 22, color: '#8696A0', marginTop: 4 }}>
        {time}
        {mine && <CheckCheck size={24} color={read ? '#53BDEB' : '#8696A0'} />}
      </div>
    </div>
  );
}

// ---- 1. Hook (0–4.2): "Y hablas… como ninguna" ------------------------------------------

function Hook() {
  const frame = useCurrentFrame();
  const chat = sp(frame, s(1.97), { damping: 16 });
  const seen = sp(frame, s(2.6), { damping: 14 });
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 260, paddingLeft: 70, paddingRight: 70 }}>
        <div style={{ textAlign: 'center' }}>
          <Words words={['Si', 'tu', 'cliente', 'fuera']} at={[s(0.07), s(0.3), s(0.55), s(0.98)]} size={120} />
          <Words words={['tu', 'crush…']} at={[s(1.25), s(1.5)]} size={150} weight={800} style={{ marginTop: 4, color: PINK }} />
        </div>
        <div style={{ width: '100%', marginTop: 70, borderRadius: 34, overflow: 'hidden', border: '2px solid #22303A', backgroundColor: '#0B141A', opacity: Math.min(1, chat * 1.5), transform: `translateY(${(1 - Math.min(chat, 1)) * 140}px)` }}>
          <ChatHeader name="Camila · cliente" initials="CF" status="en línea" />
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Bubble text="Hola! ¿Tienen disponibilidad esta semana?" time="10:42" p={chat} />
            <div style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderRadius: 14, backgroundColor: 'rgba(32,44,51,0.9)', fontSize: 26, color: '#8696A0', opacity: Math.min(1, seen * 1.5) }}>
              <CheckCheck size={28} color="#53BDEB" /> Visto 10:43 · sin respuesta
            </div>
          </div>
        </div>
        <div style={{ marginTop: 60, textAlign: 'center' }}>
          <Words words={['¿lo', 'dejarías', 'en', 'visto?']} at={[s(2.97), s(3.2), s(3.45), s(3.65)]} size={104} accent={[3]} />
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- 2. Forgotten (4.2–7.8): "Dime, dime baby…" -----------------------------------------

function Forgotten() {
  const start = s(4.2);
  const frame = useCurrentFrame();
  const lines = [
    { t: 'Te escribió.', at: s(4.2) - start },
    { t: 'Te pidió precio.', at: s(4.97) - start },
    { t: 'Y tú…', at: s(5.78) - start },
  ];
  const hitAt = s(7.22) - start;
  const broke = sp(frame, hitAt, { damping: 10, mass: 0.5 });
  const shake = frame >= hitAt ? Math.sin(frame * 3.1) * interpolate(frame, [hitAt, hitAt + 8], [14, 0], clamp) : 0;
  const fadeLines = interpolate(frame, [hitAt - 4, hitAt], [1, 0.25], clamp);
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 240, transform: `translateX(${shake}px)` }}>
        <div style={{ textAlign: 'center', opacity: fadeLines }}>
          {lines.map((l) => {
            const p = sp(frame, l.at, { damping: 15, mass: 0.6 });
            return (
              <div key={l.t} style={{ ...big, fontSize: 112, opacity: frame >= l.at ? Math.min(1, p * 1.5) : 0, transform: `translateY(${(1 - Math.min(p, 1)) * 40}px)`, marginBottom: 14 }}>
                {l.t}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, opacity: frame >= hitAt ? 1 : 0, transform: `scale(${frame >= hitAt ? 1.6 - 0.6 * Math.min(broke, 1) : 0})` }}>
          <HeartCrack size={180} color={PINK} strokeWidth={1.6} />
          <div style={{ ...big, fontSize: 132, color: PINK }}>lo olvidaste.</div>
        </div>
      </AbsoluteFill>
      <Flash at={hitAt} color="rgba(244,114,182,0.9)" />
    </Scene>
  );
}

// ---- 3. Lost (7.8–11.4): "se acerca a mí, oh-ah-ah" ---------------------------------------

function Lost() {
  const start = s(7.8);
  const frame = useCurrentFrame();
  const move = sp(frame, s(8.73) - start, { damping: 20 });
  const stampAt = s(10.73) - start;
  const stamp = sp(frame, stampAt, { damping: 10, mass: 0.5 });
  const COL = 440;
  const lost = { label: 'Perdido', color: '#6B7280' };
  return (
    <Scene enter="up">
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 260 }}>
        <Words words={['Y', 'se', 'fue', 'con']} at={[0, 3, 6, 9]} size={112} />
        <Words words={['la', 'competencia.']} at={[13, 17]} size={124} weight={800} accent={[1]} style={{ marginTop: 6 }} />
        <div style={{ position: 'relative', marginTop: 80, width: 940 }}>
          <Window style={{ height: 560, position: 'relative' }}>
            {[{ label: stages[1].label, color: stages[1].color }, lost].map((c, i) => (
              <div key={c.label} style={{ position: 'absolute', left: 20 + i * (COL + 20), top: 20, width: COL, height: 520, borderRadius: 24, border: '2px solid rgba(38,45,61,0.9)', backgroundColor: 'rgba(22,27,38,0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 26px', fontSize: 32, fontWeight: 600 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 14, backgroundColor: c.color }} /> {c.label}
                </div>
              </div>
            ))}
            <div style={{ position: 'absolute', left: 36 + move * (COL + 20), top: 110 + move * 0, width: COL - 32, boxSizing: 'border-box', padding: '26px 28px', borderRadius: 22, backgroundColor: colors.surface, border: `2px solid ${colors.line}`, opacity: 1 - move * 0.45, filter: `grayscale(${move})`, transform: `rotate(${Math.sin(move * Math.PI) * 4}deg)` }}>
              <div style={{ fontSize: 36, fontWeight: 600 }}>Camila Fuentes</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 30 }}>
                <span style={{ color: colors.muted }}>Instagram</span>
                <span style={{ fontWeight: 700 }}>$4.100</span>
              </div>
            </div>
          </Window>
          <div style={{ position: 'absolute', right: 30, bottom: 60, padding: '18px 34px', border: '6px solid #F87171', borderRadius: 18, color: '#F87171', fontSize: 70, fontWeight: 800, letterSpacing: '0.05em', backgroundColor: 'rgba(9,10,18,0.8)', transform: `rotate(-8deg) scale(${frame >= stampAt ? 2.1 - 1.1 * Math.min(stamp, 1) : 0})`, opacity: frame >= stampAt ? Math.min(1, stamp * 2) : 0 }}>
            -$4.100
          </div>
        </div>
      </AbsoluteFill>
      <Flash at={stampAt} color="rgba(248,113,113,0.8)" />
    </Scene>
  );
}

// ---- 4. Build-up (11.4–15.72): "Hay algo en ti" ----------------------------------------

function Build() {
  const start = s(11.4);
  const frame = useCurrentFrame();
  const beats = [11.75, 12.75, 13.77, 14.74].map((t) => s(t) - start);
  const last = beats.reduce((acc, b) => (frame >= b ? b : acc), -99);
  const beat = interpolate(frame - last, [0, 9], [1, 0], clamp);
  const zoom = interpolate(frame, [s(15.2) - start, s(15.72) - start], [1, 9], { ...clamp, easing: (t) => t ** 3 });
  const fill = interpolate(frame, [s(13.77) - start, s(15.0) - start], [0, 1], clamp);
  return (
    <Scene>
      <Hearts amount={interpolate(frame, [0, 60], [0.2, 1], clamp)} seed={4} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 220 }}>
        <div style={{ transform: `scale(${(1 + beat * 0.12) * zoom})`, filter: `drop-shadow(0 0 ${40 + beat * 50}px rgba(244,114,182,0.7))` }}>
          <Heart size={300} color={PINK} fill={`rgba(244,114,182,${fill})`} strokeWidth={1.6} />
        </div>
        <div style={{ marginTop: 60, textAlign: 'center', opacity: interpolate(zoom, [1, 2], [1, 0], clamp) }}>
          <Words words={['Trata', 'a', 'cada', 'cliente']} at={[2, 6, 10, s(12.2) - start]} size={112} />
          <Words words={['como', 'a', 'tu', 'crush.']} at={[s(12.75) - start, s(13.0) - start, s(13.25) - start, s(13.77) - start]} size={128} weight={800} style={{ marginTop: 6 }} />
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- 5. Reveal (15.72–18.1): the drop --------------------------------------------------

function Reveal() {
  const frame = useCurrentFrame();
  const burst = interpolate(frame, [0, 24], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const logo = sp(frame, 0, { damping: 11, mass: 0.6 });
  const word = sp(frame, s(16.74) - s(15.72), { damping: 13 });
  const tag = sp(frame, s(17.21) - s(15.72), { damping: 16 });
  return (
    <AbsoluteFill style={{ fontFamily, color: '#fff' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 100% 70% at 50% 40%, #7C3AED 0%, #4F46E5 40%, #1E1B4B 100%)', clipPath: `circle(${burst * 140}% at 50% 40%)` }} />
      <Hearts amount={1 - burst * 0.4} seed={9} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 200 }}>
        <div style={{ width: 300, height: 300, borderRadius: 82, backgroundColor: '#090A12', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 50px 120px -30px rgba(0,0,0,0.6), 0 0 120px rgba(249,168,212,0.45)', transform: `scale(${Math.min(logo, 1.08)}) rotate(${(1 - Math.min(logo, 1)) * -20}deg)` }}>
          <LogoMark size={190} id="ad4-logo" />
        </div>
        <div style={{ fontSize: 196, letterSpacing: '-0.055em', lineHeight: 1, marginTop: 56, opacity: Math.min(1, word * 2), transform: `translateY(${(1 - Math.min(word, 1)) * 60}px)` }}>
          <span style={{ fontWeight: 800 }}>Flow</span>
          <span style={{ fontWeight: 500 }}>Desk</span>
        </div>
        <div style={{ fontSize: 52, fontWeight: 600, marginTop: 34, textAlign: 'center', lineHeight: 1.25, opacity: Math.min(1, tag * 1.5), transform: `translateY(${(1 - Math.min(tag, 1)) * 24}px)` }}>
          El CRM que no deja
          <br />a nadie en visto.
        </div>
      </AbsoluteFill>
      <Flash at={0} color="rgba(255,255,255,0.9)" />
    </AbsoluteFill>
  );
}

// ---- 6. Features (18.1–27.2): dating rules, CRM edition ------------------------------------

const RULES = [
  { at: 18.1, n: '01', kicker: 'Regla 1', a: 'Nunca más', b: 'en visto.' },
  { at: 20.74, n: '02', kicker: 'Regla 2', a: 'Recuerda', b: 'cada cita.' },
  { at: 22.76, n: '03', kicker: 'Regla 3', a: 'Escríbele', b: 'primero.' },
  { at: 25.22, n: '04', kicker: 'Regla 4', a: 'Y cierra', b: 'el trato.' },
];

function RuleVisual({ i, f }: { i: number; f: number }) {
  if (i === 0) {
    const leads = [
      { n: 'Camila Fuentes', s: 'Instagram · hace 1 min' },
      { n: 'Tomás Herrera', s: 'TikTok Ads · hace 3 min' },
    ];
    return (
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 30, right: 30, top: -40, zIndex: 5, display: 'flex', alignItems: 'center', gap: 20, padding: '22px 26px', borderRadius: 26, backgroundColor: 'rgba(40,46,62,0.95)', border: `2px solid ${colors.lineStrong}`, boxShadow: '0 30px 60px -20px rgba(0,0,0,0.9)', opacity: Math.min(1, sp(f, 2, { damping: 14 }) * 1.5), transform: `translateY(${(1 - Math.min(sp(f, 2, { damping: 14 }), 1)) * -80}px)` }}>
          <span style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: '#0B0F17', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogoMark size={40} id="ad4-notif" />
          </span>
          <div>
            <div style={{ fontSize: 30, fontWeight: 700 }}>Nuevo lead: Camila Fuentes</div>
            <div style={{ fontSize: 24, color: colors.muted }}>Respóndele antes de que se enfríe</div>
          </div>
        </div>
        <Window title="Nuevo Lead" style={{ paddingTop: 0 }}>
          <div style={{ padding: '70px 24px 24px' }}>
            {leads.map((l, k) => (
              <div key={l.n} style={{ padding: '24px 26px', marginBottom: 14, borderRadius: 22, backgroundColor: k === 0 ? '#1A1D33' : colors.surface, border: `2px solid ${k === 0 ? 'rgba(99,102,241,0.8)' : colors.line}` }}>
                <div style={{ fontSize: 36, fontWeight: 600 }}>{l.n}</div>
                <div style={{ fontSize: 26, color: colors.muted, marginTop: 4 }}>{l.s}</div>
              </div>
            ))}
          </div>
        </Window>
      </div>
    );
  }
  if (i === 1) {
    const items = [
      { t: 'Reunión con Camila', tag: 'hoy 15:00', icon: CalendarHeart },
      { t: 'Enviar cotización a Tomás', tag: 'hoy 17:30', icon: MessageCircle },
      { t: 'Seguimiento a Diego', tag: 'mañana', icon: PhoneIcon },
    ];
    return (
      <Window title="Para hoy">
        {items.map((it, k) => {
          const p = sp(f, 3 + k * 5, { damping: 15 });
          const Icon = it.icon;
          return (
            <div key={it.t} style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '30px 32px', borderBottom: k < 2 ? `1.5px solid ${colors.line}` : 'none', opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - Math.min(p, 1)) * 80}px)` }}>
              <span style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(244,114,182,0.14)', color: PINK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={34} />
              </span>
              <span style={{ flex: 1, fontSize: 34, fontWeight: 600 }}>{it.t}</span>
              <span style={{ fontSize: 24, padding: '6px 14px', borderRadius: 999, backgroundColor: colors.raised, color: colors.muted }}>{it.tag}</span>
            </div>
          );
        })}
      </Window>
    );
  }
  if (i === 2) {
    const msg = 'Hola Camila! Te envío la cotización, ¿la vemos hoy?';
    const typed = Math.round(interpolate(f, [4, 24], [0, msg.length], clamp));
    const reply = sp(f, 34, { damping: 14 });
    return (
      <div style={{ borderRadius: 34, overflow: 'hidden', border: '2px solid #22303A', backgroundColor: '#0B141A' }}>
        <ChatHeader name="Camila · cliente" initials="CF" status="escribiendo…" />
        <div style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 330 }}>
          {typed > 0 && <Bubble text={msg.slice(0, typed)} mine time="ahora" read={f > 28} />}
          {f >= 34 && <Bubble text="¡Sí! Me encantó, hablemos a las 15:00" time="ahora" p={reply} />}
        </div>
      </div>
    );
  }
  const move = sp(f, 6, { damping: 18 });
  const burst = interpolate(f, [16, 40], [0, 1], clamp);
  return (
    <div style={{ position: 'relative' }}>
      <Window style={{ height: 420, position: 'relative' }}>
        {[stages[2], stages[3]].map((c, k) => (
          <div key={c.id} style={{ position: 'absolute', left: 20 + k * 460, top: 20, width: 440, height: 380, borderRadius: 24, border: `2px solid ${k === 1 && burst > 0 ? 'rgba(16,185,129,0.6)' : 'rgba(38,45,61,0.9)'}`, backgroundColor: k === 1 && burst > 0 ? 'rgba(16,185,129,0.06)' : 'rgba(22,27,38,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 26px', fontSize: 32, fontWeight: 600 }}>
              <span style={{ width: 14, height: 14, borderRadius: 14, backgroundColor: c.color }} /> {c.label}
            </div>
          </div>
        ))}
        <div style={{ position: 'absolute', left: 36 + move * 460, top: 110, width: 408, boxSizing: 'border-box', padding: '26px 28px', borderRadius: 22, backgroundColor: colors.surface, border: `2px solid ${burst > 0 ? 'rgba(16,185,129,0.8)' : 'rgba(129,140,248,0.8)'}`, transform: `rotate(${Math.sin(move * Math.PI) * 4}deg) scale(${1 + Math.sin(move * Math.PI) * 0.05})` }}>
          <div style={{ fontSize: 36, fontWeight: 600 }}>Camila Fuentes</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 30 }}>
            <span style={{ color: colors.muted }}>Instagram</span>
            <span style={{ fontWeight: 700, color: burst > 0 ? '#6EE7B7' : colors.fg }}>$4.100</span>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 36 + move * 460 + 300, top: 190, opacity: interpolate(f, [0, 4, 22, 30], [0, 1, 1, 0], clamp) }}>
          <Cursor x={0} y={0} label="Tú" press={interpolate(f, [4, 8, 18, 22], [0, 1, 1, 0], clamp)} />
        </div>
      </Window>
      {burst > 0 &&
        Array.from({ length: 10 }, (_, k) => {
          const a = (k / 10) * Math.PI * 2;
          const r = 80 + burst * 260;
          return (
            <Heart key={k} size={44} fill={PINK} color={PINK} style={{ position: 'absolute', left: 700 + Math.cos(a) * r, top: 200 + Math.sin(a) * r * 0.6, opacity: 1 - burst, transform: `scale(${0.6 + burst})` }} />
          );
        })}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30, opacity: burst > 0 ? 1 : 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '16px 30px', borderRadius: 999, border: '2px solid rgba(16,185,129,0.5)', backgroundColor: 'rgba(16,185,129,0.1)', color: '#6EE7B7', fontSize: 36, fontWeight: 700 }}>
          <Trophy size={36} /> Ganado · $4.100
        </div>
      </div>
    </div>
  );
}

function Rules() {
  const start = s(18.1);
  const frame = useCurrentFrame();
  const hits = RULES.map((r) => s(r.at) - start);
  const current = hits.reduce((acc, h, i) => (frame >= h ? i : acc), 0);
  const f = frame - hits[current]!;
  const p = sp(frame, hits[current]!, { damping: 16, mass: 0.6 });
  const r = RULES[current]!;
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 230, paddingLeft: 70, paddingRight: 70 }}>
        <div key={current} style={{ width: '100%', opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - Math.min(p, 1)) * 60}px)`, filter: `blur(${Math.max(0, 1 - p) * 10}px)` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
            <span style={{ ...big, fontSize: 64, ...pinkText }}>{r.n}</span>
            <Kicker>{r.kicker} para no perder clientes</Kicker>
          </div>
          <div style={{ ...big, fontSize: 132, textAlign: 'center', marginTop: 30 }}>
            {r.a}
            <br />
            <span style={current % 2 ? gradientText : pinkText}>{r.b}</span>
          </div>
          <div style={{ marginTop: 80 }}>
            <RuleVisual i={current} f={f} />
          </div>
        </div>
      </AbsoluteFill>
      {hits.slice(1).map((h) => <Flash key={h} at={h} duration={8} />)}
    </Scene>
  );
}

// ---- 7. CTA (27.2–33): "que ya está demasiado" ---------------------------------------------

function Cta() {
  const start = s(27.2);
  const frame = useCurrentFrame();
  const head = sp(frame, s(29.18) - start, { damping: 12, mass: 0.6 });
  const url = sp(frame, s(29.77) - start, { damping: 14 });
  const tap = s(30.6) - start;
  const cur = sp(frame, tap - 12);
  const press = interpolate(frame, [tap - 2, tap, tap + 7], [0, 1, 0], clamp);
  const ring = interpolate(frame, [tap, tap + 18], [0, 1], clamp);
  const intro = interpolate(frame, [s(28.9) - start, s(29.18) - start], [1, 0], clamp);
  return (
    <Scene>
      <Hearts amount={0.5} seed={2} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 240, opacity: intro }}>
        <Words words={['Tus', 'clientes']} at={[0, 4]} size={130} />
        <Words words={['merecen', 'respuesta.']} at={[s(27.75) - start, s(28.2) - start]} size={140} weight={800} accent={[1]} />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 330, opacity: 1 - intro }}>
        <div style={{ width: 190, height: 190, borderRadius: 52, backgroundColor: '#090A12', border: `2px solid ${colors.lineStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 110px -10px rgba(244,114,182,0.6)', transform: `scale(${Math.min(head, 1.06)})` }}>
          <LogoMark size={120} id="ad4-cta" />
        </div>
        <div style={{ ...big, fontSize: 150, marginTop: 60, textAlign: 'center', transform: `scale(${0.8 + 0.2 * Math.min(head, 1)})` }}>
          Pruébalo
          <br />
          <span style={pinkText}>gratis.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 40, color: colors.muted, marginTop: 30 }}>
          <HeartHandshake size={40} color={PINK} /> Sin tarjeta · listo en minutos
        </div>
        <div style={{ position: 'relative', marginTop: 70, opacity: Math.min(1, url * 1.5), transform: `scale(${(0.75 + 0.25 * Math.min(url, 1.04)) * (1 - 0.04 * press)})` }}>
          {ring > 0 && ring < 1 && <div style={{ position: 'absolute', inset: -10, borderRadius: 40, border: '4px solid rgba(249,168,212,0.9)', transform: `scale(${1 + ring * 0.25})`, opacity: 1 - ring }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '34px 46px', borderRadius: 32, background: 'linear-gradient(180deg,#5B54F0 0%,#4F46E5 100%)', boxShadow: '0 30px 80px -20px rgba(79,70,229,0.95), inset 0 1px 0 rgba(255,255,255,0.2)', fontSize: 46, fontWeight: 700 }}>
            <Globe size={46} strokeWidth={2.2} /> flowdesk-ten-ruby.vercel.app
          </div>
          <div style={{ position: 'absolute', right: 40, top: 70, opacity: Math.min(1, cur * 2) }}>
            <Cursor x={interpolate(cur, [0, 1], [180, 0])} y={interpolate(cur, [0, 1], [220, 0])} press={press} />
          </div>
        </div>
      </AbsoluteFill>
      <Flash at={s(29.18) - start} />
    </Scene>
  );
}

const TIMELINE: [() => JSX.Element, number, number | null][] = [
  [Hook, 0, 4.2],
  [Forgotten, 4.2, 7.8],
  [Lost, 7.8, 11.4],
  [Build, 11.4, 15.72],
  [Reveal, 15.72, 18.1],
  [Rules, 18.1, 27.2],
  [Cta, 27.2, null],
];

export function TikTokAd4() {
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
      <Audio src={staticFile('audio/track4.mp3')} volume={(f) => interpolate(f, [s(31.4), durationInFrames - 1], [1, 0], clamp)} />
    </AbsoluteFill>
  );
}
