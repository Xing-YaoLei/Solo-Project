import { useState, useEffect } from 'react';
import { useRouter, useParams, Link } from '@tanstack/react-router';
import { usePrescriptionStore } from '@/stores/prescriptionStore';
import { StatusBadge, PageHeader, Card } from '@/components/UI';
import { Timeline } from '@/components/Timeline';
import {
  ArrowLeft,
  AlertTriangle,
  FileText,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Edit3,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineEvent } from '@/types';
import { users } from '@/mock/data';

export function ExceptionDetail() {
  const router = useRouter();
  const { id } = useParams({ strict: false }) as { id: string };
  const {
    exceptions,
    prescriptions,
    updateException,
    refreshException,
  } = usePrescriptionStore();

  const exception = exceptions.find((e) => e.id === id);
  const prescription = exception
    ? prescriptions.find((p) => p.id === exception.prescription_id)
    : undefined;

  const [resolution, setResolution] = useState('');
  const [impactScope, setImpactScope] = useState('');
  const [exceptionAssignee, setExceptionAssignee] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const pharmacistUsers = users.filter((u) => u.role === 'pharmacist');

  const EXCEPTION_TYPES: Record<string, string> = {
    rx_unclear: '处方信息不清',
    batch_issue: '批次效期异常',
    member_issue: '会员信息异常',
    insurance_issue: '医保结算异常',
    replenishment_issue: '补货流程异常',
    other: '其他异常',
  };

  const SEVERITY_OPTIONS = [
    { value: 'low', label: '低', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    { value: 'medium', label: '中', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { value: 'high', label: '高', color: 'bg-orange-50 text-orange-600 border-orange-200' },
    { value: 'critical', label: '紧急', color: 'bg-red-50 text-red-600 border-red-200' },
  ];

  const STATUS_OPTIONS = [
    { value: 'open', label: '待处理', color: 'bg-slate-100 text-slate-600' },
    { value: 'processing', label: '处理中', color: 'bg-blue-50 text-blue-600' },
    { value: 'resolved', label: '已解决', color: 'bg-green-50 text-green-600' },
    { value: 'closed', label: '已关闭', color: 'bg-slate-100 text-slate-400' },
  ];

  useEffect(() => {
    if (id && id.startsWith('exc-')) {
      refreshException(id);
    }
  }, [id, refreshException]);

  useEffect(() => {
    if (exception) {
      setResolution(exception.resolution || '');
      setImpactScope(exception.impact_scope);
      setExceptionAssignee(exception.assignee_id || '');
      setSeverity(exception.severity as any);
    }
  }, [exception]);

  if (!exception) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-slate-300 mb-3" />
        <p className="text-sm text-slate-500">未找到该异常记录</p>
        <button
          onClick={() => router.navigate({ to: '/exceptions' })}
          className="mt-4 text-xs text-blue-600 hover:underline"
        >
          返回异常列表
        </button>
      </div>
    );
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const assigneeUser = exception.assignee_id
    ? users.find((u) => u.id === exception.assignee_id)
    : null;

  const handleSaveChanges = async () => {
    setSubmitting(true);
    const updateData: any = {};
    if (resolution !== (exception.resolution || '')) updateData.resolution = resolution.trim();
    if (impactScope !== exception.impact_scope) updateData.impact_scope = impactScope.trim();
    if (exceptionAssignee !== (exception.assignee_id || '')) updateData.assignee_id = exceptionAssignee;
    if (severity !== exception.severity) updateData.severity = severity;

    if (Object.keys(updateData).length > 0) {
      await updateException(id, updateData);
    }
    setSubmitting(false);
    setEditMode(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    setSubmitting(true);
    await updateException(id, {
      status: newStatus as any,
      ...(newStatus === 'resolved' && resolution.trim() ? { resolution: resolution.trim() } : {}),
    });
    setSubmitting(false);
  };

  const timelineEvents: TimelineEvent[] = [
    {
      id: 'tl-1',
      timestamp: exception.created_at,
      action: '创建异常',
      actor: '系统',
      detail: `异常类型：${EXCEPTION_TYPES[exception.exception_type] || exception.exception_type}；原因：${exception.reason}；影响范围：${exception.impact_scope}${assigneeUser ? `；指派给：${assigneeUser.username}` : ''}`,
      status: 'exception',
    },
    ...(exception.status !== 'open'
      ? [
          {
            id: 'tl-2',
            timestamp: exception.created_at,
            action: '开始处理',
            actor: assigneeUser?.username || '处理人',
            detail: `${assigneeUser?.username || '处理人'} 已受理该异常，正在跟进处理`,
            status: 'in_review' as const,
          },
        ]
      : []),
    ...(exception.resolved_at
      ? [
          {
            id: 'tl-3',
            timestamp: exception.resolved_at,
            action: '处理完成',
            actor: assigneeUser?.username || '处理人',
            detail: exception.resolution || '异常已解决',
            status: 'approved' as const,
          },
        ]
      : []),
    ...(exception.status === 'closed'
      ? [
          {
            id: 'tl-4',
            timestamp: exception.resolved_at || exception.updated_at,
            action: '关闭异常',
            actor: '系统',
            detail: '异常已关闭，无需进一步处理',
            status: 'approved' as const,
          },
        ]
      : []),
    ...(prescription?.timeline || [])
      .filter((e) => e.action.startsWith('异常更新'))
      .map((e, idx) => ({
        ...e,
        id: `tl-update-${idx}`,
      })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const isActive = exception.status === 'open' || exception.status === 'processing';

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.navigate({ to: '/exceptions' })}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          返回异常列表
        </button>
      </div>

      <PageHeader
        title={exception.exception_no}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={exception.status} size="md" />
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${
                SEVERITY_OPTIONS.find((s) => s.value === exception.severity)?.color || 'bg-slate-100 text-slate-600'
              }`}
            >
              {SEVERITY_OPTIONS.find((s) => s.value === exception.severity)?.label || exception.severity}
            </div>
          </div>
        }
      />

      <Card title="异常信息" className="mb-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">异常编号</p>
              <p className="text-sm font-medium text-slate-700">{exception.exception_no}</p>
            </div>
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">当前状态</p>
              {editMode ? (
                <select
                  value={exception.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={submitting}
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <StatusBadge status={exception.status} size="md" />
              )}
            </div>
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">异常类型</p>
              <p className="text-sm text-slate-700">
                {EXCEPTION_TYPES[exception.exception_type] || exception.exception_type}
              </p>
            </div>
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">严重程度</p>
              {editMode ? (
                <div className="flex gap-1.5">
                  {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSeverity(opt.value as any)}
                      className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                        severity === opt.value
                          ? opt.color + ' border-current font-semibold'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${
                    SEVERITY_OPTIONS.find((s) => s.value === exception.severity)?.color || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {SEVERITY_OPTIONS.find((s) => s.value === exception.severity)?.label || exception.severity}
                </div>
              )}
            </div>
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">关联处方</p>
              {prescription ? (
                <Link
                  to="/prescription/$id"
                  params={{ id: prescription.id }}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                >
                  {prescription.prescription_no}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              ) : (
                <p className="text-sm text-slate-500">{exception.prescription_no}</p>
              )}
            </div>
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">处理人</p>
              {editMode ? (
                <select
                  value={exceptionAssignee}
                  onChange={(e) => setExceptionAssignee(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white"
                >
                  <option value="">请选择药师</option>
                  {pharmacistUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} - {u.store_name || '总部'}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-sm text-slate-700">
                    {assigneeUser?.username || exception.assignee_name || '未分配'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-2xs text-slate-400 mb-1">异常原因</p>
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed">{exception.reason}</p>
            </div>
          </div>

          <div>
            <p className="text-2xs text-slate-400 mb-1">影响范围</p>
            {editMode ? (
              <input
                type="text"
                value={impactScope}
                onChange={(e) => setImpactScope(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            ) : (
              <p className="text-sm text-slate-700">{exception.impact_scope}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-2xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              创建时间：{formatDate(exception.created_at)}
            </span>
            {exception.resolved_at && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                解决时间：{formatDate(exception.resolved_at)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          {isActive && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              编辑
            </button>
          )}
          {editMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode(false)}
                disabled={submitting}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存修改'
                )}
              </button>
            </div>
          )}
          {!editMode && (
            <div className="flex items-center gap-2 ml-auto">
              {isActive && (
                <button
                  onClick={() => handleStatusChange('processing')}
                  disabled={submitting || exception.status === 'processing'}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    exception.status === 'processing'
                      ? 'bg-blue-100 text-blue-600 cursor-default'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100',
                  )}
                >
                  开始处理
                </button>
              )}
              {isActive && (
                <button
                  onClick={() => handleStatusChange('resolved')}
                  disabled={submitting || !resolution.trim()}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    resolution.trim()
                      ? 'bg-mint-500 text-white hover:bg-mint-600'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  处理完成
                </button>
              )}
              {exception.status === 'resolved' && (
                <button
                  onClick={() => handleStatusChange('closed')}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  关闭异常
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {prescription && (
        <Card title="关联处方摘要" className="mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">处方编号</p>
              <Link
                to="/prescription/$id"
                params={{ id: prescription.id }}
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
              >
                {prescription.prescription_no}
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">处方状态</p>
              <StatusBadge status={prescription.status} />
            </div>
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">门店</p>
              <p className="text-sm text-slate-700">{prescription.store_name}</p>
            </div>
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">患者</p>
              <p className="text-sm text-slate-700">{prescription.patient_name}</p>
            </div>
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">处方类型</p>
              <p className="text-sm text-slate-700">
                {prescription.prescription_type === 'chronic'
                  ? '慢性病处方'
                  : prescription.prescription_type === 'pediatric'
                  ? '儿科处方'
                  : '普通处方'}
              </p>
            </div>
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">药品数量</p>
              <p className="text-sm text-slate-700">{prescription.batch_info.length} 种</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-2xs text-slate-400 mb-1.5">药品明细</p>
            <div className="space-y-1">
              {prescription.batch_info.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                  <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{b.drug_name}</span>
                  <span className="text-slate-400">×</span>
                  <span>{b.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card
        title={exception.status === 'closed' ? '处理结果' : '异常处理'}
        className="mb-4"
      >
        {(isActive || exception.status === 'resolved') && (
          <>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder={isActive ? '请输入处理说明...' : '处理结论'}
              readOnly={exception.status === 'resolved' || exception.status === 'closed'}
              className={cn(
                'w-full h-24 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-brand-500',
                (exception.status === 'resolved' || exception.status === 'closed') &&
                  'bg-slate-50 cursor-default',
              )}
            />
            {isActive && (
              <p className="text-2xs text-slate-400 mt-1">
                处理完成后请填写处理结论，以便后续回访和审计
              </p>
            )}
          </>
        )}
        {exception.status === 'closed' && exception.resolution && (
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-600 leading-relaxed">{exception.resolution}</p>
          </div>
        )}
      </Card>

      <Card title="异常时间线" className="mb-4">
        <Timeline events={timelineEvents} />
      </Card>
    </div>
  );
}
