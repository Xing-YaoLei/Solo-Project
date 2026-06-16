import { useState } from 'react';
import { RefreshCw, Download, AlertTriangle, Clock, WifiOff } from 'lucide-react';
import { useStore } from '@/store/useStore';

const typeLabels: Record<string, string> = {
  terminal_delay: '终端延迟',
  access_missing: '门禁缺失',
  billing_caliber_change: '口径变更',
  fall_event: '跌倒事件',
};

const typeColors: Record<string, string> = {
  terminal_delay: 'text-amber-400',
  access_missing: 'text-red-400',
  billing_caliber_change: 'text-orange-400',
  fall_event: 'text-red-500',
};

export default function StatusBar() {
  const { annotations, triggerRefresh, setExportModalOpen } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const counts = annotations.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});

  const handleRefresh = () => {
    setRefreshing(true);
    triggerRefresh();
    setTimeout(() => {
      setRefreshing(false);
      setLastRefresh(new Date());
    }, 800);
  };

  return (
    <div className="h-14 bg-[#1B2A4A] border-b border-white/[0.08] flex items-center justify-between px-5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-white/40 text-xs">
          <Clock size={13} />
          <span className="font-[JetBrains_Mono,monospace]">
            {lastRefresh.toLocaleTimeString('zh-CN')}
          </span>
        </div>

        <div className="w-px h-4 bg-white/10" />

        {Object.entries(counts).map(([type, count]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs">
            {type === 'terminal_delay' ? (
              <WifiOff size={13} className={typeColors[type]} />
            ) : (
              <AlertTriangle size={13} className={typeColors[type]} />
            )}
            <span className={typeColors[type]}>{typeLabels[type]}</span>
            <span className="text-white/80 font-semibold">{count}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-white/60 hover:text-white/90 hover:bg-white/[0.06] transition-colors"
        >
          <RefreshCw
            size={14}
            className={refreshing ? 'animate-spin-slow' : ''}
          />
          刷新
        </button>
        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-white/60 hover:text-white/90 hover:bg-white/[0.06] transition-colors"
        >
          <Download size={14} />
          导出
        </button>
      </div>
    </div>
  );
}
