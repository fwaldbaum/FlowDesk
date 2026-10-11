import type { CSSProperties } from 'react';
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { AtSign, CalendarCheck, Check, FileText, Globe, Megaphone, MessageCircle, Phone, Target, Trophy, Webhook } from 'lucide-react';
import { colors, fontFamily } from '../theme';
import { clamp, Cursor, FPS, gradientText, LogoMark, sp } from '../tiktok/kit';

/**
 * Track 7: "Done with the ex… move on to the next" over a ~99 BPM beat, 15 s. The ad is a stack
 * of leads: each "done" stamps one as LISTO and "next" swipes it away. From the loudest part of
 * the track it switches to one lead per beat while a counter climbs. Times come from whisper
 * word timestamps and librosa onsets.
 */
export const AD7_SECONDS = 15.21;
export const AD7_DURATION = Math.ceil(AD7_SECONDS * FPS);
const s = (t: number) => Math.round(t * FPS);

const GREEN = '#34D399';
const RAPID = [7.48, 8.08, 8.64, 9.22, 9.82, 10.43, 11.03];
const BEATS = [0.21, 0.81, 1.42, 2.02, 2.6, 3.23, 3.85, 4.46, 5.06, 5.69, 6.29, 6.9, 7.48, 8.08, 8.64, 9.22, 9.82, 10.43, 11.03, 11.63, 12.19, 12.75, 13.33, 13.96, 14.56, 15.16];

type Lead = { name: string; company: string; source: string; icon: typeof Globe; color: string; value: string; done: string; doneIcon: typeof Globe };

const LEADS: Lead[] = [
  { name: 'Camila Fuentes', company: 'Café Origen', source: 'Instagram', icon: AtSign, color: '#E1306C', value: '$4.100', done: 'Ganado', doneIcon: Trophy },
  { name: 'Tomás Herrera', company: 'Herrera Logística', source: 'TikTok Ads', icon: Megaphone, color: '#FF3B6B', value: '$4.200', done: 'Cotización enviada', doneIcon: FileText },
  { name: 'Valentina Rojas', company: 'Estudio Norte', source: 'Formulario web', icon: Globe, color: '#818CF8', value: '$1.800', done: 'WhatsApp enviado', doneIcon: MessageCircle },
  { name: 'Diego Morales', company: 'Morales Dental', source: 'Facebook Ads', icon: Target, color: '#1877F2', value: '$3.100', done: 'Reunión agendada', doneIcon: CalendarCheck },
  { name: 'Sofía Pérez', company: 'Pérez & Co.', source: 'Webhook', icon: Webhook, color: '#A5B4FC', value: '$2.600', done: 'Llamada hecha', doneIcon: Phone },
  { name: 'Martín Vidal', company: 'Vidal Transportes', source: 'Referido', icon: Globe, color: '#22D3EE', value: '$8.900', done: 'Ganado', doneIcon: Trophy },
  { name: 'Isidora Campos', company: 'Yoga Prana', source: 'Instagram', icon: AtSign, color: '#E1306C', value: '$750', done: 'WhatsApp enviado', doneIcon: MessageCircle },
  { name: 'Felipe Araya', company: 'Araya Contadores', source: 'Formulario web', icon: Globe, color: '#818CF8', value: '$2.600', done: 'Propuesta enviada', doneIcon: FileText },
  { name: 'Josefina Lagos', company: 'Mapuche Arte', source: 'TikTok Ads', icon: Megaphone, color: '#FF3B6B', value: '$4.100', done: 'Ganado', doneIcon: Trophy },
];

/** When each card is stamped and when it swipes away. */
const SCHEDULE = [
  { stamp: 0.79, exit: 3.07 },
  { stamp: 5.69, exit: 6.9 },
  ...RAPID.map((t) => ({ stamp: t, exit: t + 0.3 })),
];

const hype: CSSProperties = { fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 0.95, textTransform: 'uppercase' };

function usePulse(frame: number) {
  const last = BEATS.reduce((acc, b) => (frame >= s(b) ? s(b) : acc), -999);
  return interpolate(frame - last, [0, 8], [1, 0], clamp);
}

function Backdrop() {
  const frame = useCurrentFrame();
  const pulse = usePulse(frame);
  const rapid = interpolate(frame, [s(7.3), s(7.6), s(11.4), s(11.7)], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: '#07080D' }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 40% at 50% 46%, rgba(99,102,241,${0.26 + pulse * 0.12}), transparent 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 35% at 50% 55%, rgba(52,211,153,${0.16 * rapid + pulse * 0.06 * rapid}), transparent 70%)` }} />
      {/* Speed lines during the rapid section */}
      <AbsoluteFill style={{ opacity: rapid * 0.5, backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 120px)', backgroundPosition: `${-(frame * 40) % 120}px 0` }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 90% 75% at 50% 45%, transparent 55%, rgba(0,0,0,0.65) 100%)' }} />
    </AbsoluteFill>
  );
}

function LeadCard({ lead, stamp }: { lead: Lead; stamp: number }) {
  const Icon = lead.icon;
  const DoneIcon = lead.doneIcon;
  return (
    <div style={{ position: 'relative', width: 860, padding: '44px 46px', boxSizing: 'border-box', borderRadius: 44, backgroundColor: colors.surface, border: `3px solid ${stamp > 0 ? `rgba(52,211,153,${0.4 + 0.5 * Math.min(stamp, 1)})` : colors.lineStrong}`, boxShadow: '0 60px 120px -40px rgba(0,0,0,0.95)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
        <span style={{ width: 110, height: 110, borderRadius: 110, backgroundColor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, fontWeight: 800 }}>
          {lead.name.split(' ').map((p) => p[0]).join('')}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: '-0.02em' }}>{lead.name}</div>
          <div style={{ fontSize: 32, color: colors.muted, marginTop: 4 }}>{lead.company}</div>
        </div>
        <div style={{ fontSize: 50, fontWeight: 800 }}>{lead.value}</div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 34 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderRadius: 16, backgroundColor: `${lead.color}1F`, color: lead.color, fontSize: 30, fontWeight: 600 }}>
          <Icon size={30} /> {lead.source}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderRadius: 16, backgroundColor: stamp > 0 ? 'rgba(52,211,153,0.14)' : colors.raised, color: stamp > 0 ? '#6EE7B7' : colors.muted, fontSize: 30, fontWeight: 600 }}>
          <DoneIcon size={30} /> {stamp > 0 ? lead.done : 'Pendiente'}
        </span>
      </div>
      {stamp > 0 && (
        <div style={{ position: 'absolute', right: -20, top: -84, padding: '14px 34px', border: `7px solid ${GREEN}`, borderRadius: 20, color: GREEN, fontSize: 76, fontWeight: 900, letterSpacing: '0.04em', backgroundColor: 'rgba(7,8,13,0.85)', transform: `rotate(-10deg) scale(${2.2 - 1.2 * Math.min(stamp, 1)})`, opacity: Math.min(1, stamp * 2) }}>
          LISTO
        </div>
      )}
    </div>
  );
}

function Stack() {
  const frame = useCurrentFrame();
  const current = SCHEDULE.reduce((acc, sc, i) => (frame >= s(sc.exit) ? i + 1 : acc), 0);
  const visible = [current - 1, current, current + 1, current + 2].filter((i) => i >= 0 && i < LEADS.length);
  const hide = interpolate(frame, [s(11.4), s(11.63)], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: 'center', top: 760, opacity: hide }}>
      <div style={{ position: 'relative', width: 860, height: 420 }}>
        {visible
          .slice()
          .reverse()
          .map((i) => {
            const sc = SCHEDULE[i];
            const depth = i - current;
            // Settle into the front slot after the previous card leaves.
            const prevExit = i === 0 ? 0 : s(SCHEDULE[i - 1]!.exit);
            const promote = sp(frame, prevExit, { damping: 18 });
            const d = depth > 0 ? depth : 0;
            const slot = depth === 0 ? 1 - Math.min(promote, 1) : d;
            const exit = sc ? interpolate(frame, [s(sc.exit), s(sc.exit) + 9], [0, 1], { ...clamp, easing: (x) => x * x }) : 0;
            const stamp = sc && frame >= s(sc.stamp) ? sp(frame, s(sc.stamp), { damping: 10, mass: 0.5 }) : 0;
            const dir = i % 2 ? 1 : -1;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transform: `translate(${exit * dir * 1300}px, ${slot * 46 - exit * 120}px) rotate(${exit * dir * 22}deg) scale(${1 - slot * 0.06})`,
                  opacity: depth > 2 ? 0 : 1 - slot * 0.25,
                  zIndex: 10 - Math.max(depth, 0),
                }}
              >
                <LeadCard lead={LEADS[i]!} stamp={stamp} />
              </div>
            );
          })}
      </div>
    </AbsoluteFill>
  );
}

/** Headline that swaps on the lyric cues. */
function Headline() {
  const frame = useCurrentFrame();
  const lines: { at: number; text: string; color?: string; grad?: boolean }[] = [
    { at: 0.19, text: 'Listo.', color: GREEN },
    { at: 2.58, text: 'Siguiente.', grad: true },
    { at: 4.46, text: 'Le escribes.' },
    { at: 5.06, text: 'Le cotizas.' },
    { at: 5.69, text: 'Listo.', color: GREEN },
    { at: 6.29, text: 'Siguiente.', grad: true },
    { at: 7.48, text: 'Uno tras otro.' },
  ];
  const idx = lines.reduce((acc, l, i) => (frame >= s(l.at) ? i : acc), -1);
  if (idx < 0 || frame >= s(11.5)) return null;
  const l = lines[idx]!;
  const p = sp(frame, s(l.at), { damping: 11, mass: 0.5 });
  return (
    <AbsoluteFill style={{ alignItems: 'center', top: 330, fontFamily }}>
      <div key={idx} style={{ ...hype, fontSize: 140, textAlign: 'center', color: l.color ?? colors.fg, transform: `scale(${1.5 - 0.5 * Math.min(p, 1)})`, opacity: Math.min(1, p * 2), ...(l.grad ? gradientText : null) }}>
        {l.text}
      </div>
    </AbsoluteFill>
  );
}

function Counter() {
  const frame = useCurrentFrame();
  const n = SCHEDULE.filter((sc) => frame >= s(sc.stamp)).length;
  const last = SCHEDULE.reduce((acc, sc) => (frame >= s(sc.stamp) ? s(sc.stamp) : acc), -999);
  const pop = interpolate(frame - last, [0, 7], [1, 0], clamp);
  const show = interpolate(frame, [s(0.79), s(1.0), s(11.4), s(11.63)], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: 'center', top: 1290, fontFamily, opacity: show }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 36px', borderRadius: 999, border: '2px solid rgba(52,211,153,0.45)', backgroundColor: 'rgba(52,211,153,0.1)', transform: `scale(${1 + pop * 0.12})` }}>
        <span style={{ width: 54, height: 54, borderRadius: 54, backgroundColor: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#07080D' }}>
          <Check size={36} strokeWidth={3.5} />
        </span>
        <span style={{ fontSize: 64, fontWeight: 900, color: '#ECFDF5', fontVariantNumeric: 'tabular-nums' }}>{n}</span>
        <span style={{ fontSize: 38, fontWeight: 600, color: '#A7F3D0' }}>{n === 1 ? 'lead atendido hoy' : 'leads atendidos hoy'}</span>
      </div>
    </AbsoluteFill>
  );
}

function Kicker() {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [s(0.4), s(0.8), s(11.3), s(11.5)], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: 'center', top: 230, fontFamily, opacity: o }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 24px', borderRadius: 999, border: '1.5px solid rgba(129,140,248,0.35)', backgroundColor: 'rgba(79,70,229,0.12)', color: '#C7D2FE', fontSize: 28, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        <LogoMark size={30} id="ad7-kicker" /> Así se trabaja con FlowDesk
      </div>
    </AbsoluteFill>
  );
}

function Cta() {
  const frame = useCurrentFrame();
  const start = s(11.63);
  if (frame < start) return null;
  const f = frame - start;
  const head = sp(f, 0, { damping: 12, mass: 0.6 });
  const logo = sp(f, s(12.19) - start, { damping: 12, mass: 0.6 });
  const cta = sp(f, s(12.75) - start, { damping: 13 });
  const url = sp(f, s(13.33) - start, { damping: 13 });
  const tap = s(13.96) - start;
  const cur = sp(f, tap - 12);
  const press = interpolate(f, [tap - 2, tap, tap + 7], [0, 1, 0], clamp);
  const ring = interpolate(f, [tap, tap + 16], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ fontFamily, color: colors.fg, alignItems: 'center', paddingTop: 250 }}>
      <div style={{ ...hype, fontSize: 104, textAlign: 'center', opacity: Math.min(1, head * 1.5), transform: `scale(${1.3 - 0.3 * Math.min(head, 1)})` }}>
        Ningún lead
        <br />
        <span style={gradientText}>se queda atrás.</span>
      </div>
      <div style={{ marginTop: 70, width: 220, height: 220, borderRadius: 60, backgroundColor: '#0B0F17', border: `2px solid ${colors.lineStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 120px -10px rgba(99,102,241,0.85)', transform: `scale(${Math.min(logo, 1.08)})`, opacity: Math.min(1, logo * 2) }}>
        <LogoMark size={140} id="ad7-cta" />
      </div>
      <div style={{ fontSize: 58, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 46, opacity: Math.min(1, cta * 1.5), transform: `translateY(${(1 - Math.min(cta, 1)) * 30}px)` }}>
        ¿Siguiente paso? <span style={{ color: GREEN }}>Pruébalo gratis.</span>
      </div>
      <div style={{ position: 'relative', marginTop: 60, opacity: Math.min(1, url * 1.5), transform: `scale(${(0.75 + 0.25 * Math.min(url, 1.04)) * (1 - 0.04 * press)})` }}>
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

/** Quick white flash on the swipe-heavy moments. */
function Flash() {
  const frame = useCurrentFrame();
  const hits = [0.79, 3.07, 5.69, 7.48, 11.63].map(s);
  const last = hits.reduce((acc, h) => (frame >= h ? h : acc), -999);
  const o = interpolate(frame - last, [0, 1, 6], [0, 0.3, 0], clamp);
  return <AbsoluteFill style={{ backgroundColor: '#fff', opacity: o, pointerEvents: 'none' }} />;
}

export function TikTokAd7() {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const pulse = usePulse(frame);
  return (
    <AbsoluteFill style={{ fontFamily, color: colors.fg }}>
      <Backdrop />
      <AbsoluteFill style={{ transform: `scale(${1 + pulse * 0.015})` }}>
        <Kicker />
        <Headline />
        <Stack />
        <Counter />
        <Cta />
      </AbsoluteFill>
      <Flash />
      <Audio src={staticFile('audio/track7.mp3')} volume={(f) => interpolate(f, [durationInFrames - 12, durationInFrames - 1], [1, 0], clamp)} />
    </AbsoluteFill>
  );
}
