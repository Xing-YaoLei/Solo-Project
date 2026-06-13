// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  User,
  MapPin,
  Phone,
  Tag,
  FileText,
  Upload,
  Trash2,
  Download,
  MessageSquare,
  RotateCcw,
  FileEdit,
  CheckCircle,
  Unlock,
  UserPlus,
  Send,
  AlertTriangle,
  Flag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Timeline } from '@/components/orders/Timeline';
import { apiEndpoints } from '@/lib/api';
import {
  statusConfig,
  responsibilityConfig,
  formatCurrency,
  formatDate,
  formatDuration,
  getDeadlineStatus,
  cn,
  roleConfig,
} from '@/lib/utils';
import { RefundStatus, RefundOrder, RefundEvidence, TimelineAction } from '@solo/shared';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<RefundOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'detail' | 'evidence' | 'timeline'>('detail');
  const [showActionModal, setShowActionModal] = useState<string | null>(null);
  const [actionData, setActionData] = useState<any>({});
  const [operators, setOperators] = useState<any[]>([]);
  const [visitResults, setVisitResults] = useState<any[]>([]);
  const [problemTags, setProblemTags] = useState<any[]>([]);

  const orderId = params.id as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orderRes, opsRes, configRes] = await Promise.all([
          apiEndpoints.refundOrders.get(orderId),
          apiEndpoints.users.operators(),
          apiEndpoints.config.getAll(),
        ]);
        setOrder(orderRes as RefundOrder);
        setOperators(opsRes as any[]);
        setVisitResults(configRes.visitResults as any[]);
        setProblemTags(configRes.problemTags as any[]);
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  const refreshOrder = async () => {
    const res: any = await apiEndpoints.refundOrders.get(orderId);
    setOrder(res);
  };

  const handleAction = async (actionType: string) => {
    try {
      switch (actionType) {
        case 'assign':
          await apiEndpoints.refundOrders.assign(orderId, actionData);
          break;
        case 'status':
          await apiEndpoints.refundOrders.updateStatus(orderId, actionData);
          break;
        case 'note':
          await apiEndpoints.refundOrders.addNote(orderId, actionData);
          break;
        case 'retry':
          await apiEndpoints.refundOrders.retry(orderId, actionData);
          break;
        case 'supplement':
          await apiEndpoints.refundOrders.supplement(orderId, actionData);
          break;
        case 'close':
          await apiEndpoints.refundOrders.close(orderId, actionData);
          break;
        case 'reopen':
          await apiEndpoints.refundOrders.reopen(orderId, actionData);
          break;
      }
      setShowActionModal(null);
      setActionData({});
      refreshOrder();
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (confirm('确定要删除该附件吗？')) {
      await apiEndpoints.refundOrders.deleteEvidence(orderId, evidenceId);
      refreshOrder();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">售后单不存在</p>
        <Link href="/orders">
          <Button className="mt-4">返回列表</Button>
        </Link>
      </div>
    );
  }

  const status = statusConfig[order.status];
  const resp = order.responsibility ? responsibilityConfig[order.responsibility] : null;
  const deadlineStatus = getDeadlineStatus(order.deadline, order.isTimeout);
  const isClosed = order.status === RefundStatus.CLOSED;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{order.orderNo}</h1>
              <Badge className={status.bgColor} size="md">
                {status.label}
              </Badge>
              {order.isUrgent && (
                <Badge variant="danger" size="md">
                  <Flag className="h-3 w-3 mr-1" />
                  紧急
                </Badge>
              )}
              {order.isTimeout && (
                <Badge variant="danger" size="md">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  超时{order.timeoutCount}次
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              创建于 {formatDate(order.createdAt)}
              {order.createdBy && ` · 由 ${order.createdBy.name} 创建`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isClosed && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowActionModal('assign')}>
                <UserPlus className="mr-1 h-4 w-4" />
                分派
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowActionModal('status')}>
                <RotateCcw className="mr-1 h-4 w-4" />
                状态
              </Button>
              <Button variant="warning" size="sm" onClick={() => setShowActionModal('retry')}>
                <RotateCcw className="mr-1 h-4 w-4" />
                重试
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowActionModal('supplement')}>
                <FileEdit className="mr-1 h-4 w-4" />
                补录
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowActionModal('close')}>
                <CheckCircle className="mr-1 h-4 w-4" />
                关闭
              </Button>
            </>
          )}
          {isClosed && (
            <Button variant="secondary" size="sm" onClick={() => setShowActionModal('reopen')}>
              <Unlock className="mr-1 h-4 w-4" />
              重新打开
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowActionModal('note')}>
            <MessageSquare className="mr-1 h-4 w-4" />
            备注
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <div className="flex border-b border-gray-200">
            {[
              { key: 'detail', label: '详情', icon: FileText },
              { key: 'evidence', label: '凭证附件', icon: Upload },
              { key: 'timeline', label: '处理时间线', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={cn(
                    'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.key === 'evidence' && (
                    <Badge variant="secondary">{order.evidences?.length || 0}</Badge>
                  )}
                </button>
              );
            })}
          </div>

          <CardContent className="pt-6">
            {activeTab === 'detail' && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">客户信息</h3>
                  <div className="space-y-3">
                    <InfoRow icon={User} label="客户姓名" value={order.customerName} />
                    <InfoRow icon={Phone} label="联系电话" value={order.customerPhone} />
                    <InfoRow icon={MapPin} label="所在区域" value={`${order.region} · ${order.community}`} />
                    {order.groupLeader && (
                      <InfoRow icon={User} label="团长" value={order.groupLeader} />
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">商品信息</h3>
                  <div className="space-y-3">
                    <InfoRow icon={Tag} label="商品名称" value={order.productName} />
                    {order.productSku && (
                      <InfoRow icon={Tag} label="SKU" value={order.productSku} />
                    )}
                    <InfoRow icon={Tag} label="数量" value={`${order.quantity} 件`} />
                    <InfoRow icon={Tag} label="单价" value={formatCurrency(order.unitPrice)} />
                    <InfoRow icon={Tag} label="申请退款" value={formatCurrency(order.refundAmount)} highlight />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <h3 className="font-medium text-gray-900 mb-4">售后原因</h3>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-gray-700">{order.reason}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">问题标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {order.problemTags?.map((tag) => {
                      const tagConfig = problemTags.find((t) => t.name === tag);
                      return (
                        <Badge
                          key={tag}
                          size="md"
                          style={{ backgroundColor: tagConfig?.color + '20', color: tagConfig?.color }}
                        >
                          {tag}
                          {tagConfig && ` (${tagConfig.thresholdDays}天)`}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">处理信息</h3>
                  <div className="space-y-3">
                    <InfoRow
                      icon={User}
                      label="处理人"
                      value={order.assignee?.name || '待分配'}
                      subValue={order.assignee?.role ? roleConfig[order.assignee.role].label : ''}
                    />
                    {resp && (
                      <div className="flex items-center gap-2">
                        <div className={cn('h-2 w-2 rounded-full', resp.color)} />
                        <span className="text-sm text-gray-500">责任归属：</span>
                        <span className="text-sm font-medium text-gray-700">{resp.label}</span>
                      </div>
                    )}
                    {order.visitResult && (
                      <InfoRow
                        icon={CheckCircle}
                        label="回访结果"
                        value={visitResults.find((v) => v.code === order.visitResult)?.name || order.visitResult}
                      />
                    )}
                    <InfoRow
                      icon={Clock}
                      label="处理时限"
                      value={formatDate(order.deadline)}
                      subValue={deadlineStatus.label}
                      subClassName={deadlineStatus.color}
                    />
                    {order.handlingDurationMinutes && (
                      <InfoRow
                        icon={Clock}
                        label="处理时长"
                        value={formatDuration(order.handlingDurationMinutes)}
                      />
                    )}
                    {order.actualClosedAt && (
                      <InfoRow
                        icon={CheckCircle}
                        label="关闭时间"
                        value={formatDate(order.actualClosedAt)}
                      />
                    )}
                  </div>
                </div>
                {order.note && (
                  <div className="md:col-span-2">
                    <h3 className="font-medium text-gray-900 mb-4">备注</h3>
                    <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                      <p className="text-gray-700">{order.note}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'evidence' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">凭证附件</h3>
                  {!isClosed && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const fileUrl = prompt('请输入文件URL（模拟）');
                        const fileName = prompt('请输入文件名');
                        if (fileUrl && fileName) {
                          apiEndpoints.refundOrders.addEvidence(orderId, {
                            fileName,
                            fileUrl,
                            fileType: 'image/jpeg',
                            fileSize: 102400,
                          }).then(refreshOrder);
                        }
                      }}
                    >
                      <Upload className="mr-1 h-4 w-4" />
                      上传凭证
                    </Button>
                  )}
                </div>
                {order.evidences?.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无凭证附件</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {order.evidences?.map((ev: any) => (
                      <div
                        key={ev.id}
                        className="rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <span className="font-medium text-gray-700 truncate max-w-[180px]">
                              {ev.fileName}
                            </span>
                          </div>
                          {!isClosed && (
                            <button
                              onClick={() => handleDeleteEvidence(ev.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 space-y-1">
                          <div>大小：{(ev.fileSize / 1024).toFixed(1)} KB</div>
                          <div>上传：{ev.uploadedBy?.name}</div>
                          <div>{formatDate(ev.createdAt)}</div>
                        </div>
                        {ev.note && (
                          <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            {ev.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'timeline' && (
              <Timeline timelines={order.timelines || []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="secondary" onClick={() => setShowActionModal('note')}>
              <MessageSquare className="mr-2 h-4 w-4" />
              添加备注
            </Button>
            {!isClosed && (
              <>
                <Button className="w-full" variant="outline" onClick={() => setShowActionModal('assign')}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  分派处理人
                </Button>
                <Button className="w-full" variant="outline" onClick={() => setShowActionModal('retry')}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  申请重试
                </Button>
                <Button className="w-full" variant="outline" onClick={() => setShowActionModal('supplement')}>
                  <FileEdit className="mr-2 h-4 w-4" />
                  要求补录
                </Button>
                <Button className="w-full" variant="primary" onClick={() => setShowActionModal('close')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  关闭售后
                </Button>
              </>
            )}
          </CardContent>

          {order.reminders && order.reminders.length > 0 && (
            <>
              <CardHeader className="pt-0">
                <CardTitle>提醒记录</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {order.reminders.slice(0, 5).map((reminder: any) => (
                  <div key={reminder.id} className="text-xs p-2 bg-gray-50 rounded">
                    <div className="flex justify-between text-gray-500 mb-1">
                      <span>发送给：{reminder.recipient?.name}</span>
                      <span>{formatDate(reminder.sentAt, 'MM-DD HH:mm')}</span>
                    </div>
                    <p className="text-gray-700 line-clamp-2">{reminder.message}</p>
                  </div>
                ))}
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {showActionModal && (
        <ActionModal
          actionType={showActionModal}
          data={actionData}
          operators={operators}
          visitResults={visitResults}
          onDataChange={setActionData}
          onSubmit={() => handleAction(showActionModal)}
          onCancel={() => {
            setShowActionModal(null);
            setActionData({});
          }}
        />
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, subValue, highlight, subClassName }: any) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <span className="text-sm text-gray-500">{label}</span>
        <p className={cn('text-sm', highlight ? 'font-semibold text-primary-600' : 'text-gray-700')}>
          {value || '-'}
        </p>
        {subValue && (
          <p className={cn('text-xs', subClassName || 'text-gray-400')}>{subValue}</p>
        )}
      </div>
    </div>
  );
}

function ActionModal({ actionType, data, operators, visitResults, onDataChange, onSubmit, onCancel }: any) {
  const titleMap: Record<string, string> = {
    assign: '分派处理人',
    status: '更新状态',
    note: '添加备注',
    retry: '申请重试',
    supplement: '要求补录',
    close: '关闭售后',
    reopen: '重新打开',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">{titleMap[actionType]}</h3>

        <div className="space-y-4">
          {actionType === 'assign' && (
            <Select
              label="选择处理人"
              value={data.assigneeId || ''}
              onChange={(e) => onDataChange({ ...data, assigneeId: e.target.value })}
              options={operators.map((o: any) => ({
                value: o.id,
                label: `${o.name} (${o.region || '-'})`,
              }))}
            />
          )}

          {actionType === 'status' && (
            <Select
              label="选择状态"
              value={data.status || ''}
              onChange={(e) => onDataChange({ ...data, status: e.target.value })}
              options={Object.entries(statusConfig).map(([value, cfg]) => ({
                value,
                label: cfg.label,
              }))}
            />
          )}

          {(actionType === 'retry' || actionType === 'supplement') && (
            <>
              <Textarea
                label="原因说明"
                value={data.reason || ''}
                onChange={(e) => onDataChange({ ...data, reason: e.target.value })}
                rows={3}
              />
              {actionType === 'supplement' && (
                <Textarea
                  label="需要补充的信息"
                  value={data.requiredInfo || ''}
                  onChange={(e) => onDataChange({ ...data, requiredInfo: e.target.value })}
                  rows={3}
                />
              )}
              <Input
                type="date"
                label="新的处理时限（可选）"
                value={data.newDeadline || ''}
                onChange={(e) => onDataChange({ ...data, newDeadline: e.target.value })}
              />
            </>
          )}

          {actionType === 'close' && (
            <>
              <Textarea
                label="处理结果"
                value={data.result || ''}
                onChange={(e) => onDataChange({ ...data, result: e.target.value })}
                rows={3}
                placeholder="请描述最终处理结果..."
              />
              <Select
                label="回访结果"
                value={data.visitResult || ''}
                onChange={(e) => onDataChange({ ...data, visitResult: e.target.value })}
                options={visitResults.map((v: any) => ({ value: v.code, label: v.name }))}
              />
              <Input
                type="number"
                label="最终退款金额（可选）"
                value={data.finalAmount || ''}
                onChange={(e) => onDataChange({ ...data, finalAmount: Number(e.target.value) })}
                prefix="¥"
              />
            </>
          )}

          {actionType === 'reopen' && (
            <Textarea
              label="重新打开原因"
              value={data.reason || ''}
              onChange={(e) => onDataChange({ reason: e.target.value })}
              rows={3}
            />
          )}

          {(actionType === 'note' || actionType === 'assign' || actionType === 'status') && (
            <Textarea
              label="备注（可选）"
              value={data.note || ''}
              onChange={(e) => onDataChange({ ...data, note: e.target.value })}
              rows={2}
            />
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={onCancel}>取消</Button>
          <Button variant="primary" onClick={onSubmit}>确认</Button>
        </div>
      </div>
    </div>
  );
}
