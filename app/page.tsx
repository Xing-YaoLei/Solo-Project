'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { Header } from '@/components/Header';
import { MetricCard } from '@/components/MetricCard';
import { CheckinTrendChart } from '@/components/charts/CheckinTrendChart';
import { DepositPieChart } from '@/components/charts/DepositPieChart';
import { ComplaintTimeline } from '@/components/charts/ComplaintTimeline';
import { ReviewTagCloud } from '@/components/charts/ReviewTagCloud';
import { ExportModal } from '@/components/ExportModal';
import { ShareModal } from '@/components/ShareModal';
import { useAuth } from '@/app/context/AuthContext';
import {
  Hotel,
  Users,
  Clock,
  AlertTriangle,
  DollarSign,
  Star,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Tag,
  RefreshCw,
} from 'lucide-react';
import type { DashboardSummary, ApiResponse } from '@/types';
import { cn, CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import { ROLE_PERMISSIONS } from '@/lib/auth';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardPage() {
  const { auth, isLoading } = useAuth();
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toISOString());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, error, mutate } = useSWR<ApiResponse<DashboardSummary>>(
    `/api/dashboard?days=30&refresh=${refreshKey}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/refresh', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setLastRefreshedAt(result.data.refreshedAt);
        setRefreshKey(prev => prev + 1);
        await mutate();
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [mutate]);

  useEffect(() => {
    if (data?.metadata?.lastRefreshedAt) {
      setLastRefreshedAt(data.metadata.lastRefreshedAt);
    }
  }, [data]);

  const summary = data?.data;
  const permissions = auth.user ? ROLE_PERMISSIONS[auth.user.role] : null;
  const punctualityRate = data?.metadata?.punctualityRate ?? 0;

  if (isLoading || !data) {
    return (
      <div className="min-h-screen">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-card p-6 h-40">
                <div className="skeleton h-4 w-24 mb-4 rounded" />
                <div className="skeleton h-8 w-32 mb-2 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-risk-high mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">加载失败</h2>
          <p className="text-slate-400 mb-4">{error.message || '无法加载监测数据'}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        lastRefreshedAt={lastRefreshedAt}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onExport={() => setShowExportModal(true)}
        onShare={() => setShowShareModal(true)}
      />

      <main className="p-6">
        {summary?.anomalyTags && summary.anomalyTags.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-risk-high/10 border border-risk-high/30 animate-pulse-slow">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-risk-high flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-risk-high">
                  检测到 {summary.anomalyTags.length} 个异常点评标签，需要关注
                </p>
                <p className="text-sm text-risk-high/80 truncate">
                  {summary.anomalyTags.slice(0, 3).map(t => t.tagName).join('、')}
                  {summary.anomalyTags.length > 3 && ` 等${summary.anomalyTags.length}个标签`}
                </p>
              </div>
              <button
                onClick={() => document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2 rounded-lg bg-risk-high/20 hover:bg-risk-high/30 text-risk-high font-medium text-sm transition-colors"
              >
                查看详情
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-300">
                <span className="font-semibold">保洁准时率:</span>{' '}
                <span className="text-lg font-bold">{(punctualityRate * 100).toFixed(1)}%</span>
              </p>
              <p className="text-xs text-blue-400/80">{CLEANING_PUNCTUALITY_RULE}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="总订单数"
            value={summary?.metrics.totalOrders ?? 0}
            subtitle="近30天"
            trend={summary?.metrics.revenueGrowth}
            trendLabel="较上期"
            gradient="from-blue-500 to-cyan-500"
            icon={<BarChart3 className="w-5 h-5 text-white" />}
          />
          <MetricCard
            title="保洁准时率"
            value={summary?.metrics.cleaningPunctualityRate ?? 0}
            format="percent"
            subtitle={`${summary?.punctuality.onTimeCount ?? 0} / ${summary?.punctuality.totalCount ?? 0} 次准时`}
            gradient="from-green-500 to-emerald-500"
            icon={<Clock className="w-5 h-5 text-white" />}
            isAnomaly={(summary?.metrics.cleaningPunctualityRate ?? 0) < 0.9}
          />
          <MetricCard
            title="客诉率"
            value={summary?.metrics.complaintRate ?? 0}
            format="percent"
            subtitle="近30天客诉占比"
            gradient="from-orange-500 to-amber-500"
            icon={<AlertTriangle className="w-5 h-5 text-white" />}
            isAnomaly={(summary?.metrics.complaintRate ?? 0) > 0.05}
          />
          <MetricCard
            title="押金异常率"
            value={summary?.metrics.depositAnomalyRate ?? 0}
            format="percent"
            subtitle="押金扣除比例"
            gradient="from-red-500 to-rose-500"
            icon={<DollarSign className="w-5 h-5 text-white" />}
          />
          <MetricCard
            title="平均评分"
            value={summary?.metrics.reviewAverageScore?.toFixed(1) ?? '0'}
            subtitle="OTA综合评分"
            gradient="from-purple-500 to-pink-500"
            icon={<Star className="w-5 h-5 text-white" />}
          />
          <MetricCard
            title="在营门店"
            value={summary?.metrics.activeHotels ?? 0}
            subtitle="正常运营门店数"
            gradient="from-indigo-500 to-violet-500"
            icon={<Hotel className="w-5 h-5 text-white" />}
          />
          <MetricCard
            title="入住率"
            value={summary?.metrics.occupancyRate ?? 0}
            format="percent"
            subtitle="近30天平均"
            trend={summary?.metrics.revenueGrowth}
            trendLabel="环比增长"
            gradient="from-teal-500 to-cyan-500"
            icon={<Users className="w-5 h-5 text-white" />}
          />
          <MetricCard
            title="营收增长"
            value={summary?.metrics.revenueGrowth ?? 0}
            format="percent"
            subtitle="较上一周期"
            gradient="from-emerald-500 to-green-500"
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            isAnomaly={(summary?.metrics.revenueGrowth ?? 0) < 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">入住证件趋势</h3>
                  <p className="text-sm text-slate-400">近30天入住证件办理数量与异常率趋势</p>
                </div>
              </div>
              <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                查看详情 →
              </button>
            </div>
            <CheckinTrendChart data={summary?.checkinTrend ?? []} height={350} />
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">押金明细构成</h3>
                <p className="text-sm text-slate-400">收取、退还、扣除明细</p>
              </div>
            </div>
            <DepositPieChart breakdown={summary?.depositBreakdown ?? { total: 0, refunded: 0, deducted: 0, pending: 0 }} height={350} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">客诉证据明细</h3>
                  <p className="text-sm text-slate-400">客服消息追溯，证据链展示</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <RefreshCw className="w-4 h-4" />
                <span>共 {summary?.recentComplaints.length ?? 0} 条</span>
              </div>
            </div>
            <ComplaintTimeline complaints={summary?.recentComplaints ?? []} height={450} />
          </div>

          <div id="review-section" className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">点评标签异常标注</h3>
                <p className="text-sm text-slate-400">OTA点评情感分析，异常标签高亮</p>
              </div>
            </div>
            <ReviewTagCloud tags={summary?.anomalyTags ?? []} height={450} />
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">数据来源说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/30">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <KeyIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white">门锁记录</p>
                <p className="text-sm text-slate-400 mt-1">实时同步各门店门锁系统的开锁记录，用于验证保洁人员到岗时间</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/30">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <GlobeIcon className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-white">OTA订单</p>
                <p className="text-sm text-slate-400 mt-1">对接携程、美团、飞猪等平台订单数据，获取入住信息和押金状态</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/30">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-white">客服消息</p>
                <p className="text-sm text-slate-400 mt-1">整合客服对话记录，作为客诉处理的明细追溯来源</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          punctualityRate={punctualityRate}
        />
      )}

      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          currentRole={auth.user?.role ?? 'investor'}
        />
      )}
    </div>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h2a1 1 0 0 0 .707-.293l9.828-9.828a4 4 0 0 0-5.656-5.656L15 5.828l-1.879 1.879a3 3 0 0 0-4.242 0L2.586 14.828a2 2 0 0 0 0 2.828z"/>
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}
