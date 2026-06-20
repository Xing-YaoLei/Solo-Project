import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  MapPin,
  HandCoins,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import useAppStore from '@/store/useAppStore';
import { cn } from '@/lib/utils';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const menuItems: MenuItem[] = [
  { path: '/', label: '数据概览', icon: LayoutDashboard },
  { path: '/pipeline', label: '同步管线', icon: GitBranch },
  { path: '/seatmap', label: '座位热力', icon: MapPin },
  { path: '/sponsorship', label: '赞助管理', icon: HandCoins },
  { path: '/verification', label: '核销分析', icon: ClipboardList },
  { path: '/ticket-rank', label: '票种排行', icon: BarChart3 },
  { path: '/refund', label: '退票监控', icon: AlertTriangle },
];

export default function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        'relative h-screen flex flex-col border-r border-panel-border bg-ocean-dark/85 backdrop-blur-md transition-all duration-300 ease-out shrink-0',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="h-16 flex items-center gap-3 px-5 border-b border-panel-border/60 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-primary to-purple-sponsor flex items-center justify-center shadow-glow-cyan shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-display font-bold text-white text-base leading-tight tracking-wide">
              MP0415
            </span>
            <span className="text-[11px] text-white/45 tracking-widest uppercase">
              Control Center
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-lg h-11 transition-all duration-200',
                  collapsed ? 'justify-center px-0' : 'px-4',
                  isActive
                    ? 'bg-cyan-primary/10 text-cyan-glow'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r bg-cyan-glow shadow-[0_0_10px_rgba(0,240,255,0.8),0_0_20px_rgba(0,240,255,0.4)]" />
                  )}
                  <Icon
                    className={cn(
                      'w-5 h-5 shrink-0 transition-all duration-200',
                      isActive && 'drop-shadow-[0_0_6px_rgba(0,240,255,0.7)]'
                    )}
                  />
                  {!collapsed && (
                    <span className="font-medium text-sm tracking-wide whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-ocean-light border border-panel-border flex items-center justify-center text-white/70 hover:text-cyan-glow hover:border-cyan-primary/60 transition-all duration-200 shadow-card z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      <div
        className={cn(
          'border-t border-panel-border/60 px-4 py-3 shrink-0',
          collapsed && 'px-2'
        )}
      >
        {collapsed ? (
          <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-orange-warning to-red-danger flex items-center justify-center text-white font-bold text-sm shadow-glow-orange">
            YL
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-warning to-red-danger flex items-center justify-center text-white font-bold shadow-glow-orange shrink-0">
              YL
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-white truncate">
                姚乐毅
              </span>
              <span className="text-[11px] text-white/45 truncate">
                运营管理员
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
