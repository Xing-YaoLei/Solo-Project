'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import DataTable from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import BatchToolbar from '@/components/BatchToolbar';
import ConfirmModal from '@/components/ConfirmModal';
import { formatDate } from '@/lib/utils';
import { workOrderStatusLabels, workOrderStatusColors } from '@/lib/auth';
import { useAuth } from '@/components/auth/AuthProvider';
import { workOrderApi } from '@/lib/api-endpoints';
import type { WorkOrder, WorkOrderStatus, PaginatedResponse } from '@/lib/types';

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'PENDING', label: '待处理' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'WAITING_PARTS', label: '待配件' },
  { value: 'QUALITY_CHECK', label: '质检中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
];

const statusTabs: { value: string; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'PENDING', label: '待处理' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'WAITING_PARTS', label: '待配件' },
  { value: 'QUALITY_CHECK', label: '质检中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
];

const batchStatusOptions = [
  { value: 'PENDING', label: '待处理' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'WAITING_PARTS', label: '待配件' },
  { value: 'QUALITY_CHECK', label: '质检中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
];

export default function WorkOrdersPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [technicians, setTechnicians] = useState<{ value: string; label: string }[]>([]);
  const [batchAction, setBatchAction] = useState<{ type: 'status' | 'technician'; value: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  const pageSize = 10;

  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page: currentPage, pageSize };
      if (statusFilter) params.status = statusFilter;
      const res: PaginatedResponse<WorkOrder> = await workOrderApi.getAll(params);
      setWorkOrders(res.data);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err?.message || '加载工单失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, pageSize]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  useEffect(() => {
    if (hasRole(['MANAGER', 'ADVISOR'])) {
      workOrderApi.getTechnicians().then((techs) => {
        setTechnicians(
          (techs as any[]).map((t: any) => ({ value: t.id, label: t.name || t.username }))
        );
      }).catch(() => {});
    }
  }, [hasRole]);

  const allSelected = workOrders.length > 0 && workOrders.every((row) => selectedIds.includes(row.id));
  const someSelected = workOrders.some((row) => selectedIds.includes(row.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds([...new Set([...selectedIds, ...workOrders.map((row) => row.id)])]);
    } else {
      const pageIds = new Set(workOrders.map((row) => row.id));
      setSelectedIds(selectedIds.filter((id) => !pageIds.has(id)));
    }
  };

  const handleBatchStatusChange = (status: string) => {
    setBatchAction({ type: 'status', value: status });
    setShowConfirm(true);
  };

  const handleBatchTechnicianChange = (technicianId: string) => {
    setBatchAction({ type: 'technician', value: technicianId });
    setShowConfirm(true);
  };

  const handleConfirmBatch = async () => {
    if (!batchAction || !user) return;
    try {
      setBatchLoading(true);
      if (batchAction.type === 'status') {
        await workOrderApi.batchUpdateStatus({
          ids: selectedIds,
          status: batchAction.value,
          operatorId: user.id,
        });
      } else {
        await workOrderApi.batchAssign({
          ids: selectedIds,
          technicianId: batchAction.value,
          operatorId: user.id,
        });
      }
      setSelectedIds([]);
      setShowConfirm(false);
      setBatchAction(null);
      fetchWorkOrders();
    } catch (err: any) {
      alert(err?.message || '批量操作失败');
    } finally {
      setBatchLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds([]);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const columns = [
    {
      key: 'orderNumber',
      title: '工单号',
      render: (row: WorkOrder) => (
        <Link href={`/work-orders/${row.id}`} className="font-medium text-primary-600 hover:underline">
          {row.orderNumber}
        </Link>
      ),
    },
    {
      key: 'plateNumber',
      title: '车牌号',
      render: (row: WorkOrder) => <span className="font-mono">{row.vehicle?.plateNumber || '-'}</span>,
    },
    {
      key: 'vehicleModel',
      title: '车型',
      render: (row: WorkOrder) => (
        <span>{row.vehicle ? `${row.vehicle.brand} ${row.vehicle.model}` : '-'}</span>
      ),
    },
    {
      key: 'ownerName',
      title: '车主',
      render: (row: WorkOrder) => row.vehicle?.ownerName || '-',
    },
    {
      key: 'status',
      title: '状态',
      render: (row: WorkOrder) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${workOrderStatusColors[row.status] || 'bg-slate-100 text-slate-800'}`}>
          {workOrderStatusLabels[row.status] || row.status}
        </span>
      ),
    },
    {
      key: 'advisor',
      title: '顾问',
      render: (row: WorkOrder) => row.advisor?.name || '-',
    },
    {
      key: 'technician',
      title: '技师',
      render: (row: WorkOrder) => row.technician?.name || '-',
    },
    {
      key: 'createdAt',
      title: '创建时间',
      render: (row: WorkOrder) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      title: '操作',
      width: '80px',
      render: (row: WorkOrder) => (
        <Button variant="ghost" size="sm" onClick={() => router.push(`/work-orders/${row.id}`)}>
          <Eye className="mr-1 h-4 w-4" />详情
        </Button>
      ),
    },
  ];

  const confirmMessage = batchAction
    ? batchAction.type === 'status'
      ? `确定要将选中的 ${selectedIds.length} 个工单状态改为"${workOrderStatusLabels[batchAction.value]}"吗？`
      : `确定要将选中的 ${selectedIds.length} 个工单分派给"${technicians.find((t) => t.value === batchAction.value)?.label}"吗？`
    : '';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>工单管理</CardTitle>
          {hasRole(['MANAGER', 'ADVISOR']) && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建工单
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="搜索工单号、车牌号..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="sm:w-40">
                <Select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  options={statusOptions}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                高级筛选
              </Button>
            </div>
          </div>

          <div className="flex gap-2 border-b border-slate-200">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatusFilterChange(tab.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  statusFilter === tab.value
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {hasRole(['MANAGER', 'ADVISOR']) && (
            <BatchToolbar
              selectedCount={selectedIds.length}
              totalCount={totalItems}
              onClearSelection={() => setSelectedIds([])}
              statusOptions={batchStatusOptions}
              technicianOptions={technicians}
              onStatusChange={handleBatchStatusChange}
              onTechnicianChange={handleBatchTechnicianChange}
            />
          )}

          {error ? (
            <div className="py-8 text-center text-sm text-red-500">{error}</div>
          ) : (
            <DataTable
              columns={columns}
              data={workOrders}
              loading={loading}
              selectable={hasRole(['MANAGER', 'ADVISOR'])}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onSelectAll={handleSelectAll}
              allSelected={allSelected}
              someSelected={someSelected}
              rowKey="id"
            />
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => { setShowConfirm(false); setBatchAction(null); }}
        onConfirm={handleConfirmBatch}
        title={batchAction?.type === 'status' ? '确认批量改状态' : '确认批量分派技师'}
        message={confirmMessage}
        confirmText="确认"
        cancelText="取消"
        type="warning"
        isLoading={batchLoading}
      />
    </div>
  );
}
