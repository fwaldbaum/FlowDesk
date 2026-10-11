import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { AtSign, Bell, FileSpreadsheet, Mail, MessageCircle, Webhook, Globe, Megaphone, Target } from 'lucide-react';
import { colors } from '../theme';
import { bf, clamp, Cut, LogoMark, Pill, sp, useIn, usePulse, Window, Words } from './kit';

/** Local frame of beat `i` for a scene that starts at absolute frame `start`. */
const local = (start: number) => (i: number) => bf(i) - start;

// ---- Hook: question that stops the scroll ------------------------------------------

export const HOOK = { from: 0, to: 4 };

export function Hook() {
  const b = local(0);
  return (
    <Cut>
      <AbsoluteFill style={{ justifyContent: 'center', padding: '0 90px' }}>
        <Words
          words={['¿Cuántos', 'clientes', 'perdiste', 'este', 'mes?']}
          at={[0, b(0), b(1), b(2), b(2) + 4]}
          size={156}
          accent={[2]}
          align="left"
        />
      </AbsoluteFill>
    </Cut>
  );
}

// ---- Chaos: leads scattered across apps ---------------------------------------------

export const CHAOS = { from: 4, to: 12 };

const NOTIFS = [
  { icon: MessageCircle, app: 'WhatsApp', color: '#25D366', text: '¿Me envías la cotización?', x: 70, y: 380, r: -4 },
  { icon: AtSign, app: 'Instagram', color: '#E1306C', text: 'Hola! precio del servicio?', x: 230, y: 640, r: 3 },
  { icon: Mail, app: 'Correo', color: '#EA4335', text: 'Re: Re: Re: propuesta', x: 90, y: 900, r: -2 },
  { icon: FileSpreadsheet, app: 'Excel', color: '#0F9D58', text: 'clientes_FINAL_v7.xlsx', x: 250, y: 1160, r: 4 },
];

export function Chaos() {
  const start = bf(CHAOS.from);
  const b = local(start);
  const frame = useCurrentFrame();
  const shake = frame >= b(10) ? Math.sin(frame * 2.2) * interpolate(frame, [b(10), b(11)], [14, 0], clamp) : 0;
  const fall = interpolate(frame, [b(11) - 2, b(12)], [0, 1], clamp);
  return (
    <Cut>
      {NOTIFS.map((n, i) => {
        const p = sp(frame, b(i), { damping: 14, mass: 0.7 });
        const Icon = n.icon;
        return (
          <div
            key={n.app}
            style={{
              position: 'absolute',
              left: n.x + shake,
              top: n.y + fall * (600 + i * 120),
              width: 760,
              padding: '28px 32px',
              borderRadius: 30,
              backgroundColor: 'rgba(22,27,38,0.92)',
              border: `1.5px solid ${colors.lineStrong}`,
              boxShadow: '0 40px 80px -30px rgba(0,0,0,0.9)',
              display: 'flex',
              gap: 24,
              alignItems: 'center',
              opacity: Math.min(1, p) * (1 - fall),
              transform: `translateY(${(1 - p) * 120}px) rotate(${n.r + fall * (i % 2 ? 18 : -18)}deg) scale(${0.85 + 0.15 * Math.min(p, 1)})`,
            }}
          >
            <span
              style={{
                width: 88,
                height: 88,
                borderRadius: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `${n.color}22`,
                color: n.color,
                flexShrink: 0,
              }}
            >
              <Icon size={46} strokeWidth={2} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 28, color: colors.subtle, fontWeight: 600 }}>{n.app} · sin responder</div>
              <div style={{ fontSize: 38, fontWeight: 600, marginTop: 4 }}>{n.text}</div>
            </div>
          </div>
        );
      })}
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 420 }}>
        <Words
          words={['Todo', 'desordenado.']}
          at={[b(6), b(7)]}
          size={120}
          style={{ textShadow: '0 10px 40px rgba(0,0,0,0.8)', opacity: 1 - fall }}
        />
      </AbsoluteFill>
    </Cut>
  );
}

// ---- Reveal: FlowDesk on a bold indigo field ----------------------------------------

export const REVEAL = { from: 12, to: 20 };

export function Reveal() {
  const start = bf(REVEAL.from);
  const b = local(start);
  const frame = useCurrentFrame();
  const wipe = interpolate(frame, [0, 8], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const draw = interpolate(frame, [b(13), b(15)], [0, 1], clamp);
  const word = useIn(b(16), { damping: 13, mass: 0.6 });
  const tag = useIn(b(18));
  const pulse = usePulse(start);
  return (
    <AbsoluteFill style={{ fontFamily: 'Inter', color: '#fff' }}>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 90% 60% at 50% 40%, #6366F1 0%, #4F46E5 45%, #312E81 100%)',
          clipPath: `circle(${wipe * 150}% at 50% 50%)`,
        }}
      />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 50 }}>
        <div style={{ fontSize: 54, fontWeight: 500, opacity: interpolate(frame, [4, 12], [0, 0.85], clamp) }}>Por eso existe</div>
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: 80,
            backgroundColor: colors.canvas,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 40px 120px -20px rgba(0,0,0,0.6), 0 0 ${60 + pulse * 60}px rgba(165,180,252,${0.25 + pulse * 0.25})`,
            transform: `scale(${1 + pulse * 0.03})`,
          }}
        >
          <LogoMark size={190} draw={draw} id="reveal-logo" />
        </div>
        <div style={{ fontSize: 190, letterSpacing: '-0.05em', transform: `scale(${0.6 + 0.4 * Math.min(word, 1.05)})`, opacity: Math.min(1, word * 2) }}>
          <span style={{ fontWeight: 800 }}>Flow</span>
          <span style={{ fontWeight: 500 }}>Desk</span>
        </div>
        <div style={{ fontSize: 50, fontWeight: 500, opacity: tag, transform: `translateY(${(1 - tag) * 30}px)`, color: 'rgba(255,255,255,0.88)' }}>
          El CRM de leads, simple.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ---- Arrivals: leads land on their own ---------------------------------------------

export const ARRIVALS = { from: 20, to: 36 };

const INCOMING = [
  { name: 'Valentina Rojas', source: 'Formulario web', icon: Globe, color: '#818CF8', value: '$1.800' },
  { name: 'Tomás Herrera', source: 'TikTok Ads', icon: Megaphone, color: '#FF3B6B', value: '$4.200' },
  { name: 'Camila Fuentes', source: 'Instagram', icon: AtSign, color: '#E1306C', value: '$950' },
  { name: 'Diego Morales', source: 'Facebook Ads', icon: Target, color: '#1877F2', value: '$3.100' },
  { name: 'Sofía Pérez', source: 'Webhook', icon: Webhook, color: '#A5B4FC', value: '$2.600' },
];

export function Arrivals() {
  const start = bf(ARRIVALS.from);
  const b = local(start);
  const frame = useCurrentFrame();
  const arriveAt = [b(22), b(24), b(26), b(28), b(30)];
  const count = arriveAt.filter((f) => frame >= f).length;
  const latest = count - 1;
  const zoom = interpolate(frame, [0, b(36)], [1.04, 0.96], clamp);
  return (
    <Cut>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 230 }}>
        <Words words={['Tus', 'leads', 'llegan', 'solos.']} at={[0, 3, b(21), b(21) + 4]} size={118} accent={[2, 3]} />
        <div style={{ marginTop: 60, transform: `scale(${zoom})` }}>
          <Window style={{ width: 880 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '28px 34px', borderBottom: `1.5px solid ${colors.line}` }}>
              <span style={{ width: 16, height: 16, borderRadius: 16, backgroundColor: '#3B82F6' }} />
              <span style={{ fontSize: 36, fontWeight: 600 }}>Nuevo Lead</span>
              <span style={{ fontSize: 28, color: colors.muted, backgroundColor: colors.raised, padding: '2px 14px', borderRadius: 10 }}>{count}</span>
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 26, color: colors.subtle }}>
                <span style={{ width: 12, height: 12, borderRadius: 12, backgroundColor: '#10B981' }} /> En vivo
              </span>
            </div>
            <div style={{ position: 'relative', height: 840, padding: 22 }}>
              {INCOMING.map((l, i) => {
                if (frame < arriveAt[i]!) return null;
                const p = sp(frame, arriveAt[i]!, { damping: 15, mass: 0.6 });
                const slot = count - 1 - i; // newest on top
                const Icon = l.icon;
                const fresh = i === latest;
                return (
                  <div
                    key={l.name}
                    style={{
                      position: 'absolute',
                      left: 22,
                      right: 22,
                      top: 22 + slot * 162,
                      height: 146,
                      boxSizing: 'border-box',
                      padding: '24px 28px',
                      borderRadius: 22,
                      backgroundColor: fresh ? '#1A1D33' : colors.surface,
                      border: `2px solid ${fresh ? 'rgba(99,102,241,0.8)' : colors.line}`,
                      boxShadow: fresh ? '0 0 50px -10px rgba(99,102,241,0.6)' : 'none',
                      transform: `translateY(${(1 - p) * -60}px)`,
                      opacity: Math.min(1, p * 1.4),
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 38, fontWeight: 600 }}>{l.name}</span>
                      <span style={{ fontSize: 34, fontWeight: 600 }}>{l.value}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, fontSize: 28, color: colors.muted }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 14px', borderRadius: 10, backgroundColor: `${l.color}1F`, color: l.color }}>
                        <Icon size={26} strokeWidth={2.2} /> {l.source}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: 26, color: colors.subtle }}>justo ahora</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Window>
        </div>
        <div style={{ marginTop: 34, opacity: frame >= arriveAt[0]! ? 1 : 0 }}>
          <Pill>
            <Bell size={30} color={colors.accentSoft} /> {count} {count === 1 ? 'lead nuevo' : 'leads nuevos'} sin mover un dedo
          </Pill>
        </div>
      </AbsoluteFill>
    </Cut>
  );
}

