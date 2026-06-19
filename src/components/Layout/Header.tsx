import { Bell, Settings, User, RefreshCw } from 'lucide-react';

interface HeaderProps {
  title: string;
  onRefresh?: () => void;
}

export function Header({ title, onRefresh }: HeaderProps) {
  return (
    <header className="h-16 bg-primary-950/50 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6">
      <h2 className="font-display text-xl font-semibold text-white">{title}</h2>

      <div className="flex items-center gap-4">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw size={18} />
            <span className="hidden sm:inline">刷新数据</span>
          </button>
        )}
        <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
        </button>
        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white">
          <Settings size={20} />
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <span className="text-sm text-white/80 hidden md:inline">管理员</span>
        </div>
      </div>
    </header>
  );
}
