import { useState } from 'react';
import { useRouter, useParams } from '@tanstack/react-router';
import { usePrescriptionStore } from '@/stores/prescriptionStore';
import { StatusBadge, PageHeader, Card } from '@/components/UI';
import { Timeline } from '@/components/Timeline';
import { ArrowLeft, AlertTriangle, FileText, User, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineEvent } from '@/types';

export function ExceptionDetail() {
  const router = useRouter();
  const { id } = useParams({ strict: false }) as { id: string };
  const { exceptions, prescriptions, updateExceptionStatus } = usePrescriptionStore();

  const exception = exceptions.find((e) => e.id === id);
  const prescription = exception
    ? prescriptions.find((p) => p.id === exception.prescription_id)
    : undefined;

  const [resolution, setResolution] = useState(exception?.resolution || '');

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

  const handleResolve = () => {
    if (!resolution.trim()) return;
    updateExceptionStatus(exception.id, 'resolved', resolution.trim());
  };

  const handleClose = () => {
    updateExceptionStatus(exception.id, 'closed', resolution.trim() || exception.resolution);
  };

  const timelineEvents: TimelineEvent[] = [
    {
      timestamp: exception.created_at,
      action: '创建异常',
      actor: exception.assignee_name,
      detail: exception.reason,
      status: 'exception',
    },
    ...(exception.status === 'processing' || exception.status === 'resolved' || exception.status === 'closed'
      ? [{
          timestamp: exception.created_at,
          action: '开始处理',
          actor: exception.assignee_name,
          detail: `${exception.assignee_name} 已受理该异常`,
          status: 'in_review' as const,
        }]
      : []),
    ...(exception.resolved_at
      ? [{
          timestamp: exception.resolved_at,
          action: '处理完成',
          actor: exception.assignee_name,
          detail: exception.resolution || '异常已解决',
          status: 'approved' as const,
        }]
      : []),
    ...(exception.status === 'closed'
      ? [{
          timestamp: exception.resolved_at || exception.created_at,
          action: '关闭异常',
          actor: exception.assignee_name,
          detail: '异常已关闭，无需进一步处理',
          status: 'approved' as const,
        }]
      : []),
  ];

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
        actions={<StatusBadge status={exception.status} size="md" />}
      />

      <Card title="异常信息" className="mb-4">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">异常编号</p>
              <p className="text-sm font-medium text-slate-700">{exception.exception_no}</p>
            </div>
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">当前状态</p>
              <StatusBadge status={exception.status} size="md" />
            </div>
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">关联处方</p>
              <p className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                {exception.prescription_no}
              </p>
            </div>
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">处理人</p>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-sm text-slate-700">{exception.assignee_name}</span>
              </div>
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
            <p className="text-sm text-slate-700">{exception.impact_scope}</p>
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
      </Card>

      {prescription && (
        <Card title="关联处方摘要" className="mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xs text-slate-400 mb-0.5">处方编号</p>
              <p className="text-sm font-medium text-slate-700">{prescription.prescription_no}</p>
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
                {prescription.prescription_type === 'chronic' ? '慢性病处方' : prescription.prescription_type === 'pediatric' ? '儿科处方' : '普通处方'}
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
        actions={
          isActive ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleResolve}
                disabled={!resolution.trim()}
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
              <button
                onClick={handleClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                关闭异常
              </button>
            </div>
          ) : exception.status === 'resolved' ? (
            <button
              onClick={handleClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              关闭异常
            </button>
          ) : null
        }
      >
        {(isActive || exception.status === 'resolved') && (
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="请输入处理说明..."
            readOnly={exception.status === 'resolved'}
            className={cn(
              'w-full h-24 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400',
              exception.status === 'resolved' && 'bg-slate-50 cursor-default',
            )}
          />
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
