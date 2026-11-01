import { Bento } from './landing/Bento';
import { Hero } from './landing/Hero';
import { HowItWorks } from './landing/HowItWorks';
import { Nav } from './landing/Nav';
import { Playground } from './landing/Playground';
import { Pricing } from './landing/Pricing';
import { Audience, Compare, Faq, FinalCta, Footer } from './landing/Sections';
import { useEffect } from 'react';
import { ZeroAnnouncement } from '../components/ZeroAnnouncement';
import { BASE } from '../lib/base';
import { ZERO_FLOWDESK_URL, ZERO_MOVE_AT } from '../lib/zero';

export function LandingPage() {
  // A tab left open across the move still goes to ZERO at the right moment.
  useEffect(() => {
    const wait = ZERO_MOVE_AT - Date.now();
    if (BASE || wait <= 0 || wait > 24 * 60 * 60 * 1000) return;
    const timer = setTimeout(() => window.location.replace(ZERO_FLOWDESK_URL), wait);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-full overflow-x-clip bg-canvas text-fg">
      <Nav />
      <main>
        <Hero />
        <Bento />
        <Playground />
        <HowItWorks />
        <Compare />
        <Audience />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <ZeroAnnouncement />
    </div>
  );
}
