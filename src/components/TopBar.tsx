'use client';

import { RefreshCw, Download, Share2, User, Shield } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard';
import { ROLE_LABELS } from '@/types';
import { hasPermission } from '@/lib/constants';

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function TopBar() {
  const { user, dashboardData, isLoading, refreshData, setExportModalOpen, setShareModalOpen } = useDashboardStore();
  const userRole = user?.role || 'viewer';
  const canExport = hasPermission(userRole, 'dashboard:export');
  const canShare = hasPermission(userRole, 'dashboard:share');

  return (
    <header className="sticky top-0 z-40 border-b border-industrial-700 bg-industrial-900/95 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-risk-info to-blue-700 font-display font-bold">
              维
            </div>
            <div>
              <h1 className="font-display text-base font-bold tracking-wide text-white">
                汽车维修风险监测中心
              </h1>
              <p className="text-[10px] text-industrial-400">AUTO REPAIR RISK MONITOR</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-industrial-600 bg-industrial-800 px-3 py-1.5">
            <span className={`h-2 w-2 rounded-full ${isLoading ? 'bg-risk-warning animate-pulse' : 'bg-risk-success'}`} />
            <span className="text-xs text-industrial-300">最近刷新：</span>
            <span className="font-mono text-xs font-semibold text-white">
              {dashboardData ? formatTime(dashboardData.lastRefreshedAt) : '--'}
            </span>
            <button
              onClick={() => refreshData()}
              disabled={isLoading}
              className="ml-1 rounded p-1 text-industrial-300 transition hover:bg-industrial-700 hover:text-white disabled:opacity-50"
              title="刷新数据"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canExport && (
            <button
              onClick={() => setExportModalOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-industrial-600 bg-industrial-800 px-3 py-1.5 text-xs font-medium text-industrial-200 transition hover:border-risk-info hover:bg-industrial-700 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" />
              导出
            </button>
          )}
          {canShare && (
            <button
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-industrial-600 bg-industrial-800 px-3 py-1.5 text-xs font-medium text-industrial-200 transition hover:border-risk-info hover:bg-industrial-700 hover:text-white"
            >
              <Share2 className="h-3.5 w-3.5" />
              分享
            </button>
          )}

          <div className="flex items-center gap-2 rounded-md border border-industrial-600 bg-industrial-800 px-3 py-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-industrial-700">
              <User className="h-3.5 w-3.5 text-industrial-300" />
            </div>
            <div className="text-xs">
              <div className="font-medium text-white">{user?.name || '未登录'}</div>
            </div>
            <span className="flex items-center gap-1 rounded bg-gradient-to-r from-risk-info/20 to-blue-700/20 px-2 py-0.5 text-[10px] font-semibold text-risk-info">
              <Shield className="h-2.5 w-2.5" />
              {ROLE_LABELS[userRole as keyof typeof ROLE_LABELS] || '只读'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
