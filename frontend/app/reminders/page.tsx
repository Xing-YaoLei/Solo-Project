'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Bell, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Pagination from '@/components/Pagination';
import { formatDate, formatCurrency } from '@/lib/utils';
import { maintenanceTypeLabels } from '@/lib/auth';
import { useAuth } from '@/components/auth/AuthProvider';
import { reminderApi } from '@/lib/api-endpoints';
import type { MaintenanceReminder, PaginatedResponse, MaintenanceType } from '@/lib/types';

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '生效中' },
  { value: 'completed', label: '已完成' },
];

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'OIL_CHANGE', label: '机油更换' },
  { value: 'TIRE_ROTATION', label: '轮胎换位' },
  { value: 'BRAKE_SERVICE', label: '刹车保养' },
  { value: 'TRANSMISSION_SERVICE', label: '变速箱保养' },
  { value: 'COOLANT_SERVICE', label: '冷却液更换' },
  { value: 'BATTERY_CHECK', label: '电瓶检查' },
  { value: 'TIMING_BELT', label: '正时皮带' },
  { value: 'GENERAL_INSPECTION', label: '综合检查' },
  { value: 'CUSTOM', label: '自定义' },
];

export default function RemindersPage() {
  const { user, hasRole } = useAuth();

  const [reminders, setReminders] = useState<MaintenanceReminder[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [completeLoading, setCompleteLoading] = useState<string | null>(null);

  const pageSize = 10;

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page: currentPage, pageSize };
      if (statusFilter === 'active') params.isCompleted = false;
      else if (statusFilter === 'completed') params.isCompleted = true;
      if (typeFilter) params.type = typeFilter;
      const res: PaginatedResponse<MaintenanceReminder> = await reminderApi.getAll(params);
      setReminders(res.data);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err?.message || '加载提醒数据失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, typeFilter, pageSize]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleComplete = async (id: string) => {
    try {
      setCompleteLoading(id);
      await reminderApi.complete(id);
      fetchReminders();
    } catch (err: any) {
      alert(err?.message || '操作失败');
    } finally {
      setCompleteLoading(null);
    }
  };

  const handleFilterChange = (filterType: 'status' | 'type', value: string) => {
    if (filterType === 'status') setStatusFilter(value);
    else setTypeFilter(value);
    setCurrentPage(1);
  };

  const columns = [
    {
      key: 'type',
      title: '保养类型',
      render: (row: MaintenanceReminder) => (
        <span className="font-medium">{maintenanceTypeLabels[row.type] || row.type}</span>
      ),
    },
    {
      key: 'vehicle',
      title: '车牌号',
      render: (row: MaintenanceReminder) => (
        <span className="font-mono">{row.vehicle?.plateNumber || '-'}</span>
      ),
    },
    {
      key: 'owner',
      title: '车主',
      render: (row: MaintenanceReminder) => row.vehicle?.ownerName || '-',
    },
    {
      key: 'description',
      title: '描述',
      render: (row: MaintenanceReminder) => (
        <span className="text-slate-600">{row.description || '-'}</span>
      ),
    },
    {
      key: 'nextDate',
      title: '下次日期',
      render: (row: MaintenanceReminder) => row.nextDate ? formatDate(row.nextDate) : '-',
    },
    {
      key: 'nextMileage',
      title: '下次里程',
      render: (row: MaintenanceReminder) => row.nextMileage ? `${row.nextMileage.toLocaleString()} km` : '-',
    },
    {
      key: 'status',
      title: '状态',
      render: (row: MaintenanceReminder) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          row.isCompleted
            ? 'bg-green-100 text-green-800'
            : 'bg-amber-100 text-amber-800'
        }`}>
          {row.isCompleted ? '已完成' : '生效中'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (row: MaintenanceReminder) => (
        <div className="flex gap-2">
          {!row.isCompleted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleComplete(row.id)}
              isLoading={completeLoading === row.id}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              完成
            </Button>
          )}
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
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  options={statusOptions}
                />
              </div>
              <div className="sm:w-36">
                <Select
                  value={typeFilter}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  options={typeOptions}
                />
              </div>
            </div>
          </div>

          {error ? (
            <div className="py-8 text-center text-sm text-red-500">{error}</div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">保养类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">车牌号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">车主</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">描述</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">下次日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">下次里程</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {reminders.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-500">暂无数据</td></tr>
                  ) : reminders.map((reminder) => (
                    <tr key={reminder.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className="font-medium text-slate-900">{maintenanceTypeLabels[reminder.type] || reminder.type}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-slate-900">{reminder.vehicle?.plateNumber || '-'}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{reminder.vehicle?.ownerName || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{reminder.description || '-'}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{reminder.nextDate ? formatDate(reminder.nextDate) : '-'}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{reminder.nextMileage ? `${reminder.nextMileage.toLocaleString()} km` : '-'}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          reminder.isCompleted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {reminder.isCompleted ? '已完成' : '生效中'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {!reminder.isCompleted && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleComplete(reminder.id)}
                            isLoading={completeLoading === reminder.id}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            完成
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
