import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Package, Warehouse, AlertTriangle, Clock, Plus, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { EChart } from '@/components/EChart';
import { api } from '@/services/api';
import type { DashboardStats } from '@/types';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const turnoverChartOption = {
    tooltip: {
      trigger: 'axis',
    },
    grid: { top: 10, right: 20, bottom: 30, left: 40 },
    xAxis: {
      type: 'category',
      data: stats.turnoverTrend.map(d => d.date.slice(5)),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '天数',
      nameTextStyle: { color: '#9ca3af', padding: [0, 0, 0, -10] },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
    },
    series: [{
      data: stats.turnoverTrend.map(d => d.value),
      type: 'line',
      smooth: true,
      lineStyle: { color: '#1e40af', width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(30, 64, 175, 0.3)' },
            { offset: 1, color: 'rgba(30, 64, 175, 0)' }
          ]
        }
      },
      itemStyle: { color: '#1e40af' },
      symbol: 'circle',
      symbolSize: 6,
    }]
  };

  const regionChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} 批次 ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, position: 'outside', formatter: '{b}\n{d}%', fontSize: 11 },
      labelLine: { length: 10, length2: 10 },
      data: stats.regionDistribution.map((d, i) => ({
        value: d.value,
        name: d.name,
        itemStyle: {
          color: ['#1e40af', '#059669', '#ea580c', '#7c3aed'][i]
        }
      }))
    }]
  };

  const shortageChartOption = {
    tooltip: { trigger: 'axis' },
    grid: { top: 10, right: 20, bottom: 30, left: 40 },
    xAxis: {
      type: 'category',
      data: stats.shortageTrend.map(d => d.date.slice(5)),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '次数',
      nameTextStyle: { color: '#9ca3af', padding: [0, 0, 0, -10] },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
    },
    series: [{
      data: stats.shortageTrend.map(d => d.value),
      type: 'bar',
      barWidth: '50%',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#ea580c' },
            { offset: 1, color: '#f97316' }
          ]
        },
        borderRadius: [4, 4, 0, 0]
      }
    }]
  };

  const alertTypeConfig = {
    shortage: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    low_stock: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    overstock: { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
          <p className="text-gray-500 mt-1">欢迎回来，查看今日材料动态</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/inventory" className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            材料入库
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总批次"
          value={stats.totalBatches}
          unit="批"
          icon={Package}
          color="blue"
          delay={0}
        />
        <StatCard
          title="在库数量"
          value={stats.inStockQuantity}
          unit="件"
          icon={Warehouse}
          color="green"
          delay={50}
        />
        <StatCard
          title="待处理短缺"
          value={stats.pendingShortages}
          unit="单"
          icon={AlertTriangle}
          color="red"
          delay={100}
        />
        <StatCard
          title="平均周转天数"
          value={stats.avgTurnoverDays}
          unit="天"
          icon={Clock}
          color="orange"
          trend={-5.2}
          delay={150}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 animate-fade-in-up animate-stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">周转天数趋势</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">近14天</span>
            </div>
          </div>
          <EChart option={turnoverChartOption} style={{ height: '280px' }} />
        </div>

        <div className="card p-6 animate-fade-in-up animate-stagger-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">区域分布</h3>
          <EChart option={regionChartOption} style={{ height: '280px' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 animate-fade-in-up animate-stagger-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">短缺频次趋势</h3>
          <EChart option={shortageChartOption} style={{ height: '260px' }} />
        </div>

        <div className="lg:col-span-2 card animate-fade-in-up animate-stagger-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">最近预警</h3>
            <Link to="/shortage" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
            {stats.recentAlerts.map((alert, index) => {
              const config = alertTypeConfig[alert.type];
              const Icon = config.icon;
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer',
                    alert.priority === 'high' && 'animate-pulse-slow'
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bg)}>
                    <Icon className={cn('w-5 h-5', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(alert.createdAt).toLocaleString('zh-CN', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <PriorityBadge priority={alert.priority} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/inventory" className="card-hover p-6 group cursor-pointer animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">库存台账</h3>
              <p className="text-sm text-gray-500 mt-1">查看所有批次记录</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Link>

        <Link to="/inventory/safety" className="card-hover p-6 group cursor-pointer animate-fade-in-up animate-stagger-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">安全库存</h3>
              <p className="text-sm text-gray-500 mt-1">监控库存预警线</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <Warehouse className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Link>

        <Link to="/analytics" className="card-hover p-6 group cursor-pointer animate-fade-in-up animate-stagger-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">复盘分析</h3>
              <p className="text-sm text-gray-500 mt-1">周转天数分析</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
