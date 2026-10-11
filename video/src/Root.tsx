import { Composition } from 'remotion';
import { FlowDeskPromo, PROMO_DURATION } from './FlowDeskPromo';
import { TIKTOK_DURATION, TikTokAd } from './tiktok/TikTokAd';
import { AD2_DURATION, TikTokAd2 } from './tiktok2/Ad2';
import { AD3_DURATION, TikTokAd3 } from './tiktok3/Ad3';
import { AD4_DURATION, TikTokAd4 } from './tiktok4/Ad4';
import { AD5_DURATION, TikTokAd5 } from './tiktok5/Ad5';

export function RemotionRoot() {
  return (
    <>
      <Composition id="FlowDeskPromo" component={FlowDeskPromo} durationInFrames={PROMO_DURATION} fps={30} width={1920} height={1080} />
      <Composition id="FlowDeskTikTok" component={TikTokAd} durationInFrames={TIKTOK_DURATION} fps={30} width={1080} height={1920} />
      <Composition id="FlowDeskTikTok2" component={TikTokAd2} durationInFrames={AD2_DURATION} fps={30} width={1080} height={1920} />
      <Composition id="FlowDeskTikTok3" component={TikTokAd3} durationInFrames={AD3_DURATION} fps={30} width={1080} height={1920} />
      <Composition id="FlowDeskTikTok4" component={TikTokAd4} durationInFrames={AD4_DURATION} fps={30} width={1080} height={1920} />
      <Composition id="FlowDeskTikTok5" component={TikTokAd5} durationInFrames={AD5_DURATION} fps={30} width={1080} height={1920} />
    </>
  );
}
