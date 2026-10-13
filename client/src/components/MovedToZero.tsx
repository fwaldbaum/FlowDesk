import { useEffect } from 'react';
import { ZERO_URL } from '../lib/zero';

/** Replaces the landing page once FlowDesk has moved: a branded hand-off to zerosolutions.cl. */
export function MovedToZero() {
  useEffect(() => {
    window.location.replace(ZERO_URL);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-canvas px-6 text-center text-fg">
      <div className="flex items-center gap-3">
        <img src="/brand/zero-mark.svg" alt="" width={40} height={40} />
        <img src="/brand/zero-word-light.svg" alt="ZERO" className="h-6 w-auto" />
      </div>
      <div>
        <h1 className="text-lg font-semibold">FlowDesk ahora es parte de ZERO Solutions</h1>
        <p className="mt-1 text-sm text-muted">Te estamos llevando a zerosolutions.cl…</p>
      </div>
      <a href={ZERO_URL} className="text-sm font-medium text-[#60A5FA] hover:text-fg">
        Ir ahora
      </a>
    </div>
  );
}
