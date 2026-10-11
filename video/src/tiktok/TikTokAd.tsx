import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useVideoConfig } from 'remotion';
import { AUDIO_DURATION } from './beats';
import { Backdrop, bf, FPS } from './kit';
import { ARRIVALS, Arrivals, CHAOS, Chaos, HOOK, Hook, REVEAL, Reveal } from './scenes1';
import { BENEFITS, Benefits, BOARD, Board, CTA, Cta, INTEGRATIONS, Integrations, TEAM, Team, TODAY, Today, WHATSAPP, WhatsApp } from './scenes2';

export const TIKTOK_DURATION = Math.ceil(AUDIO_DURATION * FPS);

/** Scenes cut on the beat: [component, first beat, beat where the next scene starts]. */
const TIMELINE = [
  [Hook, HOOK.from, HOOK.to],
  [Chaos, CHAOS.from, CHAOS.to],
  [Reveal, REVEAL.from, REVEAL.to],
  [Arrivals, ARRIVALS.from, ARRIVALS.to],
  [Board, BOARD.from, BOARD.to],
  [Today, TODAY.from, TODAY.to],
  [WhatsApp, WHATSAPP.from, WHATSAPP.to],
  [Team, TEAM.from, TEAM.to],
  [Integrations, INTEGRATIONS.from, INTEGRATIONS.to],
  [Benefits, BENEFITS.from, BENEFITS.to],
  [Cta, CTA.from, null],
] as const;

export function TikTokAd() {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Backdrop offset={0} />
      {TIMELINE.map(([Scene, from, to], i) => {
        const start = i === 0 ? 0 : bf(from);
        const end = to === null ? durationInFrames : bf(to);
        return (
          <Sequence key={i} from={start} durationInFrames={end - start}>
            <Scene />
          </Sequence>
        );
      })}
      <Audio
        src={staticFile('audio/billy.mp3')}
        volume={(f) => interpolate(f, [durationInFrames - 45, durationInFrames - 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
      />
    </AbsoluteFill>
  );
}
