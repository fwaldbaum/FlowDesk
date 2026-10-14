declare global {
  interface Window {
    /** Set by the zerosolutions.cl proxy when FlowDesk is served under /flowdesk. */
    __FD_BASE__?: string;
  }
}

/** Path prefix FlowDesk runs under: '/flowdesk' on zerosolutions.cl, '' on its own domain. */
export const BASE =
  typeof window !== 'undefined' && /^\/[a-z0-9-]+$/.test(window.__FD_BASE__ ?? '') ? window.__FD_BASE__! : '';

export const withBase = (path: string) => `${BASE}${path}`;

/** Public address of this FlowDesk, for URLs shown to users (webhook, form embed, snippets). */
export const publicUrl = () => `${window.location.origin}${BASE}`;
