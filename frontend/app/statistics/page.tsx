'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Wrench,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  BarChart3,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import StatCard from '@/components/StatCard';
import { formatCurrency } from '@/lib/utils';
import { workOrderStatusLabels, workOrderStatusColors } from '@/lib/auth';
import { useAuth } from '@/components/auth/AuthProvider';
import { statsApi } from '@/lib/api-endpoints';
import type {
  DashboardStats,
  ReworkRateData,
  WorkOrder,
  TechnicianWorkload,
  RevenueTrendItem,
  ServiceItemStat,
  PaginatedResponse,
} from '@/lib/types';

const periodOptions = [
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '本季度' },
  { value: 'year', label: '本年' },
];

function getDateRange(period: string): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];
  let startDate: string;

  switch (period) {
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split('T')[0];
      break;
    }
    case 'quarter': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      startDate = d.toISOString().split('T')[0];
      break;
    }
    case 'year': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      startDate = d.toISOString().split('T')[0];
      break;
    }
    default: {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      startDate = d.toISOString().split('T')[0];
      break;
    }
  }

  return { startDate, endDate };
}

export default function StatisticsPage() {
  const { hasRole } = useAuth();
  const [period, setPeriod] = useState('month');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reworkRate, setReworkRate] = useState<ReworkRateData | null>(null);
  const [reworkOrders, setReworkOrders] = useState<WorkOrder[]>([]);
  const [reworkTotal, setReworkTotal] = useState(0);
  const [reworkPage, setReworkPage] = useState(1);
  const [technicianWorkload, setTechnicianWorkload] = useState<TechnicianWorkload[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendItem[]>([]);
  const [serviceItemStats, setServiceItemStats] = useState<ServiceItemStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { startDate, endDate } = getDateRange(period);
      const [dashboardStats, reworkData, reworkOrdersRes, workload, revenue, serviceItems] = await Promise.all([
        statsApi.getDashboardStats(),
        statsApi.getReworkRate({ startDate, endDate }),
        statsApi.getReworkOrders({ page: 1, pageSize: 10, startDate, endDate }),
        statsApi.getTechnicianWorkload({ startDate, endDate }),
        statsApi.getRevenueTrend({ startDate, endDate }),
        statsApi.getServiceItemStats({ startDate, endDate }),
      ]);
      setStats(dashboardStats);
      setReworkRate(reworkData);
      setReworkOrders(reworkOrdersRes.data);
      setReworkTotal(reworkOrdersRes.total);
      setTechnicianWorkload(workload);
      setRevenueTrend(revenue);
      setServiceItemStats(serviceItems);
    } catch (err: any) {
      setError(err?.message || '加载统计数据失败');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  if (!hasRole(['MANAGER'])) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-slate-500">
        <AlertTriangle className="mb-2 h-8 w-8" />
        <p className="text-lg font-medium">无访问权限</p>
        <p className="mt-1 text-sm">仅厂长角色可访问统计分析页面</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-red-500">
        <AlertTriangle className="mb-2 h-8 w-8" />
        <p>{error}</p>
        <button onClick={() => fetchAllData()} className="mt-2 text-sm text-primary-600 hover:underline">重试</button>
      </div>
    );
  }

  const maxRevenue = revenueTrend.length > 0 ? Math.max(...revenueTrend.map((d) => d.revenue)) : 1;
  const maxWorkload = technicianWorkload.length > 0 ? Math.max(...technicianWorkload.map((t) => t.totalOrders)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">统计分析</h2>
          <p className="mt-1 text-sm text-slate-500">全面了解门店运营情况和业绩指标</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Calendar className="h-4 w-4" />
            {periodOptions.find((p) => p.value === period)?.label}
            <ChevronDown className="h-4 w-4" />
          </button>
          {showPeriodDropdown && (
            <div className="absolute right-0 z-20 mt-1 w-32 rounded-lg border border-slate-200 bg-white shadow-lg">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setPeriod(option.value);
                    setShowPeriodDropdown(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    period === option.value
                      ? 'bg-primary-50 text-primary-700'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="总工单" value={stats?.total ?? 0} icon={Wrench} />
        <StatCard title="已完成" value={stats?.completed ?? 0} icon={CheckCircle} iconClassName="bg-green-100 text-green-600" />
        <StatCard title="进行中" value={stats?.inProgress ?? 0} icon={Clock} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="返修率" value={reworkRate ? `${reworkRate.reworkRate}%` : '-'} icon={AlertTriangle} iconClassName="bg-red-100 text-red-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                返修率数据
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reworkRate ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-red-50 p-4">
                    <p className="text-sm text-red-700">返修率</p>
                    <p className="text-2xl font-bold text-red-600">{reworkRate.reworkRate}%</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-700">完工车辆</p>
                    <p className="text-2xl font-bold text-slate-900">{reworkRate.totalCompletedVehicles}</p>
                  </div>
                </div>
                {reworkRate.reworkVehicles.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-700">返修车辆：</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {reworkRate.reworkVehicles.map((v, i) => (
                        <span key={i} className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">{v}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-slate-500">暂无返修数据</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                营收趋势
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueTrend.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">暂无营收数据</p>
            ) : (
              <div className="space-y-3">
                {revenueTrend.map((item) => (
                  <div key={item.date} className="flex items-center gap-4">
                    <span className="w-20 text-sm text-slate-500">{item.date}</span>
                    <div className="flex-1">
                      <div className="h-6 rounded bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
                          style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-28 text-right">
                      <span className="text-sm font-medium text-slate-900">{formatCurrency(item.revenue)}</span>
                      <span className="ml-1 text-xs text-slate-500">({item.orderCount}单)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>返修工单列表</CardTitle>
              <Link href="/work-orders" className="text-sm text-primary-600 hover:underline">查看全部</Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">工单号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">车牌号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">车主</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">创建时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {reworkOrders.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">暂无返修工单</td></tr>
                    ) : reworkOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <Link href={`/work-orders/${order.id}`} className="font-medium text-primary-600 hover:underline">{order.orderNumber}</Link>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-slate-900">{order.vehicle?.plateNumber || '-'}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{order.vehicle?.ownerName || '-'}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${workOrderStatusColors[order.status] || 'bg-slate-100 text-slate-800'}`}>
                            {workOrderStatusLabels[order.status] || order.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('zh-CN') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-500" />
                技师工作量排行
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {technicianWorkload.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">暂无数据</p>
            ) : technicianWorkload.map((tech, index) => (
              <div key={tech.technicianId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        index === 0
                          ? 'bg-amber-100 text-amber-700'
                          : index === 1
                          ? 'bg-slate-200 text-slate-600'
                          : index === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{tech.technicianName}</p>
                      <p className="text-xs text-slate-500">
                        {tech.completedOrders} 单 · {tech.totalLaborHours} 工时
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-primary-600">
                    {tech.totalOrders} 单
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
                    style={{ width: `${(tech.totalOrders / maxWorkload) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              服务类型统计
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serviceItemStats.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">暂无数据</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">项目名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">次数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">工时</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">工时费</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">配件费</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">合计</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {serviceItemStats.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{item.itemName}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{item.itemType}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-slate-900">{item.count}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{item.totalLaborHours}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{formatCurrency(item.totalLaborAmount)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{formatCurrency(item.totalPartAmount)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-primary-600">{formatCurrency(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
