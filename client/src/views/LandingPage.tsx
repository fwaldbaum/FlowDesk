import { Bento } from './landing/Bento';
import { Hero } from './landing/Hero';
import { HowItWorks } from './landing/HowItWorks';
import { Nav } from './landing/Nav';
import { Audience, Compare, Faq, FinalCta, Footer } from './landing/Sections';

export function LandingPage() {
  return (
    <div className="min-h-full overflow-x-clip bg-canvas text-fg">
      <Nav />
      <main>
        <Hero />
        <Bento />
        <HowItWorks />
        <Compare />
        <Audience />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
