'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, Eye, RefreshCw, Filter, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import BatchToolbar from '@/components/BatchToolbar';
import ConfirmModal from '@/components/ConfirmModal';
import { formatDate } from '@/lib/utils';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useDataTable } from '@/hooks/useDataTable';
import { useAuth } from '@/components/auth/AuthProvider';
import type { WorkOrder, Vehicle, User, WorkOrderStatus } from '@/lib/types';

const mockVehicles: Record<string, Vehicle> = {
  '1': { id: '1', licensePlate: '京A12345', brand: '丰田', model: '凯美瑞', year: 2020, customerId: '1', customerName: '张三', customerPhone: '13800138001', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  '2': { id: '2', licensePlate: '京B67890', brand: '本田', model: '雅阁', year: 2019, customerId: '2', customerName: '李四', customerPhone: '13800138002', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  '3': { id: '3', licensePlate: '沪C11111', brand: '大众', model: '帕萨特', year: 2021, customerId: '3', customerName: '王五', customerPhone: '13800138003', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  '4': { id: '4', licensePlate: '粤D22222', brand: '别克', model: '君威', year: 2018, customerId: '4', customerName: '赵六', customerPhone: '13800138004', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  '5': { id: '5', licensePlate: '浙E33333', brand: '奥迪', model: 'A4L', year: 2022, customerId: '5', customerName: '孙七', customerPhone: '13800138005', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  '6': { id: '6', licensePlate: '苏F44444', brand: '奔驰', model: 'C200', year: 2020, customerId: '6', customerName: '周八', customerPhone: '13800138006', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
};

const mockAdvisors: Record<string, User> = {
  '1': { id: '1', username: 'advisor1', name: '李顾问', email: 'advisor1@example.com', role: 'advisor', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  '2': { id: '2', username: 'advisor2', name: '王顾问', email: 'advisor2@example.com', role: 'advisor', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
};

const mockTechnicians: Record<string, User> = {
  '1': { id: '1', username: 'tech1', name: '张技师', email: 'tech1@example.com', role: 'technician', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  '2': { id: '2', username: 'tech2', name: '李技师', email: 'tech2@example.com', role: 'technician', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  '3': { id: '3', username: 'tech3', name: '王技师', email: 'tech3@example.com', role: 'technician', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
};

const mockWorkOrders: WorkOrder[] = [
  {
    id: '1',
    orderNumber: 'WO202401001',
    vehicleId: '1',
    customerId: '1',
    customerName: '张三',
    customerPhone: '13800138001',
    advisorId: '1',
    technicianId: '2',
    status: 'inProgress',
    description: '发动机异响检修',
    serviceType: '维修',
    estimatedHours: 4,
    actualHours: 2.5,
    partsCost: 850,
    laborCost: 600,
    totalCost: 1450,
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
    advisorId: '2',
    technicianId: '1',
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
    technicianId: '3',
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
    advisorId: '2',
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
  {
    id: '6',
    orderNumber: 'WO202401006',
    vehicleId: '6',
    customerId: '6',
    customerName: '周八',
    customerPhone: '13800138006',
    advisorId: '1',
    status: 'pending',
    description: '变速箱油更换',
    serviceType: '保养',
    estimatedHours: 2,
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'inProgress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const statusTabs = [
  { value: '', label: '全部', color: 'slate' },
  { value: 'pending', label: '待处理', color: 'amber' },
  { value: 'inProgress', label: '进行中', color: 'blue' },
  { value: 'completed', label: '已完成', color: 'green' },
  { value: 'cancelled', label: '已取消', color: 'slate' },
];

const technicianOptions = [
  { value: '1', label: '张技师' },
  { value: '2', label: '李技师' },
  { value: '3', label: '王技师' },
];

interface WorkOrderWithDetails extends WorkOrder {
  vehicle?: Vehicle;
  advisor?: User;
  technician?: User;
}

export default function WorkOrdersPage() {
  const { isAuthorized } = useProtectedRoute();
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const [batchTechnician, setBatchTechnician] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'status' | 'technician'>('status');

  const workOrdersWithDetails: WorkOrderWithDetails[] = useMemo(() => {
    return mockWorkOrders.map((order) => ({
      ...order,
      vehicle: mockVehicles[order.vehicleId],
      advisor: mockAdvisors[order.advisorId],
      technician: order.technicianId ? mockTechnicians[order.technicianId] : undefined,
    }));
  }, []);

  const filteredData = useMemo(() => {
    let data = workOrdersWithDetails;

    if (user && !hasRole(['manager'])) {
      if (user.role === 'advisor') {
        data = data.filter((order) => order.advisorId === user.id);
      } else if (user.role === 'technician') {
        data = data.filter((order) => order.technicianId === user.id);
      }
    }

    return data.filter((order) => {
      const matchesStatus = !statusFilter || order.status === statusFilter;
      const matchesSearch =
        !searchQuery ||
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.vehicle?.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [workOrdersWithDetails, statusFilter, searchQuery, user, hasRole]);

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

  const allSelected = paginatedData.length > 0 && paginatedData.every((row) => selectedIds.includes(row.id));
  const someSelected = paginatedData.some((row) => selectedIds.includes(row.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = paginatedData.map((row) => row.id);
      setSelectedIds([...new Set([...selectedIds, ...allIds])]);
    } else {
      const pageIds = new Set(paginatedData.map((row) => row.id));
      setSelectedIds(selectedIds.filter((id) => !pageIds.has(id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleBatchStatusChange = (status: string) => {
    setBatchStatus(status);
    setConfirmAction('status');
    setShowConfirmModal(true);
  };

  const handleBatchTechnicianChange = (technicianId: string) => {
    setBatchTechnician(technicianId);
    setConfirmAction('technician');
    setShowConfirmModal(true);
  };

  const handleConfirmBatch = () => {
    if (confirmAction === 'status') {
      console.log('批量改状态:', selectedIds, batchStatus);
    } else {
      console.log('批量分派技师:', selectedIds, batchTechnician);
    }
    setShowConfirmModal(false);
    setSelectedIds([]);
  };

  const handleViewDetail = (id: string) => {
    router.push(`/work-orders/${id}`);
  };

  const columns = [
    {
      key: 'orderNumber',
      title: '工单号',
      render: (row: WorkOrderWithDetails) => (
        <Link
          href={`/work-orders/${row.id}`}
          className="text-primary-600 hover:underline font-medium"
        >
          {row.orderNumber}
        </Link>
      ),
    },
    {
      key: 'licensePlate',
      title: '车牌号',
      render: (row: WorkOrderWithDetails) => (
        <span className="font-mono">{row.vehicle?.licensePlate || '-'}</span>
      ),
    },
    {
      key: 'vehicleModel',
      title: '车型',
      render: (row: WorkOrderWithDetails) => (
        <span>{row.vehicle ? `${row.vehicle.brand} ${row.vehicle.model}` : '-'}</span>
      ),
    },
    { key: 'customerName', title: '车主' },
    {
      key: 'status',
      title: '状态',
      render: (row: WorkOrderWithDetails) => <StatusBadge status={row.status} />,
    },
    {
      key: 'advisor',
      title: '顾问',
      render: (row: WorkOrderWithDetails) => row.advisor?.name || '-',
    },
    {
      key: 'technician',
      title: '技师',
      render: (row: WorkOrderWithDetails) => row.technician?.name || '-',
    },
    {
      key: 'createdAt',
      title: '创建时间',
      render: (row: WorkOrderWithDetails) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      title: '操作',
      width: '160px',
      render: (row: WorkOrderWithDetails) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetail(row.id)}
          >
            <Eye className="mr-1 h-4 w-4" />
            详情
          </Button>
          <Button
            variant="ghost"
            size="sm"
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            改状态
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>工单管理</CardTitle>
          {hasRole(['manager', 'advisor']) && (
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
                  placeholder="搜索工单号、车牌号、车主名..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="sm:w-40">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                onClick={() => setStatusFilter(tab.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  statusFilter === tab.value
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 rounded-full px-2 py-0.5 text-xs ${
                  statusFilter === tab.value ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.value === ''
                    ? filteredData.length
                    : filteredData.filter((o) => o.status === tab.value).length}
                </span>
              </button>
            ))}
          </div>

          {hasRole(['manager', 'advisor']) && (
            <BatchToolbar
              selectedCount={selectedIds.length}
              totalCount={filteredData.length}
              onClearSelection={handleClearSelection}
              statusOptions={[
                { value: 'pending', label: '待处理' },
                { value: 'inProgress', label: '进行中' },
                { value: 'completed', label: '已完成' },
                { value: 'cancelled', label: '已取消' },
              ]}
              technicianOptions={technicianOptions}
              onStatusChange={handleBatchStatusChange}
              onTechnicianChange={handleBatchTechnicianChange}
            />
          )}

          <DataTable
            columns={columns}
            data={paginatedData}
            selectable={hasRole(['manager', 'advisor'])}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onSelectAll={handleSelectAll}
            allSelected={allSelected}
            someSelected={someSelected}
            rowKey="id"
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBatch}
        title={confirmAction === 'status' ? '确认批量改状态' : '确认批量分派技师'}
        message={
          confirmAction === 'status'
            ? `确定要将选中的 ${selectedIds.length} 个工单状态改为${batchStatus}吗？`
            : `确定要将选中的 ${selectedIds.length} 个工单分派给${technicianOptions.find(t => t.value === batchTechnician)?.label}吗？`
        }
        confirmText="确认"
        cancelText="取消"
        type="warning"
      />
    </div>
  );
}
