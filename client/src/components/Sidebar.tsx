import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Settings, SquareKanban, Users } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { Logo, LogoMark } from './Logo';

const NAV = [
  { to: '/', label: 'Tablero', icon: SquareKanban, end: true },
  { to: '/contactos', label: 'Contactos', icon: Users },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

const CONNECTION = {
  online: { label: 'En vivo', dot: 'bg-emerald-500' },
  connecting: { label: 'Conectando…', dot: 'bg-amber-500' },
  offline: { label: 'Sin conexión', dot: 'bg-red-500' },
} as const;

export function Sidebar() {
  const { connection } = useStore();
  const conn = CONNECTION[connection];

  return (
    <aside className="flex w-14 shrink-0 flex-col border-r border-line bg-canvas md:w-56">
      <div className="flex h-14 items-center justify-center border-b border-line px-4 md:justify-start">
        <span className="md:hidden">
          <LogoMark size={24} />
        </span>
        <span className="hidden md:block">
          <Logo />
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            className={({ isActive }) =>
              clsx(
                'flex h-8 items-center justify-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors md:justify-start',
                isActive ? 'bg-raised text-fg' : 'text-muted hover:bg-raised/60 hover:text-fg',
              )
            }
          >
            <Icon size={16} strokeWidth={1.75} />
            <span className="hidden md:inline">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center justify-center gap-2 text-xs text-subtle md:justify-start" title={conn.label}>
          <span className={clsx('h-1.5 w-1.5 rounded-full', conn.dot)} />
          <span className="hidden md:inline">{conn.label}</span>
        </div>
      </div>
    </aside>
  );
}
