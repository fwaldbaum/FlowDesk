import { useId } from 'react';

/** FD monogram: an "F" whose stem flows into the bowl of a "D". */
export function LogoMark({ size = 24 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${id})`} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 26V13a7 7 0 0 1 7-7h5" />
        <path d="M5 16.5h7.5" />
        <path d="M17 6a10 10 0 0 1 0 20h-4.5V12" />
      </g>
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={26} />
      <span className="text-[15px] tracking-tight text-fg">
        <span className="font-bold">Flow</span>
        <span className="font-medium">Desk</span>
      </span>
    </div>
  );
}
