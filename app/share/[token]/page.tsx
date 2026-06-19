'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { MetricCard } from '@/components/MetricCard';
import { CheckinTrendChart } from '@/components/charts/CheckinTrendChart';
import { DepositPieChart } from '@/components/charts/DepositPieChart';
import { ComplaintTimeline } from '@/components/charts/ComplaintTimeline';
import { ReviewTagCloud } from '@/components/charts/ReviewTagCloud';
import { ExportModal } from '@/components/ExportModal';
import {
  Hotel,
  Users,
  Clock,
  AlertTriangle,
  DollarSign,
  Star,
  TrendingUp,
  BarChart3,
  Lock,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import type { DashboardSummary, ApiResponse } from '@/types';
import { CLEANING_PUNCTUALITY_RULE, formatDateTime } from '@/lib/utils';
import { ROLE_LABELS, ROLE_PERMISSIONS, validateShareToken, type AuthContext } from '@/lib/auth';

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [auth, setAuth] = useState<AuthContext | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toISOString());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [punctualityRate, setPunctualityRate] = useState(0);

  useEffect(() => {
    const validateToken = async () => {
      const result = await validateShareToken(token);
      if (result.valid && result.authContext) {
        setAuth(result.authContext);
        setIsValid(true);
        await loadDashboardData(result.authContext);
      } else {
        setIsValid(false);
        setError(result.error || '链接无效');
      }
    };
    validateToken();
  }, [token]);

  const loadDashboardData = async (authContext: AuthContext) => {
    try {
      const res = await fetch('/api/dashboard?days=30');
      const data: ApiResponse<DashboardSummary> = await res.json();
      if (data.success && data.data) {
        setSummary(data.data);
        setLastRefreshedAt(data.metadata.lastRefreshedAt);
        setPunctualityRate(data.metadata.punctualityRate);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  const handleRefresh = async () => {
    if (!auth) return;
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/refresh', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setLastRefreshedAt(result.data.refreshedAt);
        await loadDashboardData(auth);
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">正在验证链接...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 max-w-md w-full mx-4 text-center">
          <div className="w-20 h-20 rounded-full bg-risk-high/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-risk-high" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">链接无效</h1>
          <p className="text-slate-400 mb-6">{error || '该分享链接不存在或已过期'}</p>
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const permissions = auth?.user ? ROLE_PERMISSIONS[auth.user.role] : null;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                旅游民宿保洁排班风险监测图
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-400">
                    分享视图 · {auth?.user ? ROLE_LABELS[auth.user.role] : ''}
                  </span>
                </div>
                <span className="text-sm text-slate-400">
                  最近刷新: {formatDateTime(lastRefreshedAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all disabled:opacity-50"
              >
                <Clock className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? '刷新中...' : '刷新数据'}
              </button>
              {permissions?.canExport && (
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all"
                >
                  导出
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="p-6">
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

        {permissions?.canViewDetails ? (
          <>
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
                title="平均评分"
                value={summary?.metrics.reviewAverageScore?.toFixed(1) ?? '0'}
                subtitle="OTA综合评分"
                gradient="from-purple-500 to-pink-500"
                icon={<Star className="w-5 h-5 text-white" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">入住证件趋势</h3>
                    <p className="text-sm text-slate-400">近30天入住证件办理数量与异常率趋势</p>
                  </div>
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">客诉证据明细</h3>
                    <p className="text-sm text-slate-400">客服消息追溯，证据链展示</p>
                  </div>
                </div>
                <ComplaintTimeline complaints={summary?.recentComplaints ?? []} height={450} />
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">点评标签异常标注</h3>
                    <p className="text-sm text-slate-400">OTA点评情感分析，异常标签高亮</p>
                  </div>
                </div>
                <ReviewTagCloud tags={summary?.anomalyTags ?? []} height={450} />
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="总订单数"
              value={summary?.metrics.totalOrders ?? 0}
              subtitle="近30天"
              gradient="from-blue-500 to-cyan-500"
              icon={<BarChart3 className="w-5 h-5 text-white" />}
            />
            <MetricCard
              title="保洁准时率"
              value={summary?.metrics.cleaningPunctualityRate ?? 0}
              format="percent"
              gradient="from-green-500 to-emerald-500"
              icon={<Clock className="w-5 h-5 text-white" />}
            />
            <MetricCard
              title="在营门店"
              value={summary?.metrics.activeHotels ?? 0}
              gradient="from-indigo-500 to-violet-500"
              icon={<Hotel className="w-5 h-5 text-white" />}
            />
            <MetricCard
              title="营收增长"
              value={summary?.metrics.revenueGrowth ?? 0}
              format="percent"
              gradient="from-emerald-500 to-green-500"
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              isAnomaly={(summary?.metrics.revenueGrowth ?? 0) < 0}
            />
          </div>
        )}
      </main>

      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          punctualityRate={punctualityRate}
        />
      )}
    </div>
  );
}
