'use client';

import { useState } from 'react';
import { Plus, Search, Bell, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import { formatDate } from '@/lib/utils';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useDataTable } from '@/hooks/useDataTable';
import type { MaintenanceReminder } from '@/lib/types';

const mockReminders: MaintenanceReminder[] = [
  {
    id: '1',
    vehicleId: '1',
    customerId: '1',
    customerName: '张三',
    type: 'maintenance',
    title: '常规保养提醒',
    description: '车辆已行驶5000公里，建议进行常规保养',
    reminderDate: '2024-01-20',
    mileageThreshold: 50000,
    currentMileage: 45000,
    status: 'active',
    createdBy: 'advisor1',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: '2',
    vehicleId: '2',
    customerId: '2',
    customerName: '李四',
    type: 'inspection',
    title: '年检提醒',
    description: '车辆年检即将到期，请及时办理',
    reminderDate: '2024-02-15',
    status: 'active',
    createdBy: 'advisor1',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: '3',
    vehicleId: '3',
    customerId: '3',
    customerName: '王五',
    type: 'service',
    title: '刹车系统检查',
    description: '建议下次保养时检查刹车片磨损情况',
    reminderDate: '2024-01-25',
    status: 'completed',
    workOrderId: 'WO202401003',
    createdBy: 'advisor1',
    createdAt: '2023-12-20T00:00:00Z',
    updatedAt: '2024-01-14T00:00:00Z',
    completedAt: '2024-01-14T00:00:00Z',
  },
  {
    id: '4',
    vehicleId: '5',
    customerId: '5',
    customerName: '孙七',
    type: 'maintenance',
    title: '大保养提醒',
    description: '车辆即将达到6万公里大保养里程',
    reminderDate: '2024-02-01',
    mileageThreshold: 60000,
    currentMileage: 52000,
    status: 'active',
    createdBy: 'advisor2',
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z',
  },
  {
    id: '5',
    vehicleId: '4',
    customerId: '4',
    customerName: '赵六',
    type: 'custom',
    title: '空调清洗提醒',
    description: '建议春季进行空调系统清洗',
    reminderDate: '2024-03-01',
    status: 'active',
    createdBy: 'advisor1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '生效中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'maintenance', label: '保养提醒' },
  { value: 'service', label: '服务提醒' },
  { value: 'inspection', label: '年检提醒' },
  { value: 'custom', label: '自定义' },
];

export default function RemindersPage() {
  const { isAuthorized } = useProtectedRoute({
    allowedRoles: ['advisor', 'manager'],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filteredData = mockReminders.filter((reminder) => {
    const matchesSearch =
      !searchQuery ||
      reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || reminder.status === statusFilter;
    const matchesType = !typeFilter || reminder.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const {
    data: paginatedData,
    currentPage,
    totalPages,
    goToPage,
  } = useDataTable({
    data: filteredData,
    pageSize: 10,
  });

  if (!isAuthorized) {
    return null;
  }

  const columns = [
    { key: 'title', title: '提醒标题' },
    { key: 'customerName', title: '客户姓名' },
    {
      key: 'type',
      title: '类型',
      render: (row: MaintenanceReminder) => {
        const typeLabels: Record<string, string> = {
          maintenance: '保养提醒',
          service: '服务提醒',
          inspection: '年检提醒',
          custom: '自定义',
        };
        return typeLabels[row.type] || row.type;
      },
    },
    {
      key: 'reminderDate',
      title: '提醒日期',
      render: (row: MaintenanceReminder) => row.reminderDate,
    },
    {
      key: 'status',
      title: '状态',
      render: (row: MaintenanceReminder) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      title: '操作',
      render: (row: MaintenanceReminder) => (
        <div className="flex gap-2">
          {row.status === 'active' && (
            <button className="text-sm text-primary-600 hover:underline">
              标记完成
            </button>
          )}
          <button className="text-sm text-slate-500 hover:text-slate-700">
            编辑
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>保养提醒</CardTitle>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新建提醒
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="搜索提醒..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="sm:w-36">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={statusOptions}
                />
              </div>
              <div className="sm:w-36">
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  options={typeOptions}
                />
              </div>
            </div>
          </div>

          <DataTable columns={columns} data={paginatedData} />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
