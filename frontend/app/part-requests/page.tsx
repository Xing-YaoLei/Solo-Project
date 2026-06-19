'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Pagination from '@/components/Pagination';
import StatusBoard from '@/components/StatusBoard';
import { formatDateTime } from '@/lib/utils';
import { partRequestStatusLabels } from '@/lib/auth';
import { useAuth } from '@/components/auth/AuthProvider';
import { partRequestApi } from '@/lib/api-endpoints';
import type { PartRequest, KanbanStats, PartRequestHistory, PaginatedResponse } from '@/lib/types';

const partRequestStatusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  PROCURING: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
};

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'PENDING', label: '待审批' },
  { value: 'APPROVED', label: '已批准' },
  { value: 'REJECTED', label: '已拒绝' },
  { value: 'PROCURING', label: '采购中' },
  { value: 'COMPLETED', label: '已完成' },
];

function isOverdue(createdAt: string, status: string): boolean {
  if (status !== 'PENDING') return false;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return now - created > 24 * 60 * 60 * 1000;
}

export default function PartRequestsPage() {
  const { user, hasRole } = useAuth();

  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);
  const [kanbanStats, setKanbanStats] = useState<KanbanStats | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historiesMap, setHistoriesMap] = useState<Record<string, PartRequestHistory[]>>({});

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const pageSize = 10;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page: currentPage, pageSize };
      if (statusFilter) params.status = statusFilter;
      const [requestsRes, stats] = await Promise.all([
        partRequestApi.getAll(params),
        partRequestApi.getKanbanStats(),
      ]);
      setPartRequests(requestsRes.data);
      setTotalPages(requestsRes.totalPages);
      setKanbanStats(stats);
    } catch (err: any) {
      setError(err?.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!historiesMap[id]) {
      try {
        const histories = await partRequestApi.getHistories(id);
        setHistoriesMap((prev) => ({ ...prev, [id]: histories }));
      } catch {
        setHistoriesMap((prev) => ({ ...prev, [id]: [] }));
      }
    }
  };

  const handleApprove = async (id: string) => {
    if (!user) return;
    try {
      setActionLoading(id);
      await partRequestApi.updateStatus(id, {
        status: 'APPROVED',
        handlerId: user.id,
      });
      fetchData();
    } catch (err: any) {
      alert(err?.message || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!user) return;
    try {
      setActionLoading(id);
      await partRequestApi.updateStatus(id, {
        status: 'REJECTED',
        handlerId: user.id,
      });
      fetchData();
    } catch (err: any) {
      alert(err?.message || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const statusBoardItems = kanbanStats
    ? [
        {
          key: 'PENDING',
          label: '待审批',
          count: kanbanStats.pending,
          color: 'amber' as const,
          icon: Clock,
          onClick: () => handleStatusFilterChange(statusFilter === 'PENDING' ? '' : 'PENDING'),
          active: statusFilter === 'PENDING',
        },
        {
          key: 'APPROVED',
          label: '已批准',
          count: kanbanStats.approved,
          color: 'blue' as const,
          icon: ShoppingCart,
          onClick: () => handleStatusFilterChange(statusFilter === 'APPROVED' ? '' : 'APPROVED'),
          active: statusFilter === 'APPROVED',
        },
        {
          key: 'PROCURING',
          label: '采购中',
          count: kanbanStats.procuring,
          color: 'purple' as const,
          icon: Package,
          onClick: () => handleStatusFilterChange(statusFilter === 'PROCURING' ? '' : 'PROCURING'),
          active: statusFilter === 'PROCURING',
        },
        {
          key: 'COMPLETED',
          label: '已完成',
          count: kanbanStats.completed,
          color: 'green' as const,
          icon: CheckCircle,
          onClick: () => handleStatusFilterChange(statusFilter === 'COMPLETED' ? '' : 'COMPLETED'),
          active: statusFilter === 'COMPLETED',
        },
        {
          key: 'REJECTED',
          label: '已拒绝',
          count: kanbanStats.rejected,
          color: 'red' as const,
          icon: XCircle,
          onClick: () => handleStatusFilterChange(statusFilter === 'REJECTED' ? '' : 'REJECTED'),
          active: statusFilter === 'REJECTED',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary-600" />
              配件申请管理
            </span>
          </CardTitle>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新建申领
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {kanbanStats && <StatusBoard items={statusBoardItems} showTotal={true} totalLabel="总计" />}

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
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  options={statusOptions}
                />
              </div>
            </div>
          </div>

          {error ? (
            <div className="py-8 text-center text-sm text-red-500">{error}</div>
          ) : (
            <div className="space-y-3">
              {partRequests.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">暂无数据</div>
              ) : partRequests.map((request) => {
                const isExpanded = expandedId === request.id;
                const overdue = isOverdue(request.createdAt, request.status);
                const part = request.part;
                const histories = historiesMap[request.id] || [];

                return (
                  <div
                    key={request.id}
                    className={`rounded-lg border transition-all ${
                      overdue
                        ? 'border-red-300 bg-red-50'
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
                              partRequestStatusColors[request.status] || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Package className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">{request.requestNumber}</span>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${partRequestStatusColors[request.status] || 'bg-slate-100 text-slate-800'}`}>
                                {partRequestStatusLabels[request.status] || request.status}
                              </span>
                              {overdue && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                  <AlertTriangle className="h-3 w-3" />
                                  超时
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">
                              工单：{request.workOrder?.orderNumber || request.workOrderId}
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
                            <span className="text-slate-500">申请时间：</span>
                            <span className="font-medium text-slate-900">{formatDateTime(request.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasRole(['MANAGER', 'PARTS_CLERK']) && request.status === 'PENDING' && (
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(request.id)}
                              isLoading={actionLoading === request.id}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              批准
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              outline
                              onClick={() => handleReject(request.id)}
                              isLoading={actionLoading === request.id}
                            >
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
                                <span className={part && part.stock <= part.minStock ? 'text-red-600 font-medium' : ''}>
                                  {part?.stock ?? '-'} {part?.unit || '件'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">单价</span>
                                <span>{part ? `¥${part.unitPrice}` : '-'}</span>
                              </div>
                              {request.handlingNotes && (
                                <div className="pt-2">
                                  <span className="text-slate-500">处理备注</span>
                                  <p className="mt-1 text-slate-700">{request.handlingNotes}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="mb-3 font-medium text-slate-900">处理记录</h4>
                            <div className="rounded-lg bg-slate-50 p-4">
                              {histories.length === 0 ? (
                                <p className="text-center text-sm text-slate-500">暂无处理记录</p>
                              ) : (
                                <div className="space-y-1">
                                  {histories.map((h) => (
                                    <div key={h.id} className="relative flex gap-4">
                                      <div className="relative flex flex-col items-center">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                                          <Clock className="h-4 w-4" />
                                        </div>
                                        <div className="w-0.5 flex-1 bg-slate-200" />
                                      </div>
                                      <div className="flex-1 pb-4">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-slate-900">
                                            {partRequestStatusLabels[h.oldStatus] || h.oldStatus} → {partRequestStatusLabels[h.newStatus] || h.newStatus}
                                          </span>
                                          <span className="text-xs text-slate-500">{formatDateTime(h.changedAt)}</span>
                                        </div>
                                        {h.handlingNotes && (
                                          <p className="mt-1 text-sm text-slate-600">{h.handlingNotes}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => { setCurrentPage(page); setExpandedId(null); }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
