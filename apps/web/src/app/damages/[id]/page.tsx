'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  MessageSquare,
  Gavel,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  ClipboardList,
  User,
  DollarSign,
  FileCheck,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { damageApi, Damage } from '@/lib/api';
import {
  RISK_LEVEL_MAP,
  DAMAGE_STATUS_MAP,
  USER_ROLE_MAP,
  TASK_STATUS_MAP,
  formatDate,
  formatMoney,
  cn,
} from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import AuthGuard from '@/components/AuthGuard';

const RiskIcon = ({ level }: { level: string }) => {
  switch (level) {
    case 'CRITICAL': return <ShieldX size={20} />;
    case 'HIGH': return <ShieldAlert size={20} />;
    case 'MEDIUM': return <Shield size={20} />;
    default: return <ShieldCheck size={20} />;
  }
};

function DamageDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const damageId = params.id as string;

  const [damage, setDamage] = useState<Damage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [commText, setCommText] = useState('');
  const [reviewForm, setReviewForm] = useState({
    conclusion: '',
    suggestion: '',
    approved: true,
  });
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    riskLevel: '',
    actualLoss: 0,
    compensation: 0,
    responsibility: '',
  });

  const commEndRef = useRef<HTMLDivElement>(null);

  const loadDamage = async () => {
    try {
      setLoading(true);
      const data = await damageApi.detail(damageId);
      setDamage(data);
      setEditForm({
        status: data.status,
        riskLevel: data.riskLevel,
        actualLoss: data.actualLoss || 0,
        compensation: data.compensation || 0,
        responsibility: data.responsibility || '',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDamage();
  }, [damageId]);

  useEffect(() => {
    if (commEndRef.current) {
      commEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [damage?.communications?.length]);

  if (loading || !damage) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin w-10 h-10 text-primary-500" />
      </div>
    );
  }

  const risk = RISK_LEVEL_MAP[damage.riskLevel];
  const status = DAMAGE_STATUS_MAP[damage.status];

  const handleSendComm = async () => {
    if (!commText.trim()) return;
    try {
      setSaving(true);
      await damageApi.addCommunication(damageId, { content: commText.trim() });
      setCommText('');
      await loadDamage();
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.conclusion.trim()) return;
    try {
      setSaving(true);
      await damageApi.addReview(damageId, reviewForm);
      setReviewForm({ conclusion: '', suggestion: '', approved: true });
      await loadDamage();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      await damageApi.update(damageId, editForm);
      setEditMode(false);
      await loadDamage();
    } finally {
      setSaving(false);
    }
  };

  const latestReview = damage.reviews?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 font-mono">{damage.reportNo}</h1>
            <span className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold border',
              risk.bg,
              risk.color,
            )}>
              <RiskIcon level={damage.riskLevel} />
              {risk.label}
            </span>
            <span className={status.color}>{status.label}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            关联任务：{damage.task?.taskNo || '-'} · 上报人：{damage.createdBy?.name || '-'} · {formatDate(damage.createdAt)}
          </p>
        </div>
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="btn-outline"
          >
            编辑信息
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditMode(false); setEditForm({ status: damage.status, riskLevel: damage.riskLevel, actualLoss: damage.actualLoss || 0, compensation: damage.compensation || 0, responsibility: damage.responsibility || '' }); }}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="btn-primary disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              保存修改
            </button>
          </div>
        )}
      </div>

      <div className={cn('card border-l-4', risk.bg.replace('bg-', 'border-l-'))} style={{ borderLeft: `4px solid ${damage.riskLevel === 'CRITICAL' ? '#991b1b' : damage.riskLevel === 'HIGH' ? '#ef4444' : damage.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981'}` }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ClipboardList size={14} />
              基本信息
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-sm text-gray-500 w-24 shrink-0">损坏类型</span>
                <span className="text-sm font-medium text-gray-900">{damage.damageType}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-sm text-gray-500 w-24 shrink-0">问题描述</span>
                <span className="text-sm text-gray-800 leading-relaxed">{damage.description}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-sm text-gray-500 w-24 shrink-0">处理状态</span>
                {editMode ? (
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="input w-48"
                  >
                    {Object.entries(DAMAGE_STATUS_MAP).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={status.color}>{status.label}</span>
                )}
              </div>
              <div className="flex items-start gap-3">
                <span className="text-sm text-gray-500 w-24 shrink-0">风险等级</span>
                {editMode ? (
                  <select
                    value={editForm.riskLevel}
                    onChange={(e) => setEditForm({ ...editForm, riskLevel: e.target.value })}
                    className="input w-48"
                  >
                    {Object.entries(RISK_LEVEL_MAP).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={cn('font-semibold', risk.color)}>{risk.label}</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <DollarSign size={14} />
              金额与责任
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">预估损失</span>
                  <div className="text-xl font-bold text-gray-900 mt-1">{formatMoney(damage.estimatedLoss)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">实际损失</span>
                  {editMode ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.actualLoss}
                      onChange={(e) => setEditForm({ ...editForm, actualLoss: parseFloat(e.target.value) || 0 })}
                      className="input mt-1"
                    />
                  ) : (
                    <div className="text-xl font-bold text-danger-600 mt-1">{formatMoney(damage.actualLoss)}</div>
                  )}
                </div>
                <div>
                  <span className="text-sm text-gray-500">赔偿金额</span>
                  {editMode ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.compensation}
                      onChange={(e) => setEditForm({ ...editForm, compensation: parseFloat(e.target.value) || 0 })}
                      className="input mt-1"
                    />
                  ) : (
                    <div className="text-xl font-bold text-warning-600 mt-1">{formatMoney(damage.compensation)}</div>
                  )}
                </div>
                <div>
                  <span className="text-sm text-gray-500">责任人</span>
                  {editMode ? (
                    <input
                      value={editForm.responsibility}
                      onChange={(e) => setEditForm({ ...editForm, responsibility: e.target.value })}
                      className="input mt-1"
                      placeholder="骑手/商家/平台"
                    />
                  ) : (
                    <div className="text-lg font-semibold text-gray-800 mt-1">{damage.responsibility || '-'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {damage.photos?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">现场照片</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {damage.photos.map((photo, idx) => (
                <div key={idx} className="group relative rounded-lg overflow-hidden border border-gray-200 aspect-square">
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300`;
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          <div className="flex flex-col h-[600px]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-transparent">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="text-primary-600" size={20} />
                沟通记录
                <span className="text-sm font-normal text-gray-500">
                  ({damage.communications?.length || 0})
                </span>
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(!damage.communications || damage.communications.length === 0) && (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <MessageSquare size={48} className="text-gray-200 mb-3" />
                  <p className="text-gray-500">暂无沟通记录</p>
                  <p className="text-sm text-gray-400 mt-1">在下方输入框开始沟通</p>
                </div>
              )}

              {damage.communications?.map((comm: any) => {
                const isMe = user?.id === comm.senderId;
                return (
                  <div
                    key={comm.id}
                    className={cn('flex gap-3', isMe && 'flex-row-reverse')}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br shrink-0 flex items-center justify-center text-white text-sm font-medium"
                      style={{
                        background: isMe
                          ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                          : comm.sender?.role === 'RIDER'
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : comm.sender?.role === 'ADMIN' || comm.sender?.role === 'MANAGER'
                          ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                          : 'linear-gradient(135deg, #10b981, #059669)',
                      }}
                    >
                      {comm.sender?.name?.charAt(0) || '?'}
                    </div>
                    <div className={cn('max-w-[75%] flex flex-col gap-1', isMe && 'items-end')}>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium text-gray-700">{comm.sender?.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {USER_ROLE_MAP[comm.sender?.role] || comm.sender?.role}
                        </span>
                        <span>{formatDate(comm.createdAt, 'HH:mm')}</span>
                      </div>
                      <div
                        className={cn(
                          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                          isMe
                            ? 'bg-primary-600 text-white rounded-tr-md'
                            : 'bg-gray-100 text-gray-800 rounded-tl-md',
                        )}
                      >
                        {comm.content}
                      </div>
                      {comm.attachments && comm.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {comm.attachments.map((att: any, idx: number) => (
                            <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                              <img src={att.url} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={commEndRef} />
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-end gap-3">
                <textarea
                  value={commText}
                  onChange={(e) => setCommText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendComm();
                    }
                  }}
                  rows={2}
                  className="input resize-none flex-1"
                  placeholder="输入沟通内容（Enter发送，Shift+Enter换行）..."
                />
                <button
                  onClick={handleSendComm}
                  disabled={saving || !commText.trim()}
                  className="btn-primary shrink-0 h-[52px] disabled:opacity-60"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  发送
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col h-[600px]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-transparent">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Gavel className="text-purple-600" size={20} />
                复核结论
                <span className="text-sm font-normal text-gray-500">
                  ({damage.reviews?.length || 0})
                </span>
              </h3>
              {latestReview && (
                <span className={cn(
                  'badge text-xs',
                  latestReview.approved ? 'badge-success' : 'badge-danger',
                )}>
                  {latestReview.approved ? '已通过' : '需重审'}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {(!damage.reviews || damage.reviews.length === 0) && (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <FileCheck size={48} className="text-gray-200 mb-3" />
                  <p className="text-gray-500">暂无复核结论</p>
                  <p className="text-sm text-gray-400 mt-1">填写下方表单提交复核意见</p>
                </div>
              )}

              {damage.reviews?.map((review: any, idx: number) => (
                <div
                  key={review.id}
                  className={cn(
                    'p-4 rounded-xl border-2',
                    review.approved
                      ? 'border-success-200 bg-success-50/30'
                      : 'border-danger-200 bg-danger-50/30',
                    idx === 0 && 'ring-2 ring-offset-2',
                    idx === 0 && review.approved && 'ring-success-200',
                    idx === 0 && !review.approved && 'ring-danger-200',
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                        {review.reviewer?.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{review.reviewer?.name}</div>
                        <div className="text-xs text-gray-500">
                          {USER_ROLE_MAP[review.reviewer?.role]} · {formatDate(review.reviewedAt)}
                        </div>
                      </div>
                    </div>
                    <span className={cn(
                      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold',
                      review.approved
                        ? 'bg-success-100 text-success-700'
                        : 'bg-danger-100 text-danger-700',
                    )}>
                      {review.approved ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {review.approved ? '复核通过' : '需要重审'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">复核结论</div>
                      <div className="text-sm text-gray-800 leading-relaxed p-3 rounded-lg bg-white/70 border border-white">
                        {review.conclusion}
                      </div>
                    </div>
                    {review.suggestion && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">处理建议</div>
                        <div className="text-sm text-gray-700 leading-relaxed p-3 rounded-lg bg-white/50 border border-white/50">
                          {review.suggestion}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="space-y-3">
                <div>
                  <label className="label">复核结论 *</label>
                  <textarea
                    value={reviewForm.conclusion}
                    onChange={(e) => setReviewForm({ ...reviewForm, conclusion: e.target.value })}
                    rows={3}
                    className="input resize-none"
                    placeholder="请详细描述复核结论，包括责任认定、事实依据等..."
                  />
                </div>

                <div>
                  <label className="label">处理建议</label>
                  <input
                    value={reviewForm.suggestion}
                    onChange={(e) => setReviewForm({ ...reviewForm, suggestion: e.target.value })}
                    className="input"
                    placeholder="赔偿方案、处罚措施、改进建议等"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, approved: true })}
                      className={cn(
                        'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all inline-flex items-center gap-1.5',
                        reviewForm.approved
                          ? 'border-success-500 bg-success-50 text-success-700'
                          : 'border-gray-200 text-gray-600 hover:border-success-300 hover:bg-success-50/30',
                      )}
                    >
                      <ThumbsUp size={14} />
                      复核通过
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, approved: false })}
                      className={cn(
                        'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all inline-flex items-center gap-1.5',
                        !reviewForm.approved
                          ? 'border-danger-500 bg-danger-50 text-danger-700'
                          : 'border-gray-200 text-gray-600 hover:border-danger-300 hover:bg-danger-50/30',
                      )}
                    >
                      <ThumbsDown size={14} />
                      需要重审
                    </button>
                  </div>

                  <button
                    onClick={handleSubmitReview}
                    disabled={saving || !reviewForm.conclusion.trim()}
                    className="btn-primary disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <FileCheck size={16} />}
                    提交复核
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <ClipboardList className="text-gray-600" size={20} />
          关联任务信息
        </h3>
        <Link
          href={`/tasks/${damage.taskId}`}
          className="block p-5 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-lg font-bold text-gray-900">{damage.task?.taskNo}</span>
                <span className={TASK_STATUS_MAP[damage.task?.status || ''].color}>
                  {TASK_STATUS_MAP[damage.task?.status || '']?.label}
                </span>
                <span className="text-gray-400">·</span>
                <span className="text-sm text-gray-500">订单：{damage.task?.orderNo}</span>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">骑手</div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-medium">
                      {damage.task?.rider?.user?.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {damage.task?.rider?.user?.name}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {damage.task?.rider?.riderCode}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">物品信息</div>
                  <div className="text-sm text-gray-900 font-medium">
                    {damage.task?.itemName} × {damage.task?.itemQuantity}
                  </div>
                  <div className="text-xs text-gray-500">
                    估值 {formatMoney(damage.task?.itemValue)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">核验员</div>
                  <div className="text-sm font-medium text-gray-900">
                    {damage.task?.assignedTo?.name || '-'}
                  </div>
                  <div className="text-xs text-gray-500">
                    创建：{formatDate(damage.task?.createdAt, 'MM-DD HH:mm')}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-primary-600 text-sm font-medium shrink-0 hover:translate-x-1 transition-transform">
              查看任务详情 →
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default function DamageDetailPage() {
  return (
    <AuthGuard>
      <DamageDetailContent />
    </AuthGuard>
  );
}
