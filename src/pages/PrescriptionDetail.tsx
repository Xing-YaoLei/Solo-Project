import { useState } from 'react';
import { useRouter, Link } from '@tanstack/react-router';
import { usePrescriptionStore } from '@/stores/prescriptionStore';
import { StatusBadge, PageHeader, Card } from '@/components/UI';
import { Timeline } from '@/components/Timeline';
import { users } from '@/mock/data';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Image,
  Calendar,
  User,
  Shield,
  Package,
  CreditCard,
  Loader2,
  ExternalLink,
} from 'lucide-react';

const prescriptionTypeLabels: Record<string, string> = {
  normal: '普通处方',
  chronic: '慢性病处方',
  pediatric: '儿科处方',
};

function isExpiringSoon(expiryDate: string): boolean {
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  return new Date(expiryDate) <= sixMonthsFromNow;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function PrescriptionDetail() {
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const id = pathname.split('/').pop() || '';

  const { prescriptions, exceptions, updatePrescriptionStatus, markException, loading } = usePrescriptionStore();
  const prescription = prescriptions.find((p) => p.id === id);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');
  const [exceptionScope, setExceptionScope] = useState('');
  const [exceptionAssignee, setExceptionAssignee] = useState('');
  const [exceptionType, setExceptionType] = useState('');
  const [exceptionSeverity, setExceptionSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [submittingException, setSubmittingException] = useState(false);

  const EXCEPTION_TYPES = [
    { value: 'rx_unclear', label: '处方信息不清' },
    { value: 'batch_issue', label: '批次效期异常' },
    { value: 'member_issue', label: '会员信息异常' },
    { value: 'insurance_issue', label: '医保结算异常' },
    { value: 'replenishment_issue', label: '补货流程异常' },
    { value: 'other', label: '其他异常' },
  ];

  const SEVERITY_OPTIONS = [
    { value: 'low', label: '低', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    { value: 'medium', label: '中', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { value: 'high', label: '高', color: 'bg-orange-50 text-orange-600 border-orange-200' },
    { value: 'critical', label: '紧急', color: 'bg-red-50 text-red-600 border-red-200' },
  ];

  const relatedExceptions = exceptions.filter((e) => e.prescription_id === id);

  if (!prescription) {
    return (
      <div className="p-6">
        <PageHeader title="处方详情" />
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Image className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">未找到该处方</p>
            <p className="text-2xs text-slate-400 mt-1">处方编号 {id} 不存在或已被删除</p>
            <button
              onClick={() => router.navigate({ to: '/' })}
              className="mt-4 px-4 py-2 text-xs font-medium text-brand-500 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
            >
              返回列表
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const { member_profile: mp, batch_info, replenishment, insurance_record, photos, timeline } = prescription;
  const pharmacistUsers = users.filter((u) => u.role === 'pharmacist');

  const photoUrls = photos.map((_, i) =>
    `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`prescription document scan page ${i + 1} medical record pharmacy`)}&image_size=landscape_4_3`
  );

  const handleApprove = () => {
    updatePrescriptionStatus(id, 'approved');
  };

  const handleReject = () => {
    updatePrescriptionStatus(id, 'rejected');
  };

  const handleExceptionSubmit = async () => {
    if (!exceptionType || !exceptionReason.trim() || !exceptionAssignee || !exceptionScope.trim()) return;
    setSubmittingException(true);
    const result = await markException(id, {
      prescription_id: id,
      exception_type: exceptionType,
      severity: exceptionSeverity,
      impact_scope: exceptionScope,
      description: exceptionReason.trim(),
      assignee_id: exceptionAssignee,
    });
    setSubmittingException(false);
    if (result) {
      setShowExceptionModal(false);
      setExceptionType('');
      setExceptionReason('');
      setExceptionScope('');
      setExceptionAssignee('');
      setExceptionSeverity('medium');
    }
  };

  const canSubmitException = () => {
    return exceptionType && exceptionReason.trim() && exceptionAssignee && exceptionScope.trim();
  };

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <PageHeader
        title={`处方 ${prescription.prescription_no}`}
        description={`${prescription.store_name} · ${prescription.patient_name}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-mint-400 rounded-lg hover:bg-mint-500 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              审核通过
            </button>
            <button
              onClick={handleReject}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors shadow-sm"
            >
              <XCircle className="w-3.5 h-3.5" />
              审核驳回
            </button>
            <button
              onClick={() => setShowExceptionModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-amber-400 rounded-lg hover:bg-amber-500 transition-colors shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              标记异常
            </button>
            <button
              onClick={() => router.navigate({ to: '/' })}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              返回列表
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {relatedExceptions.length > 0 && (
            <Card
              title={
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  异常记录 ({relatedExceptions.length})
                </span>
              }
            >
              <div className="space-y-3">
                {relatedExceptions.map((exc) => (
                  <div
                    key={exc.id}
                    className="flex items-start justify-between p-3 rounded-lg border border-slate-100 hover:border-amber-200 hover:bg-amber-25 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        exc.severity === 'critical' ? 'bg-red-500' :
                        exc.severity === 'high' ? 'bg-orange-500' :
                        exc.severity === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">
                            {exc.exception_no}
                          </span>
                          <StatusBadge status={exc.status} size="sm" />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {EXCEPTION_TYPES.find(t => t.value === exc.exception_type)?.label || exc.exception_type}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {exc.reason}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/exceptions/$id"
                      params={{ id: exc.id }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-brand-500 hover:bg-brand-50 rounded transition-colors shrink-0"
                    >
                      查看详情
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card
            title={
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-500" />
                基本信息
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <InfoField label="处方编号" value={prescription.prescription_no} />
              <InfoField label="门店" value={prescription.store_name} />
              <InfoField label="患者姓名" value={prescription.patient_name} />
              <InfoField
                label="处方类型"
                value={prescriptionTypeLabels[prescription.prescription_type] || prescription.prescription_type}
              />
              <div className="flex items-center gap-2">
                <span className="text-2xs text-slate-400 w-16 shrink-0">状态</span>
                <StatusBadge status={prescription.status} size="md" />
              </div>
              <InfoField label="提交时间" value={formatDateTime(prescription.submitted_at)} />
              {prescription.reviewed_at && (
                <InfoField label="审核时间" value={formatDateTime(prescription.reviewed_at)} />
              )}
            </div>
          </Card>

          <Card
            title={
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-500" />
                批次信息
              </span>
            }
          >
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-2.5 text-2xs font-medium text-slate-400 uppercase tracking-wider">药品名称</th>
                    <th className="text-left px-5 py-2.5 text-2xs font-medium text-slate-400 uppercase tracking-wider">批次号</th>
                    <th className="text-left px-5 py-2.5 text-2xs font-medium text-slate-400 uppercase tracking-wider">有效期</th>
                    <th className="text-right px-5 py-2.5 text-2xs font-medium text-slate-400 uppercase tracking-wider">数量</th>
                  </tr>
                </thead>
                <tbody>
                  {batch_info.map((batch, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-25 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-700">{batch.drug_name}</td>
                      <td className="px-5 py-3 text-slate-500 font-mono text-xs">{batch.batch_no}</td>
                      <td className="px-5 py-3">
                        <span className={isExpiringSoon(batch.expiry_date) ? 'text-red-500 font-semibold' : 'text-slate-500'}>
                          {batch.expiry_date}
                        </span>
                        {isExpiringSoon(batch.expiry_date) && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-2xs bg-red-50 text-red-500 font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            近效期
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-600">{batch.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {replenishment && (
            <Card
              title={
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  补货信息
                </span>
              }
            >
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-2xs text-slate-400 mb-1">订单编号</p>
                  <p className="text-sm font-medium text-slate-700 font-mono">{replenishment.order_no}</p>
                </div>
                <div>
                  <p className="text-2xs text-slate-400 mb-1">状态</p>
                  <StatusBadge status={replenishment.status} size="sm" />
                </div>
                <div>
                  <p className="text-2xs text-slate-400 mb-1">预计到货</p>
                  <p className="text-sm text-slate-700">
                    {replenishment.expected_arrival ? formatDateTime(replenishment.expected_arrival) : '-'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {insurance_record && (
            <Card
              title={
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-mint-400" />
                  医保结算
                </span>
              }
            >
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-2xs text-slate-400 mb-1">结算单号</p>
                  <p className="text-sm font-medium text-slate-700 font-mono">{insurance_record.settlement_no}</p>
                </div>
                <div>
                  <p className="text-2xs text-slate-400 mb-1">结算金额</p>
                  <p className="text-sm font-semibold text-brand-500">{formatCurrency(insurance_record.amount)}</p>
                </div>
                <div>
                  <p className="text-2xs text-slate-400 mb-1">匹配状态</p>
                  <StatusBadge status={insurance_record.match_status} size="sm" />
                </div>
              </div>
            </Card>
          )}

          <Card
            title={
              <span className="flex items-center gap-2">
                <Image className="w-4 h-4 text-brand-500" />
                处方照片
              </span>
            }
          >
            {photos.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">暂无照片</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo, i) => (
                  <button
                    key={photo.id}
                    onClick={() => setLightboxIndex(i)}
                    className="group relative rounded-lg overflow-hidden border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all aspect-[4/3] bg-slate-100"
                  >
                    <img
                      src={photoUrls[i]}
                      alt={`处方照片 ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                      <span className="text-2xs text-white font-medium">点击查看大图</span>
                    </div>
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/50 text-2xs text-white font-mono">
                      {i + 1}/{photos.length}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card
            title={
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-brand-500" />
                会员档案
              </span>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 font-semibold text-sm">
                  {mp.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{mp.name}</p>
                  <p className="text-2xs text-slate-400">{mp.gender} · {mp.age}岁</p>
                </div>
              </div>

              <div>
                <p className="text-2xs text-slate-400 mb-2 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-red-400" />
                  过敏史
                </p>
                {mp.allergies.length === 0 ? (
                  <p className="text-xs text-slate-400">无已知过敏史</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {mp.allergies.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium bg-red-50 text-red-600 border border-red-100"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-2xs text-slate-400 mb-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-400" />
                  用药记录
                </p>
                {mp.medication_history.length === 0 ? (
                  <p className="text-xs text-slate-400">暂无用药记录</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {mp.medication_history.map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium bg-blue-50 text-blue-600 border border-blue-100"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card
            title={
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-500" />
                审核时间线
              </span>
            }
          >
            <Timeline events={timeline} />
          </Card>
        </div>
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-30"
            disabled={lightboxIndex === 0}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(Math.max(0, lightboxIndex - 1));
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-30"
            disabled={lightboxIndex === photos.length - 1}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(Math.min(photos.length - 1, lightboxIndex + 1));
            }}
          >
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
          <div
            className="max-w-4xl max-h-[85vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photoUrls[lightboxIndex]}
              alt={`处方照片 ${lightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
            />
            <p className="text-center text-sm text-white/70 mt-3">
              {lightboxIndex + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}

      {showExceptionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-800">标记异常</h3>
              </div>
              <button
                onClick={() => setShowExceptionModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  异常类型 <span className="text-red-400">*</span>
                </label>
                <select
                  value={exceptionType}
                  onChange={(e) => setExceptionType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 bg-white"
                >
                  <option value="">请选择异常类型</option>
                  {EXCEPTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  严重程度 <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setExceptionSeverity(opt.value as any)}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                        exceptionSeverity === opt.value
                          ? opt.color + ' border-current font-semibold'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  异常原因 <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  rows={3}
                  placeholder="请详细描述异常原因和情况..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 resize-none placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  影响范围 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={exceptionScope}
                  onChange={(e) => setExceptionScope(e.target.value)}
                  placeholder="如：华东区 - 慢性病处方审核 - 可能影响 50+ 张处方"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 placeholder:text-slate-300"
                />
                <p className="text-2xs text-slate-400 mt-1">
                  说明异常可能影响的范围，如区域、门店、处方数量等
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  指派处理人 <span className="text-red-400">*</span>
                </label>
                <select
                  value={exceptionAssignee}
                  onChange={(e) => setExceptionAssignee(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 bg-white"
                >
                  <option value="">请选择药师</option>
                  {pharmacistUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} - {u.store_name || '总部'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-25 rounded-b-xl">
              <button
                onClick={() => setShowExceptionModal(false)}
                disabled={submittingException}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleExceptionSubmit}
                disabled={!canSubmitException() || submittingException}
                className="px-4 py-2 text-xs font-medium text-white bg-amber-400 rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {submittingException ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    提交中...
                  </>
                ) : (
                  '提交异常'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xs text-slate-400 w-16 shrink-0">{label}</span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  );
}

function FileText(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}
