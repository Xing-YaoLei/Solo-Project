'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { ROLE_LABELS, ROLE_PERMISSIONS } from '@/lib/auth';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { RefreshCw, User, Share2, Download, ChevronDown, Settings, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface HeaderProps {
  lastRefreshedAt: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  onExport: () => void;
  onShare: () => void;
}

export function Header({ lastRefreshedAt, onRefresh, isRefreshing, onExport, onShare }: HeaderProps) {
  const { auth, setRole, isLoading } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roles: UserRole[] = ['admin', 'manager', 'supervisor', 'investor'];
  const permissions = auth.user ? ROLE_PERMISSIONS[auth.user.role] : null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                旅游民宿保洁排班风险监测图
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                整合门锁记录 · OTA订单 · 客服消息的智能风险监测平台
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
              <Clock className="w-4 h-4 text-blue-400" />
              <div className="text-sm">
                <span className="text-slate-400">最近刷新：</span>
                <span className="text-white font-medium">{formatRelativeTime(lastRefreshedAt)}</span>
                <span className="text-slate-500 ml-2 text-xs">({formatDateTime(lastRefreshedAt)})</span>
              </div>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                isRefreshing
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/25"
              )}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              <span>{isRefreshing ? '刷新中...' : '刷新数据'}</span>
            </button>

            {permissions?.canExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all"
              >
                <Download className="w-4 h-4" />
                <span>导出</span>
              </button>
            )}

            {permissions?.canShare && (
              <button
                onClick={onShare}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>分享</span>
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-all"
                disabled={isLoading}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">
                    {auth.user?.name || '加载中...'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {auth.user ? ROLE_LABELS[auth.user.role] : ''}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">切换角色预览</p>
                  </div>
                  {roles.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setRole(role);
                        setShowRoleMenu(false);
                      }}
                      className={cn(
                        "w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-700/50 transition-all",
                        auth.user?.role === role && "bg-blue-600/20 border-l-2 border-blue-500"
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{ROLE_LABELS[role]}</p>
                        <p className="text-xs text-slate-400 capitalize">{role}</p>
                      </div>
                      {auth.user?.role === role && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </button>
                  ))}
                  <div className="px-4 py-3 border-t border-slate-700">
                    <p className="text-xs text-slate-500">
                      不同角色将看到不同的数据范围和功能权限
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
