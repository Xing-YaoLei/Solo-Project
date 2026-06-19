import { useState } from 'react';
import { useRouter } from 'next/router';
import { Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore, User as UserType } from '@/store/auth';
import { cn } from '@/lib/utils';

interface HeaderProps {
  user: UserType | null;
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getRoleText = (role: string) => {
    const roles: Record<string, string> = {
      ADMIN: '系统管理员',
      MANAGER: '运营经理',
      FRONTLINE: '一线人员',
    };
    return roles[role] || role;
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {getPageTitle(router.pathname)}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md"
          >
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-800">
                {user?.fullName || '用户'}
              </div>
              <div className="text-xs text-gray-500">
                {getRoleText(user?.role || 'FRONTLINE')}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/': '任务分派台',
    '/calendar': '房源日历',
    '/orders': '渠道订单',
    '/cleaning': '保洁任务',
    '/documents': '入住证件',
    '/deposits': '押金明细',
    '/conflicts': '房态冲突',
    '/reports': '报表分析',
    '/users': '用户管理',
    '/properties': '房源管理',
  };
  return titles[pathname] || '民宿房态管理';
}
