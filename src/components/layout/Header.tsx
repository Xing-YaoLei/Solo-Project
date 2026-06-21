import * as React from 'react';
import {
  LayoutDashboard,
  LogOut,
  Download,
  Share2,
  User,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { usePermission } from '@/hooks/usePermission';
import { getRoleLabel, getRoleColor } from '@/utils/format';

interface HeaderProps {
  className?: string;
  onExport?: () => void;
  onShare?: () => void;
}

const Header: React.FC<HeaderProps> = ({ className, onExport, onShare }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { canExportData, canShareReports } = usePermission();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">案件管理系统</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(canExportData || canShareReports) && (
            <div className="flex items-center gap-2 border-r border-border pr-4 mr-2">
              {canExportData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">导出</span>
                </Button>
              )}
              {canShareReports && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShare}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">分享</span>
                </Button>
              )}
            </div>
          )}

          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-accent transition-colors"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium">{user.name}</div>
                    <Badge
                      variant="secondary"
                      className={cn('text-xs font-normal', getRoleColor(user.role))}
                    >
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    showUserMenu && 'rotate-180'
                  )}
                />
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div
                    className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-lg border border-border bg-background shadow-lg"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                  >
                    <div className="border-b border-border p-3">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <Badge
                        variant="secondary"
                        className={cn('mt-2 text-xs font-normal', getRoleColor(user.role))}
                      >
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left hover:bg-accent text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4" />
                        退出登录
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export { Header };
