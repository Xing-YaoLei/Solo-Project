import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  Armchair,
  ShieldCheck,
  MessageSquareWarning,
  Database,
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: '综合看板', icon: LayoutDashboard },
  { to: '/ticket-types', label: '票种分析', icon: Ticket },
  { to: '/seat-map', label: '座位图', icon: Armchair },
  { to: '/verification', label: '核销效率', icon: ShieldCheck },
  { to: '/refund-dispute', label: '退票争议', icon: MessageSquareWarning },
  { to: '/data-sync', label: '数据同步', icon: Database },
] as const;

export default function Layout() {
  const { theme, toggleTheme, sidebarCollapsed, toggleSidebar, setSidebarCollapsed } =
    useAppStore();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth < 1280);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarCollapsed]);

  return (
    <div className="flex h-screen bg-navy-950 text-slate-100">
      <aside
        className={cn(
          'flex h-full flex-col border-r border-white/5 bg-navy-900 transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-56',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/5 px-3">
          {!sidebarCollapsed && (
            <span className="font-display text-sm font-semibold tracking-wide text-cyan-400">
              票务看板
            </span>
          )}
          <button
            onClick={toggleSidebar}
            className="ml-auto rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
          >
            {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive =
              to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                )}
              >
                <Icon size={20} className="shrink-0" />
                {!sidebarCollapsed && <span>{label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-navy-900/80 px-6 backdrop-blur-sm">
          <h1 className="font-display text-base font-semibold">
            {NAV_ITEMS.find(
              (n) =>
                n.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(n.to),
            )?.label ?? '票务看板'}
          </h1>
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
