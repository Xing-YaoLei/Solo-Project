import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCurrentUser } from '../utils/useCurrentUser';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();

  const navItems = [
    { href: '/', label: '记录台', icon: '📋' },
    { href: '/tasks', label: '保洁任务', icon: '🧹' },
    { href: '/deposits', label: '押金管理', icon: '💰' },
    { href: '/documents', label: '入住证件', icon: '📄' },
    { href: '/reports', label: '月底复盘', icon: '📊' },
    { href: '/logs', label: '操作日志', icon: '📝' },
    { href: '/missed-orders', label: '漏单处理', icon: '⚠️' },
  ];

  const roleLabels: Record<string, string> = {
    ADMIN: '管理员',
    MANAGER: '经理',
    HOUSEKEEPER: '保洁员',
    RECEPTIONIST: '前台',
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-primary-600">🏨 民宿保洁分派台</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href || 
              (item.href !== '/' && router.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-sm">
              {currentUser?.name?.[0] || '?'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {currentUser?.name || '加载中...'}
              </p>
              <p className="text-xs text-gray-500">
                {currentUser?.email || ''}
              </p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {navItems.find((item) => 
              item.href === router.pathname || 
              (item.href !== '/' && router.pathname.startsWith(item.href))
            )?.label || '首页'}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-400">
              {currentUser ? `${roleLabels[currentUser.role] || currentUser.role} · ${currentUser.name}` : ''}
            </span>
            <button className="relative p-2 text-gray-400 hover:text-gray-600">
              <span className="text-xl">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  );
}
