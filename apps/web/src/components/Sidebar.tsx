'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const navItems = [
  { id: '/', label: '工作台', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: '/cases', label: '案件管理', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: '/reports', label: '月度报表', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
];

const roleLabels: Record<string, string> = {
  ADMIN: '管理员',
  LAWYER: '律师',
  ASSISTANT: '助理',
  CLIENT: '客户',
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (pathname === '/login') return null;

  return (
    <aside className="w-64 bg-slate-800 text-slate-100 flex flex-col shrink-0">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-700/50">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-lg font-bold shrink-0">
          法
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">案件委托分派台</p>
          <p className="text-xs text-slate-400 leading-tight mt-0.5">Legal Task Desk</p>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active =
            item.id === '/'
              ? pathname === '/'
              : pathname.startsWith(item.id);
          return (
            <Link
              key={item.id}
              href={item.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700/50 p-4">
        {loading || !user ? (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          >
            登录账号
          </Link>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-semibold shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-slate-400">
                  {roleLabels[user.role] || user.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors"
            >
              退出登录
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
