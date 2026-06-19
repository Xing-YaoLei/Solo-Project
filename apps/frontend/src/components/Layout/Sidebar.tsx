import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Calendar,
  ShoppingBag,
  Sparkles,
  FileText,
  Wallet,
  AlertTriangle,
  BarChart3,
  Users,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/store/auth';

interface SidebarProps {
  userRole?: UserRole;
}

const menuItems = [
  {
    label: '任务分派台',
    icon: LayoutDashboard,
    path: '/',
    roles: ['ADMIN', 'MANAGER', 'FRONTLINE'],
  },
  {
    label: '房源日历',
    icon: Calendar,
    path: '/calendar',
    roles: ['ADMIN', 'MANAGER', 'FRONTLINE'],
  },
  {
    label: '渠道订单',
    icon: ShoppingBag,
    path: '/orders',
    roles: ['ADMIN', 'MANAGER', 'FRONTLINE'],
  },
  {
    label: '保洁任务',
    icon: Sparkles,
    path: '/cleaning',
    roles: ['ADMIN', 'MANAGER', 'FRONTLINE'],
  },
  {
    label: '入住证件',
    icon: FileText,
    path: '/documents',
    roles: ['ADMIN', 'MANAGER', 'FRONTLINE'],
  },
  {
    label: '押金明细',
    icon: Wallet,
    path: '/deposits',
    roles: ['ADMIN', 'MANAGER', 'FRONTLINE'],
  },
  {
    label: '房态冲突',
    icon: AlertTriangle,
    path: '/conflicts',
    roles: ['ADMIN', 'MANAGER', 'FRONTLINE'],
    badge: 'highRisk',
  },
  {
    label: '报表分析',
    icon: BarChart3,
    path: '/reports',
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    label: '用户管理',
    icon: Users,
    path: '/users',
    roles: ['ADMIN'],
  },
  {
    label: '房源管理',
    icon: Home,
    path: '/properties',
    roles: ['ADMIN', 'MANAGER'],
  },
];

export default function Sidebar({ userRole = 'FRONTLINE' }: SidebarProps) {
  const router = useRouter();

  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">民宿房态管理</h1>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => router.push(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">版本 v1.0.0</div>
      </div>
    </aside>
  );
}
