import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { AlarmClock, Check, Coffee, Globe, Megaphone, AtSign, Phone as PhoneIcon, Sparkles, Trophy } from 'lucide-react';
import { colors, fontFamily, stages } from '../theme';
import { clamp, Cursor, FPS, LogoMark, sp, Window } from '../tiktok/kit';

/**
 * Track 6 is a steady ~129 BPM instrumental, 15 s long: a "POV: your sales day in 15 seconds".
 * A big clock jumps forward on the strong hits and each hour shows one FlowDesk moment. Light
 * backdrop with the app's dark windows floating on it, so it stands out from the other ads.
 */
export const AD6_SECONDS = 15.02;
export const AD6_DURATION = Math.ceil(AD6_SECONDS * FPS);
const s = (t: number) => Math.round(t * FPS);

const BEATS = [0.09, 0.58, 1.02, 1.46, 1.86, 2.28, 2.65, 3.11, 3.58, 4.04, 4.48, 4.95, 5.41, 5.87, 6.32, 6.78, 7.24, 7.71, 8.17, 8.64, 9.1, 9.57, 10.03, 10.5, 10.96, 11.42, 11.87, 12.33, 12.79, 13.26, 13.72, 14.16];

const INK = '#0B0F17';
const INK_MUTED = '#5B6476';
const PAPER = '#F4F5FB';

const SLOTS = [
  { at: 0, time: '08:59', day: 'Lunes' },
  { at: 2.28, time: '09:00', day: 'Lunes' },
  { at: 3.78, time: '10:30', day: 'Lunes' },
  { at: 6.32, time: '12:15', day: 'Lunes' },
  { at: 7.83, time: '15:00', day: 'Lunes' },
  { at: 9.66, time: '18:00', day: 'Lunes' },
];

const indigoText: CSSProperties = {
  backgroundImage: 'linear-gradient(100deg, #4F46E5 0%, #6366F1 50%, #3B82F6 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  paddingBottom: '0.08em',
};

function usePulse(frame: number) {
  const last = BEATS.reduce((acc, b) => (frame >= s(b) ? s(b) : acc), -999);
  return interpolate(frame - last, [0, 8], [1, 0], clamp);
}

// ---- Look ---------------------------------------------------------------------------

function Paper() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(79,70,229,0.16) 2px, transparent 2px)', backgroundSize: '44px 44px', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 45%, #000 20%, transparent 90%)' }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 30% at ${30 + Math.sin(t) * 10}% 30%, rgba(99,102,241,0.22), transparent 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 50% 30% at ${72 - Math.sin(t * 0.8) * 10}% 75%, rgba(59,130,246,0.16), transparent 70%)` }} />
    </AbsoluteFill>
  );
}

/** Rolling-digit clock that lives across every scene until the CTA. */
function Clock() {
  const frame = useCurrentFrame();
  const pulse = usePulse(frame);
  const idx = SLOTS.reduce((acc, sl, i) => (frame >= s(sl.at) ? i : acc), 0);
  const cur = SLOTS[idx]!;
  const prev = SLOTS[Math.max(0, idx - 1)]!;
  const roll = idx === 0 ? 1 : interpolate(frame, [s(cur.at), s(cur.at) + 7], [0, 1], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 });
  const hide = interpolate(frame, [s(11.0), s(11.25)], [1, 0], clamp);
  const enter = sp(frame, 0, { damping: 14 });
  return (
    <div style={{ position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: hide * Math.min(1, enter * 1.5), transform: `translateY(${(1 - Math.min(enter, 1)) * -40}px)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '22px 40px', borderRadius: 999, backgroundColor: '#fff', boxShadow: `0 20px 50px -20px rgba(15,23,42,0.35), 0 0 0 ${2 + pulse * 3}px rgba(99,102,241,${0.15 + pulse * 0.25})`, transform: `scale(${1 + pulse * 0.03})` }}>
        <AlarmClock size={56} color="#4F46E5" strokeWidth={2.2} />
        <div style={{ position: 'relative', height: 92, overflow: 'hidden', fontFamily, fontSize: 92, fontWeight: 800, letterSpacing: '-0.03em', color: INK, fontVariantNumeric: 'tabular-nums', width: 270 }}>
          {idx > 0 && roll < 1 && <div style={{ position: 'absolute', top: -roll * 92, lineHeight: '92px' }}>{prev.time}</div>}
          <div style={{ position: 'absolute', top: (1 - roll) * 92, lineHeight: '92px' }}>{cur.time}</div>
        </div>
        <span style={{ fontFamily, fontSize: 34, fontWeight: 600, color: INK_MUTED }}>{cur.day}</span>
      </div>
    </div>
  );
}

function Scene({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 8], [0, 1], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 });
  return <AbsoluteFill style={{ fontFamily, color: INK, opacity: p, transform: `translateY(${(1 - p) * 120}px)`, filter: `blur(${(1 - p) * 10}px)` }}>{children}</AbsoluteFill>;
}

function Caption({ a, b, at = 0 }: { a: string; b: string; at?: number }) {
  const frame = useCurrentFrame();
  const p = sp(frame, at, { damping: 15 });
  return (
    <div style={{ textAlign: 'center', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.02, fontSize: 104, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - Math.min(p, 1)) * 40}px)` }}>
      {a}
      <br />
      <span style={indigoText}>{b}</span>
    </div>
  );
}

const shadow = '0 60px 120px -40px rgba(15,23,42,0.55), 0 0 0 1px rgba(15,23,42,0.06)';

// ---- 1. Hook (0–2.28) ----------------------------------------------------------------

function Hook() {
  const frame = useCurrentFrame();
  const words = [
    { t: 'POV:', at: 0.09, size: 130, color: '#4F46E5' },
    { t: 'tu día de ventas', at: 0.44, size: 120 },
    { t: 'en 15 segundos.', at: 0.79, size: 120, grad: true },
  ];
  return (
    <AbsoluteFill style={{ fontFamily, color: INK, alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
      {words.map((w) => {
        const p = sp(frame, s(w.at), { damping: 12, mass: 0.5 });
        return (
          <div key={w.t} style={{ fontSize: w.size, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.05, color: w.color, opacity: frame >= s(w.at) ? Math.min(1, p * 1.6) : 0, transform: `scale(${1.3 - 0.3 * Math.min(p, 1)})`, ...(w.grad ? indigoText : null) }}>
            {w.t}
          </div>
        );
      })}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 50, fontSize: 40, fontWeight: 600, color: INK_MUTED, opacity: interpolate(frame, [s(1.46), s(1.7)], [0, 1], clamp) }}>
        <Coffee size={40} /> Con FlowDesk
      </div>
    </AbsoluteFill>
  );
}

// ---- 2. 09:00 Leads arrive (2.28–3.78) ---------------------------------------------------

function Leads() {
  const start = s(2.28);
  const frame = useCurrentFrame();
  const leads = [
    { n: 'Tomás Herrera', src: 'TikTok Ads', icon: Megaphone, c: '#FF3B6B', at: 2.65 },
    { n: 'Valentina Rojas', src: 'Formulario web', icon: Globe, c: '#818CF8', at: 3.11 },
    { n: 'Camila Fuentes', src: 'Instagram', icon: AtSign, c: '#E1306C', at: 3.58 },
  ];
  const shown = leads.filter((l) => frame >= s(l.at) - start);
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 420, paddingLeft: 70, paddingRight: 70 }}>
        <Caption a="Llegan leads" b="mientras tomas café." />
        <div style={{ width: '100%', marginTop: 70, borderRadius: 34, boxShadow: shadow, color: colors.fg }}>
          <Window title={`Nuevo Lead · ${shown.length}`}>
            <div style={{ padding: 24, minHeight: 520, boxSizing: 'border-box' }}>
              {[...shown].reverse().map((l, k) => {
                const p = sp(frame, s(l.at) - start, { damping: 13, mass: 0.6 });
                const Icon = l.icon;
                return (
                  <div key={l.n} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 26px', marginBottom: 14, borderRadius: 22, backgroundColor: k === 0 ? '#1A1D33' : colors.surface, border: `2px solid ${k === 0 ? 'rgba(99,102,241,0.8)' : colors.line}`, color: colors.fg, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - Math.min(p, 1)) * -60}px)` }}>
                    <span style={{ width: 66, height: 66, borderRadius: 18, backgroundColor: `${l.c}22`, color: l.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={34} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 36, fontWeight: 600 }}>{l.n}</div>
                      <div style={{ fontSize: 26, color: colors.muted }}>{l.src} · justo ahora</div>
                    </div>
                    {k === 0 && <span style={{ fontSize: 24, fontWeight: 600, color: colors.accentSoft }}>Nuevo</span>}
                  </div>
                );
              })}
            </div>
          </Window>
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- 3. 10:30 Today (3.78–6.32) ---------------------------------------------------------

function Today() {
  const start = s(3.78);
  const frame = useCurrentFrame();
  const tasks = [
    { t: 'Llamar a Tomás', at: 4.48, tag: 'Vencido', red: true },
    { t: 'Enviar cotización a Valentina', at: 4.95, tag: '10:30' },
    { t: 'Responder a Camila', at: 5.41, tag: '11:00' },
    { t: 'Agendar reunión', at: 5.87, tag: '12:00' },
  ];
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 420, paddingLeft: 70, paddingRight: 70 }}>
        <Caption a="Abres «Hoy»" b="y sabes qué hacer." />
        <div style={{ width: '100%', marginTop: 70, borderRadius: 34, boxShadow: shadow, color: colors.fg }}>
          <Window title="Para hoy">
            {tasks.map((task, k) => {
              const at = s(task.at) - start;
              const done = frame >= at;
              const tick = sp(frame, at, { damping: 11 });
              return (
                <div key={task.t} style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '30px 32px', color: colors.fg, borderBottom: k < 3 ? `1.5px solid ${colors.line}` : 'none' }}>
                  <span style={{ width: 52, height: 52, borderRadius: 52, flexShrink: 0, border: `3px solid ${done ? '#34D399' : colors.lineStrong}`, backgroundColor: done ? '#34D399' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.canvas, transform: `scale(${done ? 0.8 + 0.2 * Math.min(tick, 1.15) : 1})` }}>
                    {done && <Check size={32} strokeWidth={3.5} />}
                  </span>
                  <span style={{ flex: 1, fontSize: 34, fontWeight: 600, color: done ? colors.subtle : colors.fg, textDecoration: done ? 'line-through' : 'none' }}>{task.t}</span>
                  <span style={{ fontSize: 24, padding: '6px 14px', borderRadius: 999, backgroundColor: task.red && !done ? 'rgba(239,68,68,0.15)' : colors.raised, color: task.red && !done ? '#FCA5A5' : colors.muted }}>{done ? 'Hecho' : task.tag}</span>
                </div>
              );
            })}
          </Window>
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- 4. 12:15 WhatsApp (6.32–7.83) -----------------------------------------------------

function WhatsApp() {
  const start = s(6.32);
  const frame = useCurrentFrame();
  const clean = 'Hola Camila! Te envío la propuesta';
  const typed = Math.round(interpolate(frame, [2, s(6.95) - start], [0, clean.length], clamp));
  const reply = sp(frame, s(7.24) - start, { damping: 13 });
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 420, paddingLeft: 70, paddingRight: 70 }}>
        <Caption a="Le escribes" b="en un clic." />
        <div style={{ width: '100%', marginTop: 70, borderRadius: 34, overflow: 'hidden', backgroundColor: '#0B141A', boxShadow: shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '24px 30px', backgroundColor: '#1F2C33' }}>
            <span style={{ width: 68, height: 68, borderRadius: 68, backgroundColor: '#2A3942', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#E9EDEF' }}>CF</span>
            <div style={{ fontSize: 36, fontWeight: 600, color: '#E9EDEF' }}>Camila Fuentes</div>
            <PhoneIcon size={30} color="#E9EDEF" style={{ marginLeft: 'auto' }} />
          </div>
          <div style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 360, boxSizing: 'border-box' }}>
            <div style={{ alignSelf: 'flex-end', maxWidth: '84%', padding: '22px 26px', borderRadius: 26, borderTopRightRadius: 6, backgroundColor: '#005C4B', color: '#E9EDEF', fontSize: 34 }}>
              {clean.slice(0, typed)}
              <div style={{ textAlign: 'right', fontSize: 22, color: 'rgba(233,237,239,0.6)', marginTop: 4 }}>12:15</div>
            </div>
            {frame >= s(7.24) - start && (
              <div style={{ alignSelf: 'flex-start', maxWidth: '84%', padding: '22px 26px', borderRadius: 26, borderTopLeftRadius: 6, backgroundColor: '#202C33', color: '#E9EDEF', fontSize: 34, opacity: Math.min(1, reply * 1.5), transform: `scale(${0.85 + 0.15 * Math.min(reply, 1)})`, transformOrigin: '0 0' }}>
                ¡Perfecto! ¿Nos juntamos a las 15:00?
                <div style={{ textAlign: 'right', fontSize: 22, color: '#8696A0', marginTop: 4 }}>12:16</div>
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- 5. 15:00 Team moves the deal (7.83–9.66) ---------------------------------------------

function Team() {
  const start = s(7.83);
  const frame = useCurrentFrame();
  const move = sp(frame, s(8.17) - start + 4, { damping: 18 });
  const lift = interpolate(frame, [s(8.17) - start, s(8.17) - start + 4, s(8.64) - start + 6, s(9.1) - start], [0, 1, 1, 0], clamp);
  const COL = 440;
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 420, paddingLeft: 70, paddingRight: 70 }}>
        <Caption a="Tu equipo" b="avanza el trato." />
        <div style={{ width: '100%', marginTop: 70, borderRadius: 34, boxShadow: shadow, color: colors.fg }}>
          <Window style={{ height: 520, position: 'relative' }}>
            {[stages[1], stages[2]].map((st, k) => (
              <div key={st.id} style={{ position: 'absolute', left: 20 + k * (COL + 20), top: 20, width: COL, height: 480, borderRadius: 24, border: '2px solid rgba(38,45,61,0.9)', backgroundColor: 'rgba(22,27,38,0.5)', color: colors.fg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 26px', fontSize: 32, fontWeight: 600 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 14, backgroundColor: st.color }} /> {st.label}
                </div>
              </div>
            ))}
            <div style={{ position: 'absolute', left: 36 + move * (COL + 20), top: 110, width: COL - 32, boxSizing: 'border-box', padding: '26px 28px', borderRadius: 22, backgroundColor: colors.surface, color: colors.fg, border: `2px solid ${lift > 0 ? 'rgba(129,140,248,0.85)' : colors.line}`, boxShadow: lift > 0 ? '0 30px 60px -16px rgba(0,0,0,0.95)' : 'none', transform: `rotate(${lift * 3}deg) scale(${1 + lift * 0.05})` }}>
              <div style={{ fontSize: 36, fontWeight: 600 }}>Camila Fuentes</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 30 }}>
                <span style={{ color: colors.muted }}>Reunión 15:00</span>
                <span style={{ fontWeight: 700 }}>$4.100</span>
              </div>
            </div>
            <div style={{ position: 'absolute', left: 36 + move * (COL + 20) + 300, top: 190, opacity: interpolate(frame, [s(8.17) - start - 6, s(8.17) - start, s(9.1) - start, s(9.4) - start], [0, 1, 1, 0], clamp) }}>
              <Cursor x={0} y={0} label="Matías · Ventas" color="#0E7490" press={lift} />
            </div>
          </Window>
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- 6. 18:00 Won (9.66–11.17) ----------------------------------------------------------

function Won() {
  const start = s(9.66);
  const frame = useCurrentFrame();
  const total = Math.round(interpolate(frame, [4, s(10.96) - start], [0, 16600], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 }));
  const p = sp(frame, 0, { damping: 12, mass: 0.6 });
  const burst = interpolate(frame, [0, 26], [0, 1], clamp);
  const deals = [
    { n: 'Camila Fuentes', v: '$4.100', at: 10.03 },
    { n: 'Tomás Herrera', v: '$4.200', at: 10.5 },
    { n: 'Martín Vidal', v: '$8.300', at: 10.96 },
  ];
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 420, paddingLeft: 70, paddingRight: 70 }}>
        <Caption a="Y cierras" b="el día así:" />
        <div style={{ position: 'relative', marginTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {Array.from({ length: 12 }, (_, k) => {
            const a = (k / 12) * Math.PI * 2;
            const r = 120 + burst * 360;
            return <Sparkles key={k} size={40} color={k % 2 ? '#4F46E5' : '#10B981'} style={{ position: 'absolute', left: Math.cos(a) * r - 20 + 0, top: 110 + Math.sin(a) * r * 0.6, opacity: 1 - burst }} />;
          })}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 30px', borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.14)', color: '#047857', fontSize: 36, fontWeight: 700, transform: `scale(${Math.min(p, 1.08)})` }}>
            <Trophy size={36} /> Ganado hoy
          </div>
          <div style={{ fontSize: 200, fontWeight: 800, letterSpacing: '-0.05em', marginTop: 20, fontVariantNumeric: 'tabular-nums', color: '#059669' }}>${total.toLocaleString('es-CL')}</div>
        </div>
        <div style={{ width: '100%', marginTop: 30, borderRadius: 34, boxShadow: shadow, color: colors.fg }}>
          <Window title="Ganado">
            <div style={{ padding: 22 }}>
              {deals.map((d) => {
                const q = sp(frame, s(d.at) - start, { damping: 13 });
                return (
                  <div key={d.n} style={{ display: 'flex', justifyContent: 'space-between', padding: '22px 26px', marginBottom: 12, borderRadius: 20, backgroundColor: colors.surface, color: colors.fg, border: '2px solid rgba(16,185,129,0.55)', fontSize: 32, fontWeight: 600, opacity: frame >= s(d.at) - start ? Math.min(1, q * 1.5) : 0, transform: `translateX(${(1 - Math.min(q, 1)) * 120}px)` }}>
                    <span>{d.n}</span>
                    <span style={{ color: '#6EE7B7' }}>{d.v}</span>
                  </div>
                );
              })}
            </div>
          </Window>
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ---- 7. CTA (11.17–end) ------------------------------------------------------------------

function Cta() {
  const start = s(11.17);
  const frame = useCurrentFrame();
  const line = sp(frame, 0, { damping: 13 });
  const logo = sp(frame, s(11.87) - start, { damping: 12, mass: 0.6 });
  const head = sp(frame, s(12.33) - start, { damping: 13 });
  const url = sp(frame, s(12.79) - start, { damping: 13 });
  const tap = s(13.72) - start;
  const cur = sp(frame, tap - 12);
  const press = interpolate(frame, [tap - 2, tap, tap + 7], [0, 1, 0], clamp);
  const ring = interpolate(frame, [tap, tap + 16], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ fontFamily, color: INK, alignItems: 'center', paddingTop: 230 }}>
      <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: '-0.05em', textAlign: 'center', lineHeight: 1.05, opacity: Math.min(1, line * 1.5), transform: `translateY(${(1 - Math.min(line, 1)) * 30}px)` }}>
        Tu día puede
        <br />
        <span style={indigoText}>ser así.</span>
      </div>
      <div style={{ marginTop: 80, width: 220, height: 220, borderRadius: 60, backgroundColor: '#0B0F17', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 40px 80px -24px rgba(79,70,229,0.7)', transform: `scale(${Math.min(logo, 1.08)}) rotate(${(1 - Math.min(logo, 1)) * -18}deg)`, opacity: Math.min(1, logo * 2) }}>
        <LogoMark size={140} id="ad6-logo" />
      </div>
      <div style={{ fontSize: 150, letterSpacing: '-0.055em', marginTop: 40, opacity: Math.min(1, head * 2), transform: `translateY(${(1 - Math.min(head, 1)) * 40}px)` }}>
        <span style={{ fontWeight: 800 }}>Flow</span>
        <span style={{ fontWeight: 500 }}>Desk</span>
      </div>
      <div style={{ fontSize: 44, fontWeight: 600, color: INK_MUTED, marginTop: 10, opacity: Math.min(1, head * 2) }}>Pruébalo gratis · sin tarjeta</div>
      <div style={{ position: 'relative', marginTop: 60, opacity: Math.min(1, url * 1.5), transform: `scale(${(0.75 + 0.25 * Math.min(url, 1.04)) * (1 - 0.04 * press)})` }}>
        {ring > 0 && ring < 1 && <div style={{ position: 'absolute', inset: -10, borderRadius: 40, border: '4px solid rgba(79,70,229,0.7)', transform: `scale(${1 + ring * 0.25})`, opacity: 1 - ring }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '34px 46px', borderRadius: 32, background: 'linear-gradient(180deg,#5B54F0 0%,#4F46E5 100%)', boxShadow: '0 30px 70px -20px rgba(79,70,229,0.8), inset 0 1px 0 rgba(255,255,255,0.25)', fontSize: 46, fontWeight: 700, color: '#fff' }}>
          <Globe size={46} strokeWidth={2.2} /> flowdesk-ten-ruby.vercel.app
        </div>
        <div style={{ position: 'absolute', right: 40, top: 70, opacity: Math.min(1, cur * 2) }}>
          <Cursor x={interpolate(cur, [0, 1], [160, 0])} y={interpolate(cur, [0, 1], [200, 0])} press={press} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

const TIMELINE: [() => JSX.Element, number, number | null][] = [
  [Hook, 0, 2.28],
  [Leads, 2.28, 3.78],
  [Today, 3.78, 6.32],
  [WhatsApp, 6.32, 7.83],
  [Team, 7.83, 9.66],
  [Won, 9.66, 11.17],
  [Cta, 11.17, null],
];

export function TikTokAd6() {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Paper />
      {TIMELINE.map(([Comp, from, to], i) => {
        const start = s(from);
        const end = to === null ? durationInFrames : s(to);
        return (
          <Sequence key={i} from={start} durationInFrames={end - start}>
            <Comp />
          </Sequence>
        );
      })}
      <Clock />
      <Audio src={staticFile('audio/track6.mp3')} volume={(f) => interpolate(f, [durationInFrames - 12, durationInFrames - 1], [1, 0], clamp)} />
    </AbsoluteFill>
  );
}
