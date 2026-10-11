import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import {
  AlarmClock, AtSign, Bot, CalendarCheck, Check, ClipboardList, CreditCard, FileSpreadsheet, Gamepad2, Globe, Hash,
  LayoutTemplate, Lock, Mail, Megaphone, MessageCircle, Music2, Newspaper, PanelsTopLeft, Phone,
  Send, ShoppingBag, Smartphone, Target, Timer, Workflow,
} from 'lucide-react';
import { colors, stages } from '../theme';
import { bf, clamp, Cursor, Cut, gradientText, LogoMark, Pill, sp, usePulse, Window, Words } from './kit';

const local = (start: number) => (i: number) => bf(i) - start;

// ---- Board: the drop -------------------------------------------------------------

export const BOARD = { from: 36, to: 48 };

const COL = 440;
const GAP = 24;
const CARD_H = 172;
type Card = { name: string; meta: string; value: string };
const COLUMNS: Card[][] = [
  [
    { name: 'Valentina Rojas', meta: 'Formulario web', value: '$1.800' },
    { name: 'Tomás Herrera', meta: 'TikTok Ads', value: '$4.200' },
    { name: 'Camila Fuentes', meta: 'Instagram', value: '$950' },
  ],
  [
    { name: 'Martín Vidal', meta: 'Referido', value: '$8.900' },
    { name: 'Isidora Campos', meta: 'Instagram', value: '$750' },
  ],
  [
    { name: 'Felipe Araya', meta: 'Web', value: '$2.600' },
    { name: 'Josefina Lagos', meta: 'Feria', value: '$4.100' },
  ],
  [{ name: 'Benjamín Rojas', meta: 'Referido', value: '$12.500' }],
];

function BoardCard({ card, x, y, lift = 0, won = 0 }: { card: Card; x: number; y: number; lift?: number; won?: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: COL - 32,
        height: CARD_H - 18,
        boxSizing: 'border-box',
        padding: '26px 28px',
        borderRadius: 22,
        backgroundColor: colors.surface,
        border: `2px solid ${won > 0 ? `rgba(16,185,129,${0.4 + won * 0.5})` : lift > 0 ? 'rgba(129,140,248,0.8)' : colors.line}`,
        boxShadow: lift > 0 ? `0 ${40 * lift}px ${80 * lift}px -20px rgba(0,0,0,0.95)` : 'none',
        transform: `scale(${1 + 0.05 * lift}) rotate(${2.5 * lift}deg)`,
        zIndex: lift > 0 ? 20 : 1,
      }}
    >
      <div style={{ fontSize: 36, fontWeight: 600 }}>{card.name}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 30 }}>
        <span style={{ color: colors.muted }}>{card.meta}</span>
        <span style={{ fontWeight: 700 }}>{card.value}</span>
      </div>
    </div>
  );
}

export function Board() {
  const start = bf(BOARD.from);
  const b = local(start);
  const frame = useCurrentFrame();
  const enter = sp(frame, b(37), { damping: 18, mass: 0.8 });
  const pan1 = sp(frame, b(40), { damping: 20 });
  const pan2 = sp(frame, b(42), { damping: 20 });
  const panX = (pan1 + pan2) * (COL + GAP);
  const grab = b(43);
  const drop = b(44);
  const move = sp(frame, drop, { damping: 20, mass: 0.9 });
  const lift = interpolate(frame, [grab, grab + 5, drop + 14, drop + 22], [0, 1, 1, 0], clamp);
  const won = interpolate(frame, [drop + 14, drop + 20, b(47)], [0, 1, 0.6], clamp);
  const total = Math.round(interpolate(frame, [drop + 14, drop + 30], [12500, 16600], clamp));
  const colX = (c: number) => GAP + c * (COL + GAP);
  const cardY = (i: number) => 110 + i * CARD_H;

  // Josefina: last card of "Propuesta" → top of "Ganado"
  const jx = interpolate(move, [0, 1], [colX(2) + 16, colX(3) + 16]);
  const jy = interpolate(move, [0, 1], [cardY(1), cardY(0)]);
  const cursorIn = sp(frame, grab - 14);
  const cx = interpolate(cursorIn, [0, 1], [colX(3) + 300, colX(2) + 250]) + (jx - colX(2) - 16);
  const cy = interpolate(cursorIn, [0, 1], [cardY(3), cardY(1) + 80]) + (jy - cardY(1));
  const cursorOpacity = Math.min(interpolate(frame, [grab - 14, grab - 6], [0, 1], clamp), interpolate(frame, [drop + 30, drop + 40], [1, 0], clamp));
  const slam = sp(frame, 0, { damping: 12, mass: 0.6 });

  return (
    <Cut>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 220 }}>
        <div
          style={{
            fontSize: 150,
            fontWeight: 800,
            letterSpacing: '-0.055em',
            lineHeight: 1,
            textAlign: 'center',
            transform: `scale(${2 - Math.min(slam, 1.05)})`,
            opacity: Math.min(1, slam * 1.5),
          }}
        >
          Todo en un
          <br />
          <span style={gradientText}>tablero.</span>
        </div>
        <div
          style={{
            marginTop: 80,
            width: 960,
            transform: `perspective(2000px) rotateX(${(1 - enter) * 28}deg) translateY(${(1 - enter) * 200}px)`,
            opacity: Math.min(1, enter * 1.5),
          }}
        >
          <Window style={{ height: 760, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-panX}px)` }}>
              {stages.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    position: 'absolute',
                    left: colX(i),
                    top: 24,
                    width: COL,
                    height: 712,
                    borderRadius: 26,
                    border: `2px solid ${i === 3 && won > 0 ? `rgba(16,185,129,${0.3 + won * 0.4})` : 'rgba(38,45,61,0.9)'}`,
                    backgroundColor: i === 3 && won > 0 ? `rgba(16,185,129,${0.05 * won})` : 'rgba(22,27,38,0.5)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '26px 28px', fontSize: 32, fontWeight: 600 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 16, backgroundColor: s.color }} />
                    {s.label}
                  </div>
                </div>
              ))}
              {COLUMNS.map((cards, c) =>
                cards.map((card, i) => {
                  if (card.name === 'Josefina Lagos') return null;
                  const y = c === 3 ? cardY(i) + move * CARD_H : cardY(i);
                  return <BoardCard key={card.name} card={card} x={colX(c) + 16} y={y} />;
                }),
              )}
              <BoardCard card={COLUMNS[2]![1]!} x={jx} y={jy} lift={lift} won={won} />
              <div style={{ position: 'absolute', left: cx, top: cy, opacity: cursorOpacity }}>
                <Cursor x={0} y={0} label="Camila · Ventas" press={lift} />
              </div>
            </div>
          </Window>
        </div>
        <div style={{ marginTop: 40, opacity: won > 0 ? 1 : 0, transform: `scale(${0.9 + 0.1 * Math.min(1, won * 2)})` }}>
          <Pill style={{ color: '#6EE7B7', borderColor: 'rgba(16,185,129,0.5)' }}>
            <Check size={32} strokeWidth={3} /> Ganado: ${total.toLocaleString('es-CL')}
          </Pill>
        </div>
      </AbsoluteFill>
    </Cut>
  );
}

// ---- Today -----------------------------------------------------------------------

export const TODAY = { from: 48, to: 56 };

const TASKS = [
  { t: 'Llamar a Martín Vidal', who: 'Vidal Transportes', tag: 'Vencido', red: true },
  { t: 'Enviar propuesta', who: 'Araya Contadores', tag: '10:30' },
  { t: 'Confirmar reunión', who: 'Estudio Norte', tag: '15:00' },
  { t: 'Seguimiento cotización', who: 'Café Origen', tag: 'mañana' },
];

export function Today() {
  const start = bf(TODAY.from);
  const b = local(start);
  const frame = useCurrentFrame();
  const ticks = [b(50), b(51), b(52)];
  const win = sp(frame, 4, { damping: 18 });
  return (
    <Cut>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 240, paddingLeft: 70, paddingRight: 70 }}>
        <Words words={['Sabes', 'a', 'quién', 'llamar', 'hoy.']} at={[0, 2, 4, b(49), b(49) + 3]} size={120} accent={[3, 4]} />
        <div style={{ marginTop: 70, width: 900, transform: `translateY(${(1 - win) * 160}px)`, opacity: Math.min(1, win * 1.5) }}>
          <Window title="Para hoy">
            {TASKS.map((task, i) => {
              const done = i < 3 && frame >= ticks[i]!;
              const tick = i < 3 ? sp(frame, ticks[i]!, { damping: 12 }) : 0;
              return (
                <div
                  key={task.t}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 28,
                    padding: '34px 34px',
                    borderBottom: i < TASKS.length - 1 ? `1.5px solid ${colors.line}` : 'none',
                  }}
                >
                  <span
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 56,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `3px solid ${done ? '#34D399' : colors.lineStrong}`,
                      backgroundColor: done ? '#34D399' : 'transparent',
                      color: colors.canvas,
                    }}
                  >
                    {done && <Check size={34} strokeWidth={3.5} style={{ transform: `scale(${Math.min(tick, 1.2)})` }} />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 38, fontWeight: 600, color: done ? colors.subtle : colors.fg, textDecoration: done ? 'line-through' : 'none' }}>
                      {task.t}
                    </div>
                    <div style={{ fontSize: 28, color: colors.subtle, marginTop: 4 }}>{task.who}</div>
                  </div>
                  <span
                    style={{
                      fontSize: 26,
                      padding: '6px 16px',
                      borderRadius: 999,
                      backgroundColor: task.red ? 'rgba(239,68,68,0.15)' : colors.raised,
                      color: task.red ? '#FCA5A5' : colors.muted,
                    }}
                  >
                    {task.tag}
                  </span>
                </div>
              );
            })}
          </Window>
        </div>
        <div style={{ marginTop: 40, opacity: frame >= b(53) ? 1 : 0 }}>
          <Pill>
            <AlarmClock size={30} color={colors.accentSoft} /> Recordatorios que no se olvidan
          </Pill>
        </div>
      </AbsoluteFill>
    </Cut>
  );
}

// ---- WhatsApp --------------------------------------------------------------------

export const WHATSAPP = { from: 56, to: 64 };
const MESSAGE = 'Hola Valentina, te escribo de Estudio Norte. ¿Tienes unos minutos para conversar?';

export function WhatsApp() {
  const start = bf(WHATSAPP.from);
  const b = local(start);
  const frame = useCurrentFrame();
  const tap = b(58);
  const cursorIn = sp(frame, tap - 16);
  const press = interpolate(frame, [tap - 2, tap, tap + 6], [0, 1, 0], clamp);
  const ripple = interpolate(frame, [tap, tap + 14], [0, 1], clamp);
  const chat = sp(frame, b(59), { damping: 18 });
  const typed = Math.round(interpolate(frame, [b(59) + 4, b(62)], [0, MESSAGE.length], clamp));
  const sent = frame >= b(62);
  return (
    <Cut>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 230 }}>
        <Words words={['WhatsApp', 'en', 'un', 'clic.']} at={[0, 3, 5, b(57)]} size={124} accent={[0]} />
        <div style={{ position: 'relative', marginTop: 70, width: 900 }}>
          <Window>
            <div style={{ padding: '36px 38px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
                <span style={{ width: 84, height: 84, borderRadius: 84, backgroundColor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 700 }}>VR</span>
                <div>
                  <div style={{ fontSize: 40, fontWeight: 600 }}>Valentina Rojas</div>
                  <div style={{ fontSize: 28, color: colors.muted }}>Estudio Norte · +56 9 8765 4321</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginTop: 34 }}>
                {[
                  { icon: MessageCircle, label: 'WhatsApp', on: true },
                  { icon: Phone, label: 'Llamar' },
                  { icon: Mail, label: 'Correo' },
                ].map(({ icon: Icon, label, on }) => (
                  <div
                    key={label}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      height: 92,
                      borderRadius: 18,
                      fontSize: 30,
                      fontWeight: 600,
                      border: `2px solid ${on ? 'rgba(16,185,129,0.6)' : colors.line}`,
                      backgroundColor: on ? 'rgba(16,185,129,0.12)' : 'transparent',
                      color: on ? '#6EE7B7' : colors.muted,
                      transform: on ? `scale(${1 - 0.06 * press})` : undefined,
                    }}
                  >
                    {on && ripple > 0 && ripple < 1 && (
                      <span
                        style={{
                          position: 'absolute',
                          width: 400,
                          height: 400,
                          borderRadius: 400,
                          backgroundColor: 'rgba(110,231,183,0.35)',
                          transform: `scale(${ripple})`,
                          opacity: 1 - ripple,
                        }}
                      />
                    )}
                    <Icon size={34} strokeWidth={2.2} /> {label}
                  </div>
                ))}
              </div>
            </div>
          </Window>
          <div style={{ position: 'absolute', left: interpolate(cursorIn, [0, 1], [700, 180]), top: interpolate(cursorIn, [0, 1], [700, 230]), opacity: Math.min(1, cursorIn * 2) * (1 - chat) }}>
            <Cursor x={0} y={0} press={press} />
          </div>
          <div
            style={{
              marginTop: 40,
              borderRadius: 34,
              overflow: 'hidden',
              border: '2px solid #22303A',
              backgroundColor: '#0B141A',
              transform: `translateY(${(1 - chat) * 300}px)`,
              opacity: Math.min(1, chat * 1.5),
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '24px 30px', backgroundColor: '#1F2C33' }}>
              <span style={{ width: 60, height: 60, borderRadius: 60, backgroundColor: '#2A3942', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#E9EDEF' }}>VR</span>
              <span style={{ fontSize: 32, fontWeight: 600, color: '#E9EDEF' }}>Valentina Rojas</span>
            </div>
            <div style={{ padding: 30, minHeight: 190 }}>
              <div style={{ marginLeft: 'auto', maxWidth: '88%', padding: '22px 26px', borderRadius: 22, borderTopRightRadius: 6, backgroundColor: '#005C4B', color: '#E9EDEF', fontSize: 32, lineHeight: 1.4 }}>
                {MESSAGE.slice(0, typed)}
                {!sent && <span style={{ opacity: frame % 16 < 8 ? 1 : 0 }}>|</span>}
                {sent && <div style={{ textAlign: 'right', fontSize: 22, color: 'rgba(233,237,239,0.6)', marginTop: 6 }}>ahora · enviado</div>}
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 36, opacity: sent ? 1 : 0 }}>
          <Pill>
            <Check size={30} color="#6EE7B7" strokeWidth={3} /> Queda registrado en el historial
          </Pill>
        </div>
      </AbsoluteFill>
    </Cut>
  );
}

// ---- Team ------------------------------------------------------------------------

export const TEAM = { from: 64, to: 72 };

const MATES = [
  { name: 'Camila · Ventas', color: '#4F46E5', path: [[120, 260], [520, 180], [560, 520], [180, 600]] },
  { name: 'Matías · Soporte', color: '#0E7490', path: [[620, 640], [200, 420], [600, 300], [640, 700]] },
  { name: 'Ana · Gerencia', color: '#B45309', path: [[300, 760], [660, 520], [160, 200], [420, 380]] },
] as const;

export function Team() {
  const start = bf(TEAM.from);
  const b = local(start);
  const frame = useCurrentFrame();
  const steps = [b(65), b(67), b(69), b(71)];
  const pulse = usePulse(start);
  const win = sp(frame, 4, { damping: 18 });
  return (
    <Cut>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 230 }}>
        <Words words={['Tu', 'equipo,', 'en', 'vivo.']} at={[0, 3, b(65), b(65) + 3]} size={130} accent={[2, 3]} />
        <div style={{ position: 'relative', marginTop: 70, width: 900, height: 900, transform: `translateY(${(1 - win) * 160}px)`, opacity: Math.min(1, win * 1.5) }}>
          <Window style={{ height: 900 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '28px 34px', borderBottom: `1.5px solid ${colors.line}` }}>
              <span style={{ fontSize: 34, fontWeight: 600 }}>Tablero</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 26, color: colors.subtle }}>
                <span style={{ width: 14, height: 14, borderRadius: 14, backgroundColor: '#10B981', boxShadow: `0 0 ${8 + pulse * 14}px #10B981` }} /> En vivo
              </span>
              <span style={{ marginLeft: 'auto', display: 'flex' }}>
                {MATES.map((m, i) => (
                  <span
                    key={m.name}
                    style={{ width: 58, height: 58, borderRadius: 58, marginLeft: i ? -14 : 0, border: `3px solid ${colors.canvas}`, backgroundColor: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}
                  >
                    {m.name[0]}
                  </span>
                ))}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 24 }}>
              {[stages[0], stages[1]].map((s, c) => (
                <div key={s.id} style={{ borderRadius: 24, border: '2px solid rgba(38,45,61,0.9)', backgroundColor: 'rgba(22,27,38,0.5)', padding: 18, height: 720, boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 28, fontWeight: 600, padding: '6px 8px 18px' }}>
                    <span style={{ width: 14, height: 14, borderRadius: 14, backgroundColor: s.color }} /> {s.label}
                  </div>
                  {COLUMNS[c]!.slice(0, 3).map((card) => (
                    <div key={card.name} style={{ padding: '22px 22px', marginBottom: 16, borderRadius: 18, backgroundColor: colors.surface, border: `2px solid ${colors.line}` }}>
                      <div style={{ fontSize: 30, fontWeight: 600 }}>{card.name}</div>
                      <div style={{ fontSize: 24, color: colors.muted, marginTop: 6 }}>{card.meta} · {card.value}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Window>
          {MATES.map((m, i) => {
            let x: number = m.path[0][0];
            let y: number = m.path[0][1];
            for (let k = 0; k < steps.length; k++) {
              const p = sp(frame, steps[k]! + i * 3, { damping: 20 });
              const to = m.path[(k + 1) % m.path.length]!;
              const from = m.path[k % m.path.length]!;
              x += (to[0] - from[0]) * p;
              y += (to[1] - from[1]) * p;
            }
            return <Cursor key={m.name} x={x} y={y} label={m.name} color={m.color} />;
          })}
        </div>
      </AbsoluteFill>
    </Cut>
  );
}

// ---- Integrations -----------------------------------------------------------------

export const INTEGRATIONS = { from: 72, to: 80 };

const APPS = [
  { name: 'TikTok', icon: Music2, color: '#FF3B6B' },
  { name: 'Facebook', icon: Target, color: '#1877F2' },
  { name: 'Instagram', icon: AtSign, color: '#E1306C' },
  { name: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
  { name: 'Google Ads', icon: Megaphone, color: '#FBBC04' },
  { name: 'LinkedIn', icon: Newspaper, color: '#0A66C2' },
  { name: 'ManyChat', icon: Bot, color: '#0084FF' },
  { name: 'Make', icon: Workflow, color: '#A855F7' },
  { name: 'WordPress', icon: Newspaper, color: '#21759B' },
  { name: 'Wix', icon: PanelsTopLeft, color: '#FAAD4D' },
  { name: 'Shopify', icon: ShoppingBag, color: '#95BF47' },
  { name: 'Webflow', icon: LayoutTemplate, color: '#4353FF' },
  { name: 'Typeform', icon: ClipboardList, color: '#A78BFA' },
  { name: 'Google Forms', icon: ClipboardList, color: '#7248B9' },
  { name: 'Calendly', icon: CalendarCheck, color: '#006BFF' },
  { name: 'Gmail', icon: Mail, color: '#EA4335' },
  { name: 'Sheets', icon: FileSpreadsheet, color: '#0F9D58' },
  { name: 'Discord', icon: Gamepad2, color: '#5865F2' },
  { name: 'Slack', icon: Hash, color: '#E01E5A' },
  { name: 'Telegram', icon: Send, color: '#26A5E4' },
];

export function Integrations() {
  const start = bf(INTEGRATIONS.from);
  const b = local(start);
  const frame = useCurrentFrame();
  const count = Math.round(interpolate(frame, [0, b(77)], [0, 20], { ...clamp, easing: (t) => 1 - (1 - t) ** 2 }));
  return (
    <Cut>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 210 }}>
        <div style={{ fontSize: 210, fontWeight: 800, letterSpacing: '-0.06em', lineHeight: 1, ...gradientText }}>+{count}</div>
        <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: '-0.04em', marginTop: 4 }}>integraciones</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 200px)', gap: 20, marginTop: 70 }}>
          {APPS.map((a, i) => {
            const beat = INTEGRATIONS.from + Math.floor(i / 4);
            const p = sp(frame, b(beat) + (i % 4) * 2, { damping: 13, mass: 0.6 });
            const Icon = a.icon;
            return (
              <div
                key={a.name}
                style={{
                  height: 150,
                  borderRadius: 26,
                  border: `2px solid ${a.color}44`,
                  backgroundColor: `${a.color}14`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                  opacity: Math.min(1, p * 1.5),
                  transform: `scale(${Math.min(p, 1.08)})`,
                }}
              >
                <Icon size={50} color={a.color} strokeWidth={2} />
                <span style={{ fontSize: 26, fontWeight: 600 }}>{a.name}</span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Cut>
  );
}

// ---- Benefits ----------------------------------------------------------------------

export const BENEFITS = { from: 80, to: 88 };

const POINTS = [
  { icon: CreditCard, line1: 'Sin tarjeta', line2: 'de crédito.', beat: 80 },
  { icon: Timer, line1: 'Listo en', line2: 'minutos.', beat: 82 },
  { icon: Lock, line1: 'Tus datos,', line2: 'privados.', beat: 84 },
  { icon: Smartphone, line1: 'También en', line2: 'tu celular.', beat: 86 },
];

export function Benefits() {
  const start = bf(BENEFITS.from);
  const b = local(start);
  const frame = useCurrentFrame();
  const current = POINTS.reduce((acc, p, i) => (frame >= b(p.beat) ? i : acc), 0);
  const pt = POINTS[current]!;
  const p = sp(frame, b(pt.beat), { damping: 12, mass: 0.6 });
  const Icon = pt.icon;
  return (
    <Cut>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 200 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 70 }}>
          {POINTS.map((x, i) => (
            <span key={x.line1} style={{ width: i === current ? 60 : 18, height: 18, borderRadius: 18, backgroundColor: i <= current ? colors.accentSoft : colors.lineStrong }} />
          ))}
        </div>
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(79,70,229,0.16)',
            border: '2px solid rgba(129,140,248,0.45)',
            boxShadow: '0 0 120px -20px rgba(99,102,241,0.7)',
            transform: `scale(${Math.min(p, 1.1)}) rotate(${(1 - Math.min(p, 1)) * -20}deg)`,
          }}
        >
          <Icon size={110} color="#A5B4FC" strokeWidth={1.8} />
        </div>
        <div
          key={current}
          style={{
            marginTop: 70,
            fontSize: 150,
            fontWeight: 800,
            letterSpacing: '-0.055em',
            lineHeight: 1,
            textAlign: 'center',
            opacity: Math.min(1, p * 1.4),
            transform: `translateY(${(1 - Math.min(p, 1)) * 80}px)`,
            filter: `blur(${Math.max(0, 1 - p) * 10}px)`,
          }}
        >
          {pt.line1}
          <br />
          <span style={gradientText}>{pt.line2}</span>
        </div>
      </AbsoluteFill>
    </Cut>
  );
}

// ---- Call to action -------------------------------------------------------------------

export const CTA = { from: 88 };
const URL_TEXT = 'flowdesk-ten-ruby.vercel.app';

export function Cta() {
  const start = bf(CTA.from);
  const b = local(start);
  const frame = useCurrentFrame();
  const pulse = usePulse(start, 2);
  const logo = sp(frame, 0, { damping: 13, mass: 0.6 });
  const link = sp(frame, b(91), { damping: 14 });
  const tap = b(94);
  const cursorIn = sp(frame, tap - 14);
  const press = interpolate(frame, [tap - 2, tap, tap + 7], [0, 1, 0], clamp);
  const ring = interpolate(frame, [tap, tap + 18], [0, 1], clamp);
  return (
    <Cut>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 45% at 50% 42%, rgba(79,70,229,0.4), transparent 70%)' }} />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 300 }}>
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: 60,
            border: `2px solid ${colors.lineStrong}`,
            backgroundColor: colors.canvas,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 ${80 + pulse * 50}px -10px rgba(99,102,241,0.75)`,
            transform: `scale(${Math.min(logo, 1.06) + pulse * 0.02})`,
          }}
        >
          <LogoMark size={140} id="cta-logo" />
        </div>
        <Words words={['Empieza', 'gratis', 'hoy.']} at={[b(89), b(89) + 3, b(90)]} size={150} accent={[1]} style={{ marginTop: 70, fontWeight: 800 }} />
        <div style={{ fontSize: 40, color: colors.muted, marginTop: 26, opacity: interpolate(frame, [b(90) + 4, b(91)], [0, 1], clamp) }}>
          Crea tu cuenta en menos de un minuto
        </div>
        <div style={{ position: 'relative', marginTop: 80, transform: `scale(${(0.7 + 0.3 * Math.min(link, 1.04)) * (1 - 0.04 * press)})`, opacity: Math.min(1, link * 1.5) }}>
          {ring > 0 && ring < 1 && (
            <div style={{ position: 'absolute', inset: -10, borderRadius: 40, border: '4px solid rgba(165,180,252,0.9)', transform: `scale(${1 + ring * 0.25})`, opacity: 1 - ring }} />
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              padding: '34px 46px',
              borderRadius: 32,
              background: 'linear-gradient(180deg, #5B54F0 0%, #4F46E5 100%)',
              boxShadow: '0 30px 80px -20px rgba(79,70,229,0.95), inset 0 1px 0 rgba(255,255,255,0.2)',
              fontSize: 46,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            <Globe size={46} strokeWidth={2.2} />
            {URL_TEXT}
          </div>
          <div style={{ position: 'absolute', right: 40, top: 70, opacity: Math.min(1, cursorIn * 2) }}>
            <Cursor x={interpolate(cursorIn, [0, 1], [180, 0])} y={interpolate(cursorIn, [0, 1], [220, 0])} press={press} />
          </div>
        </div>
      </AbsoluteFill>
    </Cut>
  );
}
