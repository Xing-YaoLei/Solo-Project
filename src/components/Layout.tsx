import { useAuthStore } from '@/stores/authStore';
import { useRouter } from '@tanstack/react-router';
import {
  ClipboardCheck,
  AlertTriangle,
  Download,
  BarChart3,
  LogOut,
  Pill,
  ChevronRight,
} from 'lucide-react';
import type { ReactNode } from 'react';

const navItems = [
  { path: '/', label: '审核工作台', icon: ClipboardCheck },
  { path: '/exceptions', label: '异常管理', icon: AlertTriangle },
  { path: '/export', label: '数据导出', icon: Download },
  { path: '/dashboard', label: '仪表盘', icon: BarChart3 },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  if (currentPath === '/login') {
    return <>{children}</>;
  }

  const roleLabels: Record<string, string> = {
    auditor: '审核员',
    pharmacist: '门店药师',
    manager: '区域经理',
    admin: '系统管理员',
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-brand-500 text-white flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-brand-400/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              <Pill className="w-5 h-5 text-mint-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight">处方审核跟进台</h1>
              <p className="text-2xs text-brand-200 mt-0.5">药店连锁管理系统</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-3">
          {navItems.map((item) => {
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => router.navigate({ to: item.path })}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-1 transition-all ${
                  isActive
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-brand-100 hover:bg-white/8 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-3">
          <div className="bg-brand-600/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-mint-400/20 flex items-center justify-center text-mint-400 text-xs font-semibold">
                {user?.username?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.username || '未登录'}</p>
                <p className="text-2xs text-brand-200">{user?.role ? roleLabels[user.role] : ''}</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                router.navigate({ to: '/login' });
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-2xs text-brand-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              退出登录
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="h-full overflow-auto">{children}</div>
      </main>
    </div>
  );
}
