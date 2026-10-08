import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { LogOut, Settings, SquareKanban, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useStore } from '../store/AppStore';
import { Logo, LogoMark } from './Logo';
import { Avatar } from './ui';

const NAV = [
  { to: '/app', label: 'Tablero', icon: SquareKanban, end: true },
  { to: '/app/contactos', label: 'Contactos', icon: Users },
  { to: '/app/configuracion', label: 'Configuración', icon: Settings },
];

const CONNECTION = {
  online: { label: 'En vivo', dot: 'bg-emerald-500' },
  connecting: { label: 'Conectando…', dot: 'bg-amber-500' },
  offline: { label: 'Sin conexión', dot: 'bg-red-500' },
} as const;

export function Sidebar() {
  const { connection } = useStore();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const conn = CONNECTION[connection];

  const signOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

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

      <div className="flex items-center justify-center gap-2 px-3 pb-3 text-xs text-subtle md:justify-start" title={conn.label}>
        <span className={clsx('h-1.5 w-1.5 rounded-full', conn.dot)} />
        <span className="hidden md:inline">{conn.label}</span>
      </div>

      {user && (
        <div className="flex flex-col items-center gap-2 border-t border-line p-2 md:flex-row md:gap-2.5 md:p-3">
          <span title={`${user.name} · ${user.email}`}>
            <Avatar name={user.name} size="sm" />
          </span>
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="truncate text-xs font-medium text-fg">{user.name}</p>
            <p className="truncate text-2xs text-subtle">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-subtle transition-colors hover:bg-raised hover:text-fg"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}
    </aside>
  );
}
