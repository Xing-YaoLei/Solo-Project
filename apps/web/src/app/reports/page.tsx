'use client';

import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import CloseDurationChart from '@/components/report/CloseDurationChart';
import DateTrendChart from '@/components/report/DateTrendChart';
import OwnerDrillTable from '@/components/report/OwnerDrillTable';
import {
  getCloseDurationStats,
  getDateTrendStats,
  getOwnerDrillStats,
} from '@/lib/api/reports';
import { BarChart3, Clock, TrendingUp, Users, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const { data: closeDuration = [], isLoading: closeDurationLoading } = useQuery({
    queryKey: ['report-close-duration'],
    queryFn: () => getCloseDurationStats(),
  });

  const { data: dateTrend = [], isLoading: dateTrendLoading } = useQuery({
    queryKey: ['report-date-trend'],
    queryFn: () => getDateTrendStats(),
  });

  const { data: ownerDrill = [], isLoading: ownerDrillLoading } = useQuery({
    queryKey: ['report-owner-drill'],
    queryFn: () => getOwnerDrillStats(),
  });

  const totalComplaints = dateTrend.reduce((sum, d) => sum + d.total, 0);
  const totalResolved = dateTrend.reduce((sum, d) => sum + d.resolved, 0);
  const totalOverdue = dateTrend.reduce((sum, d) => sum + d.overdue, 0);
  const resolveRate =
    totalComplaints > 0 ? ((totalResolved / totalComplaints) * 100).toFixed(1) : '0';

  const stats = [
    {
      label: '总工单数',
      value: totalComplaints,
      icon: BarChart3,
      color: 'text-primary bg-primary/10',
    },
    {
      label: '已解决',
      value: totalResolved,
      icon: TrendingUp,
      color: 'text-success bg-success/10',
    },
    {
      label: '超时工单',
      value: totalOverdue,
      icon: Clock,
      color: 'text-danger bg-danger/10',
    },
    {
      label: '解决率',
      value: `${resolveRate}%`,
      icon: Users,
      color: 'text-accent bg-accent/10',
    },
  ];

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-info" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">报表分析</h1>
              <p className="text-xs text-slate-500">工单处理数据统计与分析</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="p-4 bg-white rounded-lg border border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{stat.label}</span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-800">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-slate-700">
                  日期趋势
                </h3>
              </div>
              <DateTrendChart data={dateTrend} loading={dateTrendLoading} />
            </div>

            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-slate-700">
                  关闭时长分布
                </h3>
              </div>
              <CloseDurationChart data={closeDuration} loading={closeDurationLoading} />
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-slate-700">
                负责人下钻分析
              </h3>
            </div>
            <OwnerDrillTable data={ownerDrill} loading={ownerDrillLoading} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
