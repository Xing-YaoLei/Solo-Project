import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { ArrowLeft, Package, User, Clock, AlertTriangle, Plus, RefreshCw, XCircle, Send, MessageSquare, CheckCircle } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { api } from '@/services/api';
import type { ShortageOrder, ShortageActionLog, MaterialBatch } from '@/types';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/shortage/$id')({
  component: ShortageDetailPage,
});

function ShortageDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [shortage, setShortage] = useState<ShortageOrder | null>(null);
  const [logs, setLogs] = useState<ShortageActionLog[]>([]);
  const [batch, setBatch] = useState<MaterialBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'supplement' | 'retry' | 'close'>('supplement');
  const [actionRemark, setActionRemark] = useState('');
  const [supplementQuantity, setSupplementQuantity] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shortageData, logsData] = await Promise.all([
        api.getShortageById(id),
        api.getShortageLogs(id),
      ]);
      setShortage(shortageData);
      setLogs(logsData);
      
      if (shortageData.batchId) {
        const batchData = await api.getBatchById(shortageData.batchId);
        setBatch(batchData);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!shortage) return;
    setProcessing(true);
    try {
      await api.handleShortage(id, actionType, {
        remark: actionRemark,
        supplementQuantity: actionType === 'supplement' ? supplementQuantity : undefined,
      });
      setShowActionModal(false);
      setActionRemark('');
      setSupplementQuantity(0);
      fetchData();
    } finally {
      setProcessing(false);
    }
  };

  const openActionModal = (type: 'supplement' | 'retry' | 'close') => {
    setActionType(type);
    setShowActionModal(true);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'assign': return <User className="w-4 h-4 text-blue-500" />;
      case 'supplement': return <Plus className="w-4 h-4 text-green-500" />;
      case 'retry': return <RefreshCw className="w-4 h-4 text-orange-500" />;
      case 'close': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return '创建工单';
      case 'assign': return '分派任务';
      case 'supplement': return '补录完成';
      case 'retry': return '重试处理';
      case 'close': return '关闭工单';
      default: return '操作';
    }
  };

  const canPerformAction = (action: string) => {
    if (!shortage) return false;
    if (shortage.status === 'closed') return false;
    
    switch (action) {
      case 'supplement':
        return shortage.status === 'pending' || shortage.status === 'processing';
      case 'retry':
        return shortage.status === 'pending' || shortage.status === 'processing';
      case 'close':
        return shortage.status === 'supplemented' || shortage.status === 'retried' || shortage.status === 'processing';
      default:
        return true;
    }
  };

  if (loading || !shortage) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-100 rounded animate-pulse w-48" />
        <div className="card h-48 animate-pulse" />
        <div className="card h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/shortage' })}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">短缺工单详情</h1>
          <p className="text-gray-500 mt-1">
            <span className="font-mono text-primary-600">{shortage.batchNo}</span>
            <span className="mx-2">·</span>
            {shortage.materialName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={shortage.status} />
                <PriorityBadge priority={shortage.priority} />
                {batch && (
                  <Link
                    to="/inventory/$batchId"
                    params={{ batchId: batch.id }}
                    className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Package className="w-4 h-4" />
                    查看批次详情
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-500">材料名称</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">{shortage.materialName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">短缺数量</label>
                <p className="text-lg font-semibold text-red-600 mt-1">
                  {shortage.shortageQuantity} {batch?.unit || '单位'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">负责人</label>
                <p className="text-base font-medium text-gray-900 mt-1 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {shortage.responsiblePerson}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">截止日期</label>
                <p className="text-base font-medium text-gray-900 mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {shortage.dueDate}
                </p>
              </div>
            </div>

            {shortage.status !== 'closed' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-4">处理操作</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => openActionModal('supplement')}
                    disabled={!canPerformAction('supplement')}
                    className={cn(
                      'btn-primary',
                      !canPerformAction('supplement') && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    补录完成
                  </button>
                  <button
                    onClick={() => openActionModal('retry')}
                    disabled={!canPerformAction('retry')}
                    className={cn(
                      'btn-secondary',
                      !canPerformAction('retry') && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重试处理
                  </button>
                  <button
                    onClick={() => openActionModal('close')}
                    disabled={!canPerformAction('close')}
                    className={cn(
                      'px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium',
                      !canPerformAction('close') && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <XCircle className="w-4 h-4 mr-2 inline" />
                    关闭工单
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">处理记录</h3>
                <p className="text-sm text-gray-500 mt-1">完整的操作回溯记录</p>
              </div>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                {logs.length} 条记录
              </span>
            </div>

            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-6">
                {logs.map((log, index) => (
                  <div
                    key={log.id}
                    className="relative pl-12"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="absolute left-0 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {getActionLabel(log.action)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(log.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{log.remark}</p>
                      {log.supplementQuantity && (
                        <p className="text-sm text-green-600 mt-2 font-medium">
                          补录数量: {log.supplementQuantity} {batch?.unit || '单位'}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        操作人: {log.operator}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">处理进度</h3>
            <div className="space-y-4">
              {[
                { key: 'create', label: '创建工单', icon: AlertTriangle, color: 'red' },
                { key: 'assign', label: '分派任务', icon: User, color: 'blue' },
                { key: 'processing', label: '处理中', icon: RefreshCw, color: 'orange' },
                { key: 'supplement', label: '补录完成', icon: Plus, color: 'green' },
                { key: 'close', label: '工单关闭', icon: CheckCircle, color: 'gray' },
              ].map((step, index) => {
                const isCompleted = logs.some(l => l.action === step.key) || 
                  (step.key === 'processing' && (shortage.status === 'processing' || shortage.status === 'supplemented' || shortage.status === 'retried' || shortage.status === 'closed')) ||
                  (step.key === 'supplement' && (shortage.status === 'supplemented' || shortage.status === 'closed')) ||
                  (step.key === 'close' && shortage.status === 'closed');
                const isCurrent = !isCompleted && (
                  (step.key === 'processing' && (shortage.status === 'pending')) ||
                  (step.key === 'supplement' && (shortage.status === 'processing')) ||
                  (step.key === 'close' && (shortage.status === 'supplemented' || shortage.status === 'retried'))
                );

                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                      isCompleted 
                        ? `bg-${step.color}-500 border-${step.color}-500 text-white` 
                        : isCurrent
                          ? `border-${step.color}-500 text-${step.color}-500 animate-pulse`
                          : 'bg-gray-100 border-gray-200 text-gray-400'
                    )}>
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <step.icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        'text-sm font-medium',
                        isCompleted ? 'text-gray-900' : isCurrent ? `text-${step.color}-600` : 'text-gray-400'
                      )}>
                        {step.label}
                      </p>
                    </div>
                    {isCompleted && (
                      <span className="text-xs text-green-600 font-medium">已完成</span>
                    )}
                    {isCurrent && (
                      <span className="text-xs text-orange-600 font-medium animate-pulse">进行中</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {batch && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">关联批次信息</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">批次号</span>
                  <span className="text-sm font-mono text-primary-600">{batch.batchNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">材料规格</span>
                  <span className="text-sm text-gray-900">{batch.specification}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">总数量</span>
                  <span className="text-sm text-gray-900">{batch.quantity} {batch.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">供应商</span>
                  <span className="text-sm text-gray-900">{batch.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">入库日期</span>
                  <span className="text-sm text-gray-900">{batch.inDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">预计周转</span>
                  <span className="text-sm text-gray-900">{batch.expectedTurnoverDays} 天</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fade-in-up">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {actionType === 'supplement' && '补录完成'}
                {actionType === 'retry' && '重试处理'}
                {actionType === 'close' && '关闭工单'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {actionType === 'supplement' && '填写补录数量和备注信息'}
                {actionType === 'retry' && '说明重试处理的原因和措施'}
                {actionType === 'close' && '确认关闭此短缺工单'}
              </p>
            </div>
            <div className="p-6 space-y-4">
              {actionType === 'supplement' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    补录数量 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={shortage.shortageQuantity}
                    value={supplementQuantity}
                    onChange={(e) => setSupplementQuantity(Number(e.target.value))}
                    placeholder={`最大可补录 ${shortage.shortageQuantity}`}
                    className="input"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注说明 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={actionRemark}
                  onChange={(e) => setActionRemark(e.target.value)}
                  placeholder={
                    actionType === 'supplement' 
                      ? '请说明补录来源（如供应商补货、区域调拨等）'
                      : actionType === 'retry'
                        ? '请说明重试的处理方案'
                        : '请说明关闭原因'
                  }
                  rows={4}
                  className="input resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowActionModal(false)}
                className="btn-secondary"
                disabled={processing}
              >
                取消
              </button>
              <button
                onClick={handleAction}
                disabled={processing || !actionRemark || (actionType === 'supplement' && supplementQuantity <= 0)}
                className={cn(
                  'btn-primary',
                  (processing || !actionRemark || (actionType === 'supplement' && supplementQuantity <= 0)) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {processing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
