'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  User,
  Package,
  Shield,
  FileText,
  Car,
  DollarSign,
  Camera,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils';
import { workOrderStatusLabels, workOrderStatusColors, partRequestStatusLabels } from '@/lib/auth';
import { useAuth } from '@/components/auth/AuthProvider';
import { workOrderApi } from '@/lib/api-endpoints';
import type {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderLog,
  WorkOrderLogType,
  QualityCheck,
  QualityCheckResult,
} from '@/lib/types';

const tabs = [
  { key: 'info', label: '基本信息', icon: FileText },
  { key: 'items', label: '服务项目', icon: Clock },
  { key: 'partRequests', label: '配件申请', icon: Package },
  { key: 'quality', label: '质检记录', icon: Shield },
  { key: 'logs', label: '操作日志', icon: RefreshCw },
];

const statusOptions: { value: WorkOrderStatus; label: string }[] = [
  { value: 'PENDING', label: '待处理' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'WAITING_PARTS', label: '待配件' },
  { value: 'QUALITY_CHECK', label: '质检中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
];

const logTypeMapping: Record<WorkOrderLogType, string> = {
  CREATED: 'created',
  STATUS_CHANGED: 'statusChanged',
  ASSIGNED: 'technicianAssigned',
  UPDATED: 'updated',
  PART_REQUESTED: 'partRequested',
  QUALITY_CHECK: 'qualityCheckAdded',
  COMPLETED: 'completed',
  CANCELLED: 'deleted',
};

const logTypeConfig: Record<string, { color: string; label: string }> = {
  created: { color: 'bg-green-500', label: '创建' },
  statusChanged: { color: 'bg-blue-500', label: '状态变更' },
  technicianAssigned: { color: 'bg-purple-500', label: '分派技师' },
  partRequested: { color: 'bg-amber-500', label: '配件申请' },
  qualityCheckAdded: { color: 'bg-cyan-500', label: '质检记录' },
  updated: { color: 'bg-blue-500', label: '更新' },
  completed: { color: 'bg-green-500', label: '完成' },
  deleted: { color: 'bg-red-500', label: '取消' },
};

const qcResultLabels: Record<QualityCheckResult, { label: string; className: string }> = {
  PASSED: { label: '通过', className: 'bg-green-100 text-green-800' },
  FAILED: { label: '未通过', className: 'bg-red-100 text-red-800' },
  NEEDS_REWORK: { label: '需返修', className: 'bg-amber-100 text-amber-800' },
};

export default function WorkOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, hasRole } = useAuth();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [expandedQc, setExpandedQc] = useState<string | null>(null);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [pendingAction, setPendingAction] = useState<{ type: 'status' | 'technician'; value: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workOrderApi.getById(id);
      setWorkOrder(data);
    } catch (err: any) {
      setError(err?.message || '加载工单详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchWorkOrder();
  }, [id]);

  useEffect(() => {
    if (hasRole(['MANAGER', 'ADVISOR'])) {
      workOrderApi.getTechnicians().then((techs) => {
        setTechnicians((techs as any[]).map((t: any) => ({ id: t.id, name: t.name || t.username })));
      }).catch(() => {});
    }
  }, [hasRole]);

  const handleStatusClick = (status: string) => {
    setPendingAction({ type: 'status', value: status });
    setShowStatusModal(false);
  };

  const handleTechnicianClick = (techId: string) => {
    setPendingAction({ type: 'technician', value: techId });
    setShowTechnicianModal(false);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction || !user || !workOrder) return;
    try {
      setActionLoading(true);
      if (pendingAction.type === 'status') {
        await workOrderApi.updateStatus(workOrder.id, pendingAction.value);
      } else {
        await workOrderApi.assignTechnician(workOrder.id, pendingAction.value, user.id);
      }
      setPendingAction(null);
      fetchWorkOrder();
    } catch (err: any) {
      alert(err?.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  if (error || !workOrder) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-red-500">
        <p>{error || '工单不存在'}</p>
        <Link href="/work-orders" className="mt-2 text-primary-600 hover:underline">返回列表</Link>
      </div>
    );
  }

  const vehicle = workOrder.vehicle;
  const totalItemAmount = (workOrder.items || []).reduce((sum, item) => sum + item.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/work-orders" className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-900">工单详情 - {workOrder.orderNumber}</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${workOrderStatusColors[workOrder.status] || 'bg-slate-100 text-slate-800'}`}>
                {workOrderStatusLabels[workOrder.status] || workOrder.status}
              </span>
              <span className="text-sm text-slate-500">创建于 {formatDate(workOrder.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasRole(['MANAGER', 'ADVISOR']) && (
            <>
              <Button variant="outline" onClick={() => setShowStatusModal(true)}>
                <RefreshCw className="mr-2 h-4 w-4" />改状态
              </Button>
              <Button variant="outline" onClick={() => setShowTechnicianModal(true)}>
                <User className="mr-2 h-4 w-4" />分派技师
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-600" />
                  工单基本信息
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">工单号</p>
                  <p className="mt-1 font-medium">{workOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">状态</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${workOrderStatusColors[workOrder.status] || 'bg-slate-100 text-slate-800'}`}>
                      {workOrderStatusLabels[workOrder.status] || workOrder.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">服务顾问</p>
                  <p className="mt-1 font-medium">{workOrder.advisor?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">负责技师</p>
                  <p className="mt-1 font-medium">{workOrder.technician?.name || '未分派'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">创建时间</p>
                  <p className="mt-1 font-medium">{formatDateTime(workOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">更新时间</p>
                  <p className="mt-1 font-medium">{formatDateTime(workOrder.updatedAt)}</p>
                </div>
              </div>
              {workOrder.complaint && (
                <div>
                  <p className="text-sm text-slate-500">客户诉求</p>
                  <p className="mt-1 text-slate-700">{workOrder.complaint}</p>
                </div>
              )}
              {workOrder.diagnosis && (
                <div>
                  <p className="text-sm text-slate-500">诊断描述</p>
                  <p className="mt-1 text-slate-700">{workOrder.diagnosis}</p>
                </div>
              )}
              {workOrder.remarks && (
                <div>
                  <p className="text-sm text-slate-500">备注</p>
                  <p className="mt-1 text-slate-700">{workOrder.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary-600" />
                  车辆信息
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vehicle ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">车牌号</p>
                    <p className="mt-1 font-mono font-medium">{vehicle.plateNumber}</p>
                  </div>
                  {vehicle.vin && (
                    <div>
                      <p className="text-sm text-slate-500">车辆识别码</p>
                      <p className="mt-1 font-mono text-sm">{vehicle.vin}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-500">品牌型号</p>
                    <p className="mt-1 font-medium">{vehicle.brand} {vehicle.model}</p>
                  </div>
                  {vehicle.year && (
                    <div>
                      <p className="text-sm text-slate-500">年份</p>
                      <p className="mt-1 font-medium">{vehicle.year}款</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-500">里程数</p>
                    <p className="mt-1 font-medium">{vehicle.mileage?.toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">车主</p>
                    <p className="mt-1 font-medium">{vehicle.ownerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">联系电话</p>
                    <p className="mt-1 font-medium">{vehicle.ownerPhone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">暂无车辆信息</p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary-600" />
                  费用信息
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-sm text-slate-500">报价金额</p>
                  <p className="mt-1 text-lg font-medium">{formatCurrency(workOrder.quoteAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">实际金额</p>
                  <p className="mt-1 text-lg font-medium">{formatCurrency(workOrder.actualAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">进厂里程</p>
                  <p className="mt-1 font-medium">{workOrder.mileageIn ? `${workOrder.mileageIn.toLocaleString()} km` : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">出厂里程</p>
                  <p className="mt-1 font-medium">{workOrder.mileageOut ? `${workOrder.mileageOut.toLocaleString()} km` : '-'}</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-primary-50 p-4">
                <p className="text-sm text-primary-700">项目合计</p>
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(totalItemAmount)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'items' && (
        <Card>
          <CardHeader>
            <CardTitle>服务项目 / 工时</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">项目名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">工时</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">工时费</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">配件费</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">合计</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(!workOrder.items || workOrder.items.length === 0) ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">暂无服务项目</td></tr>
                  ) : workOrder.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{item.itemName}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{item.itemType}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{item.laborHours} 小时</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{formatCurrency(item.laborAmount)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{formatCurrency(item.partAmount)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-primary-600">{formatCurrency(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'partRequests' && (
        <Card>
          <CardHeader>
            <CardTitle>配件申请记录</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">申请单号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">配件名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">数量</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">申请时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(!workOrder.partRequests || workOrder.partRequests.length === 0) ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">暂无配件申请</td></tr>
                  ) : workOrder.partRequests.map((pr) => (
                    <tr key={pr.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{pr.requestNumber}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{pr.part?.name || pr.partId}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{pr.quantity} {pr.part?.unit || '件'}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-800">
                          {partRequestStatusLabels[pr.status] || pr.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{formatDateTime(pr.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'quality' && (
        <div className="space-y-4">
          {(!workOrder.qualityChecks || workOrder.qualityChecks.length === 0) ? (
            <Card>
              <CardContent>
                <p className="py-8 text-center text-sm text-slate-500">暂无质检记录</p>
              </CardContent>
            </Card>
          ) : workOrder.qualityChecks.map((qc) => {
            const isExpanded = expandedQc === qc.id;
            const resultInfo = qcResultLabels[qc.result] || qcResultLabels.PASSED;
            return (
              <Card key={qc.id}>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>质检记录</CardTitle>
                        <p className="text-sm text-slate-500">
                          {formatDateTime(qc.checkDate)} · 质检员：{qc.inspector?.name || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${resultInfo.className}`}>
                        {resultInfo.label}
                      </span>
                      {qc.photos && qc.photos.length > 0 && (
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <Camera className="h-4 w-4" />
                          {qc.photos.length}张照片
                        </span>
                      )}
                      <button
                        onClick={() => setExpandedQc(isExpanded ? null : qc.id)}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="space-y-4 border-t border-slate-100">
                    {qc.remarks && (
                      <div>
                        <h4 className="font-medium text-slate-900">质检备注</h4>
                        <p className="mt-1 text-slate-600">{qc.remarks}</p>
                      </div>
                    )}
                    {qc.photos && qc.photos.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-900">质检照片</h4>
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                          {qc.photos.map((photo, idx) => (
                            <div key={idx} className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                              <img src={photo} alt={`质检照片 ${idx + 1}`} className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle>操作日志</CardTitle>
          </CardHeader>
          <CardContent>
            {(!workOrder.logs || workOrder.logs.length === 0) ? (
              <p className="py-8 text-center text-sm text-slate-500">暂无操作日志</p>
            ) : (
              <div className="space-y-1">
                {workOrder.logs.map((log, index) => {
                  const mappedType = logTypeMapping[log.type] || 'updated';
                  const config = logTypeConfig[mappedType] || logTypeConfig.updated;
                  const isLast = index === workOrder.logs!.length - 1;

                  return (
                    <div key={log.id} className="relative flex gap-4">
                      <div className="relative flex flex-col items-center">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm ${config.color}`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        {!isLast && <div className="w-0.5 flex-1 bg-slate-200" />}
                      </div>
                      <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-6'}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-900">{log.content}</span>
                          <span className="text-xs text-slate-500">{formatDateTime(log.timestamp)}</span>
                        </div>
                        {log.operator && (
                          <p className="mt-0.5 text-sm text-slate-500">操作人：{log.operator.name}</p>
                        )}
                        {(log.oldValue || log.newValue) && (
                          <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">
                            {log.oldValue && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">变更前：</span>
                                <span className="text-slate-700">{log.oldValue}</span>
                              </div>
                            )}
                            {log.newValue && (
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-slate-500">变更后：</span>
                                <span className="font-medium text-slate-900">{log.newValue}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="更新工单状态" size="sm">
        <div className="space-y-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusClick(option.value)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left transition-colors hover:bg-slate-50"
            >
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${workOrderStatusColors[option.value] || 'bg-slate-100 text-slate-800'}`}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal isOpen={showTechnicianModal} onClose={() => setShowTechnicianModal(false)} title="分派技师" size="sm">
        <div className="space-y-2">
          {technicians.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">暂无可用技师</p>
          ) : technicians.map((tech) => (
            <button
              key={tech.id}
              onClick={() => handleTechnicianClick(tech.id)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <User className="h-5 w-5" />
              </div>
              <span className="font-medium">{tech.name}</span>
            </button>
          ))}
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
        title={pendingAction?.type === 'status' ? '确认更改状态' : '确认分派技师'}
        message={
          pendingAction?.type === 'status'
            ? `确定要将工单状态更改为"${workOrderStatusLabels[pendingAction.value]}"吗？`
            : `确定要将工单分派给"${technicians.find((t) => t.id === pendingAction?.value)?.name}"吗？`
        }
        type="warning"
        isLoading={actionLoading}
      />
    </div>
  );
}
