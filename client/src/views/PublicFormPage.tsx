import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LeadCaptureForm } from '../components/LeadCaptureForm';
import { api } from '../lib/api';
import type { FormSettings } from '../lib/types';

/**
 * Public, embeddable lead form (/f/:key). Transparent background so it blends into the
 * host page inside an iframe; reports its height so the embed snippet can auto-resize.
 */
export function PublicFormPage() {
  const { key = '' } = useParams();
  const [form, setForm] = useState<{ workspace: string; settings: Omit<FormSettings, 'source'> } | null>(null);
  const [missing, setMissing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const embedded = window.self !== window.top;

  useEffect(() => {
    api.publicForm(key).then(setForm).catch(() => setMissing(true));
  }, [key]);

  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = embedded ? 'transparent' : form?.settings.theme === 'light' ? '#F3F4F6' : '';
    document.documentElement.style.colorScheme = form?.settings.theme === 'light' ? 'light' : 'dark';
    return () => {
      document.body.style.background = prev;
      document.documentElement.style.colorScheme = '';
    };
  }, [embedded, form]);

  useEffect(() => {
    if (!embedded || !ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      window.parent.postMessage({ type: 'flowdesk:height', key, height: Math.ceil(entry!.contentRect.height) + 2 }, '*');
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [embedded, key, form]);

  if (missing) {
    return <p className="p-6 text-center text-sm text-muted">Este formulario no existe o fue desactivado.</p>;
  }

  return (
    <div className={embedded ? '' : 'flex min-h-full items-center justify-center px-4 py-10'}>
      <div ref={ref} className="mx-auto w-full max-w-md p-1">
        {form && <LeadCaptureForm settings={form.settings} onSubmit={(data) => api.submitForm(key, data).then(() => {})} />}
      </div>
    </div>
  );
}
