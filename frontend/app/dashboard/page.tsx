'use client';

import { useEffect, useState } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle,
  DollarSign,
  Car,
  Package,
  ClipboardList,
  Bell,
  AlertTriangle,
  ChevronRight,
  Plus,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import StatCard from '@/components/StatCard';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import DataTable from '@/components/DataTable';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { WorkOrder, DashboardStats, PartRequest, MaintenanceReminder } from '@/lib/types';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

const mockStats: DashboardStats = {
  totalWorkOrders: 156,
  pendingWorkOrders: 23,
  inProgressWorkOrders: 15,
  completedWorkOrders: 118,
  totalRevenue: 285600,
  totalVehicles: 89,
  lowStockParts: 7,
  pendingPartRequests: 12,
  upcomingReminders: 5,
};

const mockRecentWorkOrders: WorkOrder[] = [
  {
    id: '1',
    orderNumber: 'WO202401001',
    vehicleId: '1',
    customerId: '1',
    customerName: '张三',
    customerPhone: '13800138001',
    advisorId: '1',
    status: 'inProgress',
    description: '发动机异响检修',
    serviceType: '维修',
    estimatedHours: 4,
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    orderNumber: 'WO202401002',
    vehicleId: '2',
    customerId: '2',
    customerName: '李四',
    customerPhone: '13800138002',
    advisorId: '1',
    status: 'pending',
    description: '常规保养',
    serviceType: '保养',
    estimatedHours: 2,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '3',
    orderNumber: 'WO202401003',
    vehicleId: '3',
    customerId: '3',
    customerName: '王五',
    customerPhone: '13800138003',
    advisorId: '1',
    technicianId: '2',
    status: 'completed',
    description: '刹车片更换',
    serviceType: '维修',
    actualHours: 2.5,
    totalCost: 850,
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-14T14:30:00Z',
    completedAt: '2024-01-14T14:30:00Z',
  },
  {
    id: '4',
    orderNumber: 'WO202401004',
    vehicleId: '4',
    customerId: '4',
    customerName: '赵六',
    customerPhone: '13800138004',
    advisorId: '1',
    status: 'inProgress',
    description: '空调系统检查',
    serviceType: '维修',
    estimatedHours: 3,
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T09:15:00Z',
  },
  {
    id: '5',
    orderNumber: 'WO202401005',
    vehicleId: '5',
    customerId: '5',
    customerName: '孙七',
    customerPhone: '13800138005',
    advisorId: '1',
    technicianId: '2',
    status: 'completed',
    description: '轮胎更换',
    serviceType: '维修',
    actualHours: 1.5,
    totalCost: 1200,
    createdAt: '2024-01-14T14:00:00Z',
    updatedAt: '2024-01-14T16:00:00Z',
    completedAt: '2024-01-14T16:00:00Z',
  },
];

const mockPendingPartRequests: (PartRequest & { partName?: string })[] = [
  {
    id: 'pr1',
    requestNumber: 'PR202401001',
    workOrderId: 'WO202401001',
    partId: 'P001',
    partName: '正时皮带套装',
    requestedBy: 'tech2',
    quantity: 2,
    status: 'pending',
    notes: '紧急需要',
    createdAt: '2024-01-15T09:30:00Z',
    updatedAt: '2024-01-15T09:30:00Z',
  },
  {
    id: 'pr2',
    requestNumber: 'PR202401002',
    workOrderId: 'WO202401002',
    partId: 'P003',
    partName: '空气滤清器',
    requestedBy: 'tech1',
    quantity: 5,
    status: 'pending',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'pr3',
    requestNumber: 'PR202401003',
    workOrderId: 'WO202401003',
    partId: 'P004',
    partName: '前刹车片',
    requestedBy: 'tech1',
    quantity: 1,
    status: 'pending',
    notes: '缺货，需采购',
    createdAt: '2024-01-14T16:00:00Z',
    updatedAt: '2024-01-14T16:00:00Z',
  },
];

const mockUpcomingReminders: (MaintenanceReminder & { licensePlate?: string })[] = [
  {
    id: 'rem1',
    vehicleId: 'v1',
    licensePlate: '京A12345',
    customerId: 'c1',
    customerName: '张三',
    type: 'maintenance',
    title: '常规保养提醒',
    description: '距离上次保养已5000公里',
    reminderDate: '2024-01-20T00:00:00Z',
    mileageThreshold: 5000,
    currentMileage: 45000,
    status: 'active',
    createdBy: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'rem2',
    vehicleId: 'v2',
    licensePlate: '京B67890',
    customerId: 'c2',
    customerName: '李四',
    type: 'inspection',
    title: '年检提醒',
    description: '车辆年检即将到期',
    reminderDate: '2024-01-25T00:00:00Z',
    status: 'active',
    createdBy: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'rem3',
    vehicleId: 'v3',
    licensePlate: '沪C11111',
    customerId: 'c3',
    customerName: '王五',
    type: 'maintenance',
    title: '轮胎更换提醒',
    description: '轮胎磨损严重，建议更换',
    reminderDate: '2024-01-22T00:00:00Z',
    status: 'active',
    createdBy: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'rem4',
    vehicleId: 'v4',
    licensePlate: '粤D22222',
    customerId: 'c4',
    customerName: '赵六',
    type: 'service',
    title: '空调系统保养',
    description: '夏季来临前建议清洗空调',
    reminderDate: '2024-01-28T00:00:00Z',
    status: 'active',
    createdBy: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'rem5',
    vehicleId: 'v5',
    licensePlate: '浙E33333',
    customerId: 'c5',
    customerName: '孙七',
    type: 'inspection',
    title: '保险到期提醒',
    description: '车辆保险即将到期，请及时续保',
    reminderDate: '2024-02-01T00:00:00Z',
    status: 'active',
    createdBy: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

export default function DashboardPage() {
  const { isAuthorized } = useProtectedRoute();
  const [stats, setStats] = useState<DashboardStats>(mockStats);

  if (!isAuthorized) {
    return null;
  }

  const recentColumns = [
    {
      key: 'orderNumber',
      title: '工单号',
      render: (row: WorkOrder) => (
        <Link
          href={`/work-orders/${row.id}`}
          className="text-primary-600 hover:underline font-medium"
        >
          {row.orderNumber}
        </Link>
      ),
    },
    { key: 'customerName', title: '客户姓名' },
    { key: 'description', title: '服务描述' },
    {
      key: 'status',
      title: '状态',
      render: (row: WorkOrder) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      title: '创建时间',
      render: (row: WorkOrder) => formatDate(row.createdAt),
    },
  ];

  const todayOrders = 12;
  const todayRevenue = 8560;
  const pendingParts = 3;
  const reworkRate = 3.2;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="今日工单"
          value={todayOrders}
          icon={Wrench}
          iconClassName="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="进行中"
          value={stats.inProgressWorkOrders}
          icon={Clock}
          iconClassName="bg-amber-100 text-amber-600"
        />
        <StatCard
          title="待配件"
          value={pendingParts}
          icon={Package}
          iconClassName="bg-orange-100 text-orange-600"
        />
        <StatCard
          title="已完成"
          value={stats.completedWorkOrders}
          icon={CheckCircle}
          iconClassName="bg-green-100 text-green-600"
        />
        <StatCard
          title="返修率"
          value={`${reworkRate}%`}
          icon={AlertTriangle}
          iconClassName="bg-red-100 text-red-600"
        />
        <StatCard
          title="今日营收"
          value={formatCurrency(todayRevenue)}
          icon={DollarSign}
          iconClassName="bg-emerald-100 text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>最近工单</CardTitle>
              <Link
                href="/work-orders"
                className="flex items-center gap-1 text-sm text-primary-600 hover:underline"
              >
                查看全部
                <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={recentColumns} data={mockRecentWorkOrders} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-orange-500" />
                  待处理配件申请
                </span>
              </CardTitle>
              <Link
                href="/part-requests"
                className="flex items-center gap-1 text-sm text-primary-600 hover:underline"
              >
                全部
                <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockPendingPartRequests.slice(0, 3).map((request) => (
                <Link
                  key={request.id}
                  href={`/part-requests`}
                  className="block rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{request.partName}</span>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm text-slate-500">
                    <span>{request.requestNumber}</span>
                    <span>x{request.quantity}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500" />
                  保养提醒
                </span>
              </CardTitle>
              <Link
                href="/reminders"
                className="flex items-center gap-1 text-sm text-primary-600 hover:underline"
              >
                全部
                <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockUpcomingReminders.slice(0, 3).map((reminder) => {
                const daysLeft = Math.ceil(
                  (new Date(reminder.reminderDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const isUrgent = daysLeft <= 7;

                return (
                  <div
                    key={reminder.id}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{reminder.title}</span>
                      <span
                        className={`text-xs font-medium ${
                          isUrgent ? 'text-red-600' : 'text-amber-600'
                        }`}
                      >
                        {daysLeft > 0 ? `${daysLeft}天后` : '已到期'}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Car className="h-4 w-4" />
                      <span className="font-mono">{reminder.licensePlate}</span>
                      <span>·</span>
                      <span>{reminder.customerName}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>快捷操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <Link
              href="/work-orders/new"
              className="flex flex-col items-center justify-center rounded-lg border border-slate-200 p-4 text-center transition-colors hover:bg-slate-50 hover:border-primary-300"
            >
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Wrench className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-slate-700">新建工单</span>
            </Link>
            <Link
              href="/vehicles/new"
              className="flex flex-col items-center justify-center rounded-lg border border-slate-200 p-4 text-center transition-colors hover:bg-slate-50 hover:border-primary-300"
            >
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Car className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-slate-700">登记车辆</span>
            </Link>
            <Link
              href="/part-requests/new"
              className="flex flex-col items-center justify-center rounded-lg border border-slate-200 p-4 text-center transition-colors hover:bg-slate-50 hover:border-primary-300"
            >
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Package className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-slate-700">配件申领</span>
            </Link>
            <Link
              href="/reminders/new"
              className="flex flex-col items-center justify-center rounded-lg border border-slate-200 p-4 text-center transition-colors hover:bg-slate-50 hover:border-primary-300"
            >
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Bell className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-slate-700">设置提醒</span>
            </Link>
            <Link
              href="/statistics"
              className="flex flex-col items-center justify-center rounded-lg border border-slate-200 p-4 text-center transition-colors hover:bg-slate-50 hover:border-primary-300"
            >
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                <ClipboardList className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-slate-700">数据统计</span>
            </Link>
            <Link
              href="/settings"
              className="flex flex-col items-center justify-center rounded-lg border border-slate-200 p-4 text-center transition-colors hover:bg-slate-50 hover:border-primary-300"
            >
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <Calendar className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-slate-700">系统设置</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
