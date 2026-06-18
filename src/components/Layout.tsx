import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Grid3x3,
  BarChart3,
  BellRing,
  FileSearch,
  Search,
  CalendarDays,
  User,
  LogOut,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/user';
import { SyncDelayBadge } from './SyncDelayBadge';
import { mockSyncDelayInfo } from '@/data/mockData';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/risk-matrix', label: '风险矩阵', icon: Grid3x3 },
  { to: '/analytics', label: '分析图表', icon: BarChart3 },
  { to: '/management', label: '预警管理', icon: BellRing },
  { to: '/review/demo', label: '复盘', icon: FileSearch },
];

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface text-slate-200 flex">
      <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col bg-surface-elevated/70 backdrop-blur-xl border-r border-surface-border">
        <div className="h-16 flex items-center px-5 border-b border-surface-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-glow-blue">
            <Shield size={18} className="text-white" />
          </div>
          <div className="ml-3">
            <div className="font-display font-bold text-[13px] text-white leading-tight">过户材料</div>
            <div className="font-display font-bold text-[13px] text-white leading-tight">风控监测</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                  isActive
                    ? 'bg-brand-500/15 text-white shadow-glow-blue border border-brand-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                )
              }
            >
              <it.icon size={17} className="shrink-0" />
              <span className="font-medium">{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-surface-border text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
            系统运行正常 · v1.0
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 shrink-0 sticky top-0 z-30 flex items-center gap-4 px-6 bg-surface/80 backdrop-blur-xl border-b border-surface-border">
          <div className="flex-1 max-w-xl relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="搜索 VIN / 门店 / 车牌号..."
              className="w-full h-9 pl-10 pr-4 rounded-xl bg-surface-elevated/70 border border-surface-border text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-500/40 focus:bg-surface-elevated transition"
            />
          </div>

          <button className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-surface-elevated/70 border border-surface-border text-sm text-slate-300 hover:bg-surface-elevated transition">
            <CalendarDays size={15} className="text-slate-400" />
            近30天
            <ChevronDown size={13} className="text-slate-500" />
          </button>

          <SyncDelayBadge delays={mockSyncDelayInfo} />

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 h-9 pl-1 pr-3 rounded-xl bg-surface-elevated/70 border border-surface-border hover:bg-surface-elevated transition"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-medium text-xs">
                {user?.name?.[0] ?? 'A'}
              </div>
              <span className="text-sm text-slate-200">{user?.name ?? '未登录'}</span>
              <ChevronDown size={13} className="text-slate-500" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-surface-elevated border border-surface-border shadow-card py-1.5 animate-slide-up">
                <div className="px-3 py-2 border-b border-surface-border mb-1">
                  <div className="text-sm text-white font-medium">{user?.name ?? '匿名用户'}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{roleLabel(user?.role)}</div>
                </div>
                <button className="w-full px-3 py-2 text-sm text-left text-slate-300 hover:bg-white/5 flex items-center gap-2">
                  <User size={14} className="text-slate-400" /> 个人信息
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-sm text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <LogOut size={14} /> 退出登录
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function roleLabel(role?: string): string {
  switch (role) {
    case 'store_manager':
      return '门店店长';
    case 'region_ops':
      return '区域运营';
    case 'risk_admin':
      return '风控管理员';
    case 'management':
      return '总部管理层';
    default:
      return '访客';
  }
}
