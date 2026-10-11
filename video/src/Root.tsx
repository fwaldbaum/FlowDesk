import { Composition } from 'remotion';
import { FlowDeskPromo, PROMO_DURATION } from './FlowDeskPromo';

export function RemotionRoot() {
  return (
    <Composition
      id="FlowDeskPromo"
      component={FlowDeskPromo}
      durationInFrames={PROMO_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}
