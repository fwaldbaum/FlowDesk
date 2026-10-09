import { useEffect, useRef, type ReactNode } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { Button } from './ui';

export function Header({ title, subtitle, actions }: {
  title: string;
  subtitle?: ReactNode;
  /** Replaces the lead search and "Nuevo Lead" button (e.g. in the admin panel). */
  actions?: ReactNode;
}) {
  const { search, setSearch, setNewLeadOpen } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" or Cmd/Ctrl+K focuses search, "N" opens the new-lead form.
  const leadControls = !actions;
  useEffect(() => {
    if (!leadControls) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.closest('input, textarea, select, [contenteditable="true"]');
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key.toLowerCase() === 'n' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (document.querySelector('[role="dialog"]')) return;
        e.preventDefault();
        setNewLeadOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setNewLeadOpen, leadControls]);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4 md:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-fg">{title}</h1>
        {subtitle && <p className="hidden truncate text-xs text-subtle sm:block">{subtitle}</p>}
      </div>

      {actions ?? (
      <>
      <div className="relative w-40 sm:w-64">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-subtle" />
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && (setSearch(''), e.currentTarget.blur())}
          placeholder="Buscar leads…"
          aria-label="Buscar leads"
          className="h-8 w-full rounded-md border border-line bg-surface pl-8 pr-14 text-[13px] text-fg placeholder:text-subtle transition-colors hover:border-line-strong focus:border-accent/70 focus:outline-none"
        />
        {search ? (
          <button
            aria-label="Limpiar búsqueda"
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-subtle hover:text-fg"
          >
            <X size={14} />
          </button>
        ) : (
          <span className="kbd pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 sm:inline">/</span>
        )}
      </div>

      <Button variant="primary" onClick={() => setNewLeadOpen(true)} title="Nuevo lead (N)">
        <Plus size={15} strokeWidth={2.25} />
        <span className="hidden sm:inline">Nuevo Lead</span>
      </Button>
      </>
      )}
    </header>
  );
}
