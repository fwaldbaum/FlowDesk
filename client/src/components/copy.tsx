import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { IconButton } from './ui';

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Clipboard API is unavailable on plain-HTTP origins; fall back to a hidden textarea.
    const el = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(el);
    el.select();
    document.execCommand('copy');
    el.remove();
  }
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <IconButton
      label={copied ? 'Copiado' : 'Copiar'}
      onClick={async () => {
        await copyText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </IconButton>
  );
}

export function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-canvas">
      <div className="flex items-center justify-between border-b border-line py-1 pl-3 pr-1">
        <span className="text-2xs font-medium uppercase tracking-wide text-subtle">{label}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto px-3 py-3 font-mono text-xs leading-relaxed text-fg/90">{code}</pre>
    </div>
  );
}
