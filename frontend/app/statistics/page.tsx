'use client';

import { useState, useMemo } from 'react';
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
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import StatCard from '@/components/StatCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import type { ReworkOrder, TechnicianWorkload, ServiceTypeStat } from '@/lib/types';

const reworkTrendData = [
  { month: '1月', reworkRate: 3.2, totalOrders: 42, reworkOrders: 1 },
  { month: '2月', reworkRate: 5.3, totalOrders: 38, reworkOrders: 2 },
  { month: '3月', reworkRate: 2.1, totalOrders: 48, reworkOrders: 1 },
  { month: '4月', reworkRate: 4.5, totalOrders: 45, reworkOrders: 2 },
  { month: '5月', reworkRate: 6.7, totalOrders: 52, reworkOrders: 3 },
  { month: '6月', reworkRate: 3.8, totalOrders: 50, reworkOrders: 2 },
];

const revenueTrendData = [
  { month: '1月', revenue: 85000, orders: 42 },
  { month: '2月', revenue: 72000, orders: 38 },
  { month: '3月', revenue: 95000, orders: 48 },
  { month: '4月', revenue: 88000, orders: 45 },
  { month: '5月', revenue: 102000, orders: 52 },
  { month: '6月', revenue: 98000, orders: 50 },
];

const serviceTypeStats: ServiceTypeStat[] = [
  { type: '常规保养', count: 85, revenue: 42500 },
  { type: '维修服务', count: 62, revenue: 93000 },
  { type: '轮胎服务', count: 28, revenue: 28000 },
  { type: '空调服务', count: 15, revenue: 12000 },
  { type: '其他', count: 12, revenue: 8500 },
];

const technicianWorkload: TechnicianWorkload[] = [
  { technicianId: '1', technicianName: '张技师', completedOrders: 38, totalHours: 152, totalRevenue: 76000 },
  { technicianId: '2', technicianName: '李技师', completedOrders: 32, totalHours: 128, totalRevenue: 62000 },
  { technicianId: '3', technicianName: '王技师', completedOrders: 28, totalHours: 112, totalRevenue: 54000 },
  { technicianId: '4', technicianName: '赵技师', completedOrders: 24, totalHours: 96, totalRevenue: 48000 },
  { technicianId: '5', technicianName: '钱技师', completedOrders: 20, totalHours: 80, totalRevenue: 42000 },
];

const reworkOrders: ReworkOrder[] = [
  {
    id: 'rw1',
    orderNumber: 'WO202401010',
    vehicleLicensePlate: '京A12345',
    customerName: '张三',
    originalOrderNumber: 'WO202401001',
    reworkReason: '发动机异响未完全解决',
    status: 'inProgress',
    createdAt: '2024-01-18T09:00:00Z',
  },
  {
    id: 'rw2',
    orderNumber: 'WO202401011',
    vehicleLicensePlate: '沪C11111',
    customerName: '王五',
    originalOrderNumber: 'WO202401003',
    reworkReason: '刹车片安装有异响',
    status: 'pending',
    createdAt: '2024-01-18T10:30:00Z',
  },
  {
    id: 'rw3',
    orderNumber: 'WO202401012',
    vehicleLicensePlate: '浙E33333',
    customerName: '孙七',
    originalOrderNumber: 'WO202401005',
    reworkReason: '轮胎动平衡问题',
    status: 'completed',
    createdAt: '2024-01-17T14:00:00Z',
  },
];

const periodOptions = [
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '本季度' },
  { value: 'year', label: '本年' },
];

export default function StatisticsPage() {
  const { isAuthorized } = useProtectedRoute({
    allowedRoles: ['manager'],
  });
  const [period, setPeriod] = useState('month');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  if (!isAuthorized) {
    return null;
  }

  const maxReworkRate = Math.max(...reworkTrendData.map((d) => d.reworkRate));
  const maxRevenue = Math.max(...revenueTrendData.map((d) => d.revenue));
  const maxTechnicianRevenue = Math.max(...technicianWorkload.map((t) => t.totalRevenue));

  const reworkOrderColumns = [
    {
      key: 'orderNumber',
      title: '返修工单号',
      render: (row: ReworkOrder) => (
        <Link
          href={`/work-orders/${row.id}`}
          className="text-primary-600 hover:underline font-medium"
        >
          {row.orderNumber}
        </Link>
      ),
    },
    { key: 'vehicleLicensePlate', title: '车牌号' },
    { key: 'customerName', title: '车主' },
    {
      key: 'originalOrderNumber',
      title: '原始工单号',
      render: (row: ReworkOrder) => (
        <span className="text-slate-500">{row.originalOrderNumber}</span>
      ),
    },
    { key: 'reworkReason', title: '返修原因' },
    {
      key: 'status',
      title: '状态',
      render: (row: ReworkOrder) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      title: '创建时间',
      render: (row: ReworkOrder) => formatDate(row.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">统计分析</h2>
          <p className="mt-1 text-sm text-slate-500">
            全面了解门店运营情况和业绩指标
          </p>
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
        <StatCard
          title="总工单"
          value={156}
          icon={Wrench}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          title="已完成"
          value={118}
          icon={CheckCircle}
          iconClassName="bg-green-100 text-green-600"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="进行中"
          value={15}
          icon={Clock}
          iconClassName="bg-blue-100 text-blue-600"
          trend={{ value: 5.3, isPositive: false }}
        />
        <StatCard
          title="返修率"
          value="4.1%"
          icon={AlertTriangle}
          iconClassName="bg-red-100 text-red-600"
          trend={{ value: 2.1, isPositive: false }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                返修率趋势
              </span>
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <ArrowUpRight className="h-4 w-4 text-red-500" />
              <span className="text-red-600 font-medium">+2.1%</span>
              <span className="text-slate-500">较上月</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reworkTrendData.map((item) => (
                <div key={item.month} className="flex items-center gap-4">
                  <span className="w-10 text-sm text-slate-500">{item.month}</span>
                  <div className="flex-1">
                    <div className="h-6 rounded bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded bg-gradient-to-r from-red-400 to-red-500 transition-all"
                        style={{
                          width: `${(item.reworkRate / maxReworkRate) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-sm font-medium text-slate-900">{item.reworkRate}%</span>
                    <span className="text-xs text-slate-500 ml-1">({item.reworkOrders}单)</span>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="flex items-center gap-2 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">+12.5%</span>
              <span className="text-slate-500">较上月</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenueTrendData.map((item) => (
                <div key={item.month} className="flex items-center gap-4">
                  <span className="w-10 text-sm text-slate-500">{item.month}</span>
                  <div className="flex-1">
                    <div className="h-6 rounded bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
                        style={{
                          width: `${(item.revenue / maxRevenue) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-28 text-right">
                    <span className="text-sm font-medium text-slate-900">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>返修工单列表</CardTitle>
              <Link
                href="/work-orders?status=rework"
                className="text-sm text-primary-600 hover:underline"
              >
                查看全部
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={reworkOrderColumns} data={reworkOrders} />
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
            {technicianWorkload.map((tech, index) => (
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
                        {tech.completedOrders} 单 · {tech.totalHours} 工时
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-primary-600">
                    {formatCurrency(tech.totalRevenue)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
                    style={{
                      width: `${(tech.totalRevenue / maxTechnicianRevenue) * 100}%`,
                    }}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {serviceTypeStats.map((item) => (
              <div
                key={item.type}
                className="rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow"
              >
                <p className="text-sm text-slate-500">{item.type}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{item.count}</p>
                <p className="mt-1 text-sm font-medium text-primary-600">
                  {formatCurrency(item.revenue)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
