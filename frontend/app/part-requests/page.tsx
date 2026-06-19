'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  AlertTriangle,
  ShoppingCart,
  User,
} from 'lucide-react';
import Link from 'next/link';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import StatusBoard from '@/components/StatusBoard';
import Timeline from '@/components/Timeline';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useDataTable } from '@/hooks/useDataTable';
import { useAuth } from '@/components/auth/AuthProvider';
import type { PartRequest, Part, OperationLog, User as UserType } from '@/lib/types';

const mockParts: Record<string, Part> = {
  'P001': { id: 'P001', partNumber: 'P001', name: '正时皮带套装', category: '发动机', price: 450, cost: 320, stockQuantity: 0, minStockLevel: 3, unit: '套', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  'P002': { id: 'P002', partNumber: 'P002', name: '机油滤清器', category: '保养', price: 45, cost: 28, stockQuantity: 50, minStockLevel: 20, unit: '个', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  'P003': { id: 'P003', partNumber: 'P003', name: '空气滤清器', category: '保养', price: 65, cost: 42, stockQuantity: 2, minStockLevel: 15, unit: '个', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  'P004': { id: 'P004', partNumber: 'P004', name: '前刹车片', category: '制动系统', price: 280, cost: 180, stockQuantity: 0, minStockLevel: 5, unit: '套', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  'P005': { id: 'P005', partNumber: 'P005', name: '火花塞', category: '点火系统', price: 120, cost: 75, stockQuantity: 10, minStockLevel: 20, unit: '支', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
};

const mockUsers: Record<string, UserType> = {
  'tech1': { id: 'tech1', username: 'tech1', name: '张技师', email: 'tech1@example.com', role: 'technician', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  'tech2': { id: 'tech2', username: 'tech2', name: '李技师', email: 'tech2@example.com', role: 'technician', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  'tech3': { id: 'tech3', username: 'tech3', name: '王技师', email: 'tech3@example.com', role: 'technician', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  'clerk1': { id: 'clerk1', username: 'clerk1', name: '赵库管', email: 'clerk1@example.com', role: 'partsClerk', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  'manager1': { id: 'manager1', username: 'manager1', name: '钱经理', email: 'manager1@example.com', role: 'manager', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
};

const mockPartRequests: (PartRequest & { part?: Part; isOverdue?: boolean; source?: string; handler?: string })[] = [
  {
    id: '1',
    requestNumber: 'PR202401001',
    workOrderId: 'WO202401001',
    partId: 'P001',
    part: mockParts['P001'],
    requestedBy: 'tech2',
    approvedBy: 'manager1',
    handler: 'clerk1',
    quantity: 2,
    status: 'approved',
    source: 'purchase',
    notes: '发动机维修需要，库存不足需采购',
    createdAt: '2024-01-14T09:30:00Z',
    updatedAt: '2024-01-14T09:45:00Z',
  },
  {
    id: '2',
    requestNumber: 'PR202401002',
    workOrderId: 'WO202401002',
    partId: 'P003',
    part: mockParts['P003'],
    requestedBy: 'tech1',
    quantity: 5,
    status: 'pending',
    source: 'inventory',
    isOverdue: true,
    notes: '保养工单需要',
    createdAt: '2024-01-13T10:00:00Z',
    updatedAt: '2024-01-13T10:00:00Z',
  },
  {
    id: '3',
    requestNumber: 'PR202401003',
    workOrderId: 'WO202401003',
    partId: 'P004',
    part: mockParts['P004'],
    requestedBy: 'tech1',
    quantity: 3,
    status: 'rejected',
    source: 'purchase',
    handler: 'manager1',
    notes: '预算不足，建议使用副厂件',
    createdAt: '2024-01-14T14:00:00Z',
    updatedAt: '2024-01-14T14:30:00Z',
  },
  {
    id: '4',
    requestNumber: 'PR202401004',
    workOrderId: 'WO202401004',
    partId: 'P002',
    part: mockParts['P002'],
    requestedBy: 'tech3',
    approvedBy: 'clerk1',
    handler: 'clerk1',
    quantity: 4,
    status: 'fulfilled',
    source: 'inventory',
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-14T11:00:00Z',
    fulfilledAt: '2024-01-14T11:00:00Z',
  },
  {
    id: '5',
    requestNumber: 'PR202401005',
    workOrderId: 'WO202401005',
    partId: 'P005',
    part: mockParts['P005'],
    requestedBy: 'tech2',
    quantity: 2,
    status: 'pending',
    source: 'inventory',
    notes: '点火系统检修需要',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
  {
    id: '6',
    requestNumber: 'PR202401006',
    workOrderId: 'WO202401006',
    partId: 'P001',
    part: mockParts['P001'],
    requestedBy: 'tech3',
    quantity: 1,
    status: 'pending',
    source: 'purchase',
    isOverdue: true,
    notes: '紧急维修，需尽快采购',
    createdAt: '2024-01-12T16:00:00Z',
    updatedAt: '2024-01-12T16:00:00Z',
  },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'fulfilled', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const sourceLabels: Record<string, string> = {
  inventory: '库存',
  purchase: '采购',
  transfer: '调拨',
};

const getStatusCounts = (data: typeof mockPartRequests) => ({
  pending: data.filter((r) => r.status === 'pending').length,
  approved: data.filter((r) => r.status === 'approved').length,
  fulfilled: data.filter((r) => r.status === 'fulfilled').length,
  rejected: data.filter((r) => r.status === 'rejected').length,
});

export default function PartRequestsPage() {
  const { isAuthorized } = useProtectedRoute({
    allowedRoles: ['technician', 'partsClerk', 'manager'],
  });
  const { user, hasRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    let data = mockPartRequests;

    if (user && user.role === 'technician') {
      data = data.filter((request) => request.requestedBy === user.id);
    }

    return data.filter((request) => {
      const matchesSearch =
        !searchQuery ||
        request.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.workOrderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.part?.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, user]);

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

  const statusCounts = getStatusCounts(mockPartRequests);

  const statusBoardItems = [
    {
      key: 'pending',
      label: '待审批',
      count: statusCounts.pending,
      color: 'amber' as const,
      icon: Clock,
      onClick: () => setStatusFilter(statusFilter === 'pending' ? '' : 'pending'),
      active: statusFilter === 'pending',
    },
    {
      key: 'approved',
      label: '采购中',
      count: statusCounts.approved,
      color: 'blue' as const,
      icon: ShoppingCart,
      onClick: () => setStatusFilter(statusFilter === 'approved' ? '' : 'approved'),
      active: statusFilter === 'approved',
    },
    {
      key: 'fulfilled',
      label: '已完成',
      count: statusCounts.fulfilled,
      color: 'green' as const,
      icon: CheckCircle,
      onClick: () => setStatusFilter(statusFilter === 'fulfilled' ? '' : 'fulfilled'),
      active: statusFilter === 'fulfilled',
    },
    {
      key: 'rejected',
      label: '已拒绝',
      count: statusCounts.rejected,
      color: 'red' as const,
      icon: XCircle,
      onClick: () => setStatusFilter(statusFilter === 'rejected' ? '' : 'rejected'),
      active: statusFilter === 'rejected',
    },
  ];

  const getOperationLogs = (request: typeof mockPartRequests[0]) => {
    const logs: { id: string; type: any; title: string; operatorName?: string; timestamp: string; oldValue?: string; newValue?: string }[] = [
      {
        id: `${request.id}-created`,
        type: 'partRequested',
        title: '提交配件申请',
        operatorName: mockUsers[request.requestedBy]?.name,
        timestamp: request.createdAt,
      },
    ];

    if (request.status === 'approved' || request.status === 'fulfilled') {
      logs.push({
        id: `${request.id}-approved`,
        type: 'partApproved',
        title: '申请已批准',
        operatorName: mockUsers[request.approvedBy || '']?.name || '管理员',
        timestamp: request.updatedAt,
      });
    }

    if (request.status === 'rejected') {
      logs.push({
        id: `${request.id}-rejected`,
        type: 'partRejected',
        title: `申请被拒绝：${request.notes}`,
        operatorName: mockUsers[request.handler || '']?.name || '管理员',
        timestamp: request.updatedAt,
      });
    }

    if (request.status === 'fulfilled' && request.fulfilledAt) {
      logs.push({
        id: `${request.id}-fulfilled`,
        type: 'partFulfilled',
        title: '配件已出库',
        operatorName: mockUsers[request.handler || '']?.name || '库管员',
        timestamp: request.fulfilledAt,
      });
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary-600" />
              配件缺货追踪
            </span>
          </CardTitle>
          {hasRole(['technician', 'manager']) && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建申领
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <StatusBoard items={statusBoardItems} showTotal={false} />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="搜索申领单、工单、配件名..."
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
          </div>

          <div className="space-y-3">
            {paginatedData.map((request) => {
              const isExpanded = expandedId === request.id;
              const part = request.part;
              const isLowStock = part && part.stockQuantity <= part.minStockLevel;

              return (
                <div
                  key={request.id}
                  className={`rounded-lg border transition-all ${
                    request.isOverdue
                      ? 'border-red-300 bg-red-50'
                      : isLowStock
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div
                    className="flex flex-col gap-4 p-4 cursor-pointer sm:flex-row sm:items-center sm:justify-between"
                    onClick={() => toggleExpand(request.id)}
                  >
                    <div className="flex flex-1 flex-wrap items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            request.status === 'pending'
                              ? 'bg-amber-100 text-amber-600'
                              : request.status === 'approved'
                              ? 'bg-blue-100 text-blue-600'
                              : request.status === 'fulfilled'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{request.requestNumber}</span>
                            <StatusBadge status={request.status} />
                            {request.isOverdue && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                <AlertTriangle className="h-3 w-3" />
                                超时
                              </span>
                            )}
                            {isLowStock && !request.isOverdue && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                <AlertTriangle className="h-3 w-3" />
                                缺货
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">
                            工单：{request.workOrderId}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">配件：</span>
                          <span className="font-medium text-slate-900">{part?.name || request.partId}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">数量：</span>
                          <span className="font-medium text-slate-900">{request.quantity} {part?.unit || '件'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">来源：</span>
                          <span className="font-medium text-slate-900">{sourceLabels[request.source || 'inventory']}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">申请人：</span>
                          <span className="font-medium text-slate-900">{mockUsers[request.requestedBy]?.name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">申请时间：</span>
                          <span className="font-medium text-slate-900">{formatDateTime(request.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasRole(['manager', 'partsClerk']) && request.status === 'pending' && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline">
                            <CheckCircle className="mr-1 h-4 w-4" />
                            批准
                          </Button>
                          <Button size="sm" variant="danger" outline>
                            <XCircle className="mr-1 h-4 w-4" />
                            拒绝
                          </Button>
                        </div>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-200 p-4">
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div>
                          <h4 className="mb-3 font-medium text-slate-900">申请详情</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">配件编号</span>
                              <span className="font-mono">{part?.partNumber || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">配件分类</span>
                              <span>{part?.category || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">当前库存</span>
                              <span className={isLowStock ? 'text-red-600 font-medium' : ''}>
                                {part?.stockQuantity || 0} {part?.unit || '件'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">最低库存</span>
                              <span>{part?.minStockLevel || 0} {part?.unit || '件'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">单价</span>
                              <span>¥{part?.price || 0}</span>
                            </div>
                            {request.notes && (
                              <div className="pt-2">
                                <span className="text-slate-500">备注说明</span>
                                <p className="mt-1 text-slate-700">{request.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-3 font-medium text-slate-900">处理记录</h4>
                          <div className="bg-slate-50 rounded-lg p-4">
                            <Timeline items={getOperationLogs(request)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {paginatedData.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">
                暂无数据
              </div>
            )}
          </div>

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
