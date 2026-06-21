'use client';

import { useState, useEffect } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { RefreshCw, Share2, Download, Clock, User, ChevronDown } from 'lucide-react';
import { formatDate, getRelativeTime, cn } from '@/lib/utils';
import { ShareModal } from '@/components/modals/ShareModal';
import { ExportModal } from '@/components/modals/ExportModal';

export function Header() {
  const { lastRefreshedAt, isLoading, refreshData } = useDashboardStore();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [relativeTime, setRelativeTime] = useState('');

  useEffect(() => {
    if (lastRefreshedAt) {
      setRelativeTime(getRelativeTime(lastRefreshedAt));
      const interval = setInterval(() => {
        setRelativeTime(getRelativeTime(lastRefreshedAt));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [lastRefreshedAt]);

  const handleRefresh = async () => {
    await refreshData();
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-neutral-800 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-xl font-bold text-white">活动票务座位分配趋势看板</h1>
          </div>

          <div className="flex items-center gap-2">
            {lastRefreshedAt && (
              <div className="hidden sm:flex items-center gap-2 rounded-lg bg-neutral-800/50 px-3 py-1.5">
                <Clock className="h-4 w-4 text-success" />
                <span className="text-xs text-neutral-300">
                  最近刷新：
                  <span className="font-mono text-success" title={formatDate(lastRefreshedAt)}>
                    {relativeTime}
                  </span>
                </span>
              </div>
            )}

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="btn-ghost gap-1.5"
              title="刷新数据"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              <span className="hidden sm:inline">刷新</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="btn-ghost gap-1.5"
              title="分享链接"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">分享</span>
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="btn-primary gap-1.5"
              title="导出数据"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">导出</span>
            </button>

            <div className="flex items-center gap-2 rounded-lg bg-neutral-800/50 px-3 py-1.5">
              <User className="h-4 w-4 text-neutral-400" />
              <span className="hidden sm:inline text-sm text-neutral-300">管理员</span>
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            </div>
          </div>
        </div>

        {lastRefreshedAt && (
          <div className="sm:hidden border-t border-neutral-800 px-4 py-2">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3 text-success" />
              <span className="text-neutral-400">最近刷新：</span>
              <span className="font-mono text-success">{formatDate(lastRefreshedAt)}</span>
            </div>
          </div>
        )}
      </header>

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </>
  );
}
