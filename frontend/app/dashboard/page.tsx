'use client';

import { useEffect, useState } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle,
  DollarSign,
  Package,
  Bell,
  AlertTriangle,
  ChevronRight,
  Car,
} from 'lucide-react';
import Link from 'next/link';
import StatCard from '@/components/StatCard';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import { formatDate, formatCurrency } from '@/lib/utils';
import { workOrderStatusLabels, workOrderStatusColors, maintenanceTypeLabels } from '@/lib/auth';
import { useAuth } from '@/components/auth/AuthProvider';
import { statsApi, workOrderApi, reminderApi } from '@/lib/api-endpoints';
import type { DashboardStats, WorkOrder, MaintenanceReminder, ReworkRateData } from '@/lib/types';

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reworkRate, setReworkRate] = useState<ReworkRateData | null>(null);
  const [recentOrders, setRecentOrders] = useState<WorkOrder[]>([]);
  const [reminders, setReminders] = useState<MaintenanceReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        const [dashboardStats, reworkData, ordersRes, remindersRes] = await Promise.all([
          statsApi.getDashboardStats(),
          statsApi.getReworkRate(),
          workOrderApi.getAll({ page: 1, pageSize: 5 }),
          reminderApi.getAll({ page: 1, pageSize: 5, isCompleted: false }),
        ]);
        if (cancelled) return;
        setStats(dashboardStats);
        setReworkRate(reworkData);
        setRecentOrders(ordersRes.data);
        setReminders(remindersRes.data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || '加载数据失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-slate-500">
        <p className="text-lg font-medium">请先登录</p>
        <Link href="/login" className="mt-2 text-primary-600 hover:underline">前往登录</Link>
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
        <button onClick={() => window.location.reload()} className="mt-2 text-sm text-primary-600 hover:underline">重试</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard title="今日工单" value={stats?.total ?? 0} icon={Wrench} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="进行中" value={stats?.inProgress ?? 0} icon={Clock} iconClassName="bg-amber-100 text-amber-600" />
        <StatCard title="待配件" value={stats?.waitingParts ?? 0} icon={Package} iconClassName="bg-orange-100 text-orange-600" />
        <StatCard title="已完成" value={stats?.completed ?? 0} icon={CheckCircle} iconClassName="bg-green-100 text-green-600" />
        <StatCard title="返修率" value={reworkRate ? `${reworkRate.reworkRate}%` : '-'} icon={AlertTriangle} iconClassName="bg-red-100 text-red-600" />
        <StatCard title="今日营收" value={formatCurrency(stats?.todayRevenue ?? 0)} icon={DollarSign} iconClassName="bg-emerald-100 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>最近工单</CardTitle>
              <Link href="/work-orders" className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
                查看全部 <ChevronRight className="h-4 w-4" />
              </Link>
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
                    {recentOrders.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">暂无工单</td></tr>
                    ) : recentOrders.map((order) => (
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
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500" />
                  保养提醒
                </span>
              </CardTitle>
              <Link href="/reminders" className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
                全部 <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {reminders.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">暂无提醒</p>
              ) : reminders.map((reminder) => {
                const daysLeft = reminder.nextDate
                  ? Math.ceil((new Date(reminder.nextDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;
                const isUrgent = daysLeft !== null && daysLeft <= 7;

                return (
                  <div key={reminder.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{maintenanceTypeLabels[reminder.type] || reminder.type}</span>
                      {daysLeft !== null && (
                        <span className={`text-xs font-medium ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                          {daysLeft > 0 ? `${daysLeft}天后` : '已到期'}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Car className="h-4 w-4" />
                      <span className="font-mono">{reminder.vehicle?.plateNumber || '-'}</span>
                      <span>·</span>
                      <span>{reminder.vehicle?.ownerName || '-'}</span>
                    </div>
                    {reminder.description && (
                      <p className="mt-1 text-xs text-slate-500">{reminder.description}</p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
