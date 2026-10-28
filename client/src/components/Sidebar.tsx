import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { motion } from 'motion/react';
import { LogOut, Plug, Settings, ShieldCheck, Sparkles, SquareKanban, Sun, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useStore } from '../store/AppStore';
import { ZERO_PRICING_URL } from '../lib/zero';
import { Logo, LogoMark } from './Logo';
import { spring } from './motion';
import { PlanBadge } from './plan';
import { Avatar } from './ui';

const NAV = [
  { to: '/app/hoy', label: 'Hoy', icon: Sun, end: false },
  { to: '/app', label: 'Tablero', icon: SquareKanban, end: true },
  { to: '/app/contactos', label: 'Contactos', icon: Users },
  { to: '/app/integraciones', label: 'Integraciones', icon: Plug },
  { to: '/app/configuracion', label: 'Configuración', icon: Settings },
];

const ADMIN_NAV = { to: '/app/admin', label: 'Administración', icon: ShieldCheck, end: false };

const CONNECTION = {
  online: { label: 'En vivo', dot: 'bg-emerald-500' },
  connecting: { label: 'Conectando…', dot: 'bg-amber-500' },
  offline: { label: 'Sin conexión', dot: 'bg-red-500' },
} as const;

export function Sidebar() {
  const { connection, today } = useStore();
  const overdue = today?.stats.overdue ?? 0;
  const badge = (to: string) => (to === '/app/hoy' && overdue > 0 ? (overdue > 99 ? '99+' : overdue) : 0);
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
        {(user?.is_admin ? [...NAV, ADMIN_NAV] : NAV).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            className={({ isActive }) =>
              clsx(
                'relative flex h-8 items-center justify-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors md:justify-start',
                isActive ? 'text-fg' : 'text-muted hover:bg-raised/50 hover:text-fg',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    transition={spring}
                    className="absolute inset-0 rounded-md border border-line bg-raised"
                  />
                )}
                <Icon size={16} strokeWidth={1.75} className="relative" />
                <span className="relative hidden md:inline">{label}</span>
                {badge?.(to) ? (
                  <span className="relative ml-auto hidden min-w-[18px] rounded-full bg-red-500/90 px-1.5 text-center text-[10px] font-semibold leading-[18px] text-white md:inline">
                    {badge(to)}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center justify-center gap-2 px-3 pb-3 text-xs text-subtle md:justify-start" title={conn.label}>
        <span className={clsx('h-1.5 w-1.5 rounded-full', conn.dot)} />
        <span className="hidden md:inline">{conn.label}</span>
      </div>

      {user?.plan === 'free' && user.role === 'owner' && (
        <a
          href={ZERO_PRICING_URL}
          target="_blank"
          rel="noreferrer"
          title="Mejorar a FlowDesk Pro"
          className="mx-2 mb-2 flex h-8 items-center justify-center gap-2 rounded-md border border-line text-xs font-medium text-muted transition-colors hover:border-accent/50 hover:text-fg md:justify-start md:px-2.5"
        >
          <Sparkles size={14} className="text-accent-soft" />
          <span className="hidden md:inline">Mejorar a Pro</span>
        </a>
      )}

      {user && (
        <div className="flex flex-col items-center gap-2 border-t border-line p-2 md:flex-row md:gap-2.5 md:p-3">
          <span title={`${user.name} · ${user.email}`}>
            <Avatar name={user.name} size="sm" />
          </span>
          <PlanBadge plan={user.plan} className="md:hidden" />
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="flex items-center gap-1.5 text-xs font-medium text-fg">
              <span className="truncate">{user.name}</span>
              <PlanBadge plan={user.plan} />
            </p>
            <p className="truncate text-2xs text-subtle">{user.workspace_name ?? user.email}</p>
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
