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
  X,
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
import type { PartRequest, KanbanStats, PartRequestHistory, PaginatedResponse, PartRequestSource } from '@/lib/types';

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

const sourceOptions = [
  { value: 'INVENTORY', label: '库存出库' },
  { value: 'PROCUREMENT', label: '采购入库' },
  { value: 'TRANSFER', label: '调拨' },
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
  const [showApproveModal, setShowApproveModal] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [formSource, setFormSource] = useState<PartRequestSource>('INVENTORY');
  const [formBeforeMaterial, setFormBeforeMaterial] = useState('');
  const [formAfterMaterial, setFormAfterMaterial] = useState('');
  const [formConclusion, setFormConclusion] = useState('');
  const [formHandlingNotes, setFormHandlingNotes] = useState('');
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

  const openApproveModal = (id: string) => {
    setShowApproveModal(id);
    setFormSource('INVENTORY');
    setFormBeforeMaterial('');
    setFormAfterMaterial('');
    setFormConclusion('');
    setFormHandlingNotes('');
  };

  const openRejectModal = (id: string) => {
    setShowRejectModal(id);
    setFormHandlingNotes('');
    setFormConclusion('');
  };

  const closeModal = () => {
    setShowApproveModal(null);
    setShowRejectModal(null);
  };

  const handleApprove = async () => {
    if (!user || !showApproveModal) return;
    try {
      setActionLoading(showApproveModal);
      await partRequestApi.updateStatus(showApproveModal, {
        status: 'APPROVED',
        handlerId: user.id,
        handlingNotes: formHandlingNotes || undefined,
        source: formSource,
        beforeMaterial: formBeforeMaterial || undefined,
        afterMaterial: formAfterMaterial || undefined,
        conclusion: formConclusion || undefined,
      });
      closeModal();
      fetchData();
      if (historiesMap[showApproveModal]) {
        const histories = await partRequestApi.getHistories(showApproveModal);
        setHistoriesMap((prev) => ({ ...prev, [showApproveModal]: histories }));
      }
    } catch (err: any) {
      alert(err?.message || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!user || !showRejectModal) return;
    try {
      setActionLoading(showRejectModal);
      await partRequestApi.updateStatus(showRejectModal, {
        status: 'REJECTED',
        handlerId: user.id,
        handlingNotes: formHandlingNotes || undefined,
        conclusion: formConclusion || undefined,
      });
      closeModal();
      fetchData();
      if (historiesMap[showRejectModal]) {
        const histories = await partRequestApi.getHistories(showRejectModal);
        setHistoriesMap((prev) => ({ ...prev, [showRejectModal]: histories }));
      }
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
          count: kanbanStats.statusDistribution.PENDING || 0,
          color: 'amber' as const,
          icon: Clock,
          onClick: () => handleStatusFilterChange(statusFilter === 'PENDING' ? '' : 'PENDING'),
          active: statusFilter === 'PENDING',
        },
        {
          key: 'APPROVED',
          label: '已批准',
          count: kanbanStats.statusDistribution.APPROVED || 0,
          color: 'blue' as const,
          icon: ShoppingCart,
          onClick: () => handleStatusFilterChange(statusFilter === 'APPROVED' ? '' : 'APPROVED'),
          active: statusFilter === 'APPROVED',
        },
        {
          key: 'PROCURING',
          label: '采购中',
          count: kanbanStats.statusDistribution.PROCURING || 0,
          color: 'purple' as const,
          icon: Package,
          onClick: () => handleStatusFilterChange(statusFilter === 'PROCURING' ? '' : 'PROCURING'),
          active: statusFilter === 'PROCURING',
        },
        {
          key: 'COMPLETED',
          label: '已完成',
          count: kanbanStats.statusDistribution.COMPLETED || 0,
          color: 'green' as const,
          icon: CheckCircle,
          onClick: () => handleStatusFilterChange(statusFilter === 'COMPLETED' ? '' : 'COMPLETED'),
          active: statusFilter === 'COMPLETED',
        },
        {
          key: 'REJECTED',
          label: '已拒绝',
          count: kanbanStats.statusDistribution.REJECTED || 0,
          color: 'red' as const,
          icon: XCircle,
          onClick: () => handleStatusFilterChange(statusFilter === 'REJECTED' ? '' : 'REJECTED'),
          active: statusFilter === 'REJECTED',
        },
      ]
    : [];

  const currentRequest = partRequests.find(
    (r) => r.id === showApproveModal || r.id === showRejectModal
  );

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
                              onClick={() => openApproveModal(request.id)}
                              isLoading={actionLoading === request.id}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              批准
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              outline
                              onClick={() => openRejectModal(request.id)}
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
                              {request.source && (
                                <div className="flex justify-between">
                                  <span className="text-slate-500">来源</span>
                                  <span>{request.source}</span>
                                </div>
                              )}
                              {request.beforeMaterial && (
                                <div className="pt-2">
                                  <span className="text-slate-500">处理前材料</span>
                                  <p className="mt-1 text-slate-700">{request.beforeMaterial}</p>
                                </div>
                              )}
                              {request.afterMaterial && (
                                <div className="pt-2">
                                  <span className="text-slate-500">处理后材料</span>
                                  <p className="mt-1 text-slate-700">{request.afterMaterial}</p>
                                </div>
                              )}
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
                                <div className="space-y-4">
                                  {histories.map((h) => (
                                    <div key={h.id} className="relative flex gap-4">
                                      <div className="relative flex flex-col items-center">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                                          <Clock className="h-4 w-4" />
                                        </div>
                                        <div className="w-0.5 flex-1 bg-slate-200" />
                                      </div>
                                      <div className="flex-1 pb-4">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-sm font-medium text-slate-900">
                                            {partRequestStatusLabels[h.oldStatus] || h.oldStatus} → {partRequestStatusLabels[h.newStatus] || h.newStatus}
                                          </span>
                                          <span className="text-xs text-slate-500">{formatDateTime(h.changedAt)}</span>
                                        </div>
                                        {h.source && (
                                          <div className="mt-2 text-sm">
                                            <span className="text-slate-500">来源：</span>
                                            <span className="text-slate-700">{h.source}</span>
                                          </div>
                                        )}
                                        {h.beforeMaterial && (
                                          <div className="mt-2 text-sm">
                                            <span className="text-slate-500">处理前材料：</span>
                                            <span className="text-slate-700">{h.beforeMaterial}</span>
                                          </div>
                                        )}
                                        {h.afterMaterial && (
                                          <div className="mt-2 text-sm">
                                            <span className="text-slate-500">处理后材料：</span>
                                            <span className="text-slate-700">{h.afterMaterial}</span>
                                          </div>
                                        )}
                                        {h.conclusion && (
                                          <div className="mt-2 text-sm">
                                            <span className="text-slate-500">结论：</span>
                                            <span className="text-slate-700">{h.conclusion}</span>
                                          </div>
                                        )}
                                        {h.handlingNotes && (
                                          <div className="mt-2 text-sm">
                                            <span className="text-slate-500">备注：</span>
                                            <span className="text-slate-700">{h.handlingNotes}</span>
                                          </div>
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

      {(showApproveModal || showRejectModal) && currentRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h3 className="text-lg font-medium text-slate-900">
                {showApproveModal ? '批准配件申请' : '拒绝配件申请'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-4">
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">申领单号</span>
                  <span className="font-medium text-slate-900">{currentRequest.requestNumber}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-slate-500">配件</span>
                  <span className="font-medium text-slate-900">
                    {currentRequest.part?.name || currentRequest.partId} × {currentRequest.quantity}
                  </span>
                </div>
              </div>

              {showApproveModal && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">来源</label>
                    <Select
                      value={formSource}
                      onChange={(e) => setFormSource(e.target.value as PartRequestSource)}
                      options={sourceOptions}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">处理前材料</label>
                    <textarea
                      value={formBeforeMaterial}
                      onChange={(e) => setFormBeforeMaterial(e.target.value)}
                      placeholder="请输入处理前材料情况"
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">处理后材料</label>
                    <textarea
                      value={formAfterMaterial}
                      onChange={(e) => setFormAfterMaterial(e.target.value)}
                      placeholder="请输入处理后材料情况"
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">结论</label>
                <textarea
                  value={formConclusion}
                  onChange={(e) => setFormConclusion(e.target.value)}
                  placeholder={showApproveModal ? '请输入审批结论' : '请输入拒绝原因'}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">备注</label>
                <textarea
                  value={formHandlingNotes}
                  onChange={(e) => setFormHandlingNotes(e.target.value)}
                  placeholder="可选备注信息"
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
              <Button variant="outline" onClick={closeModal}>
                取消
              </Button>
              {showApproveModal ? (
                <Button
                  onClick={handleApprove}
                  isLoading={actionLoading === showApproveModal}
                >
                  确认批准
                </Button>
              ) : (
                <Button
                  variant="danger"
                  onClick={handleReject}
                  isLoading={actionLoading === showRejectModal}
                >
                  确认拒绝
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
