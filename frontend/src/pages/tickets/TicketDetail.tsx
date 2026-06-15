import { useState, useEffect, useRef, useMemo } from 'react';
import api from '@/api/client';
import dayjs from 'dayjs';
import { useNavigate } from '@tanstack/react-router';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import type {
  CommunityTicket,
  MemberProfile,
  AccountTransaction,
  ReviewRecord,
  AuditLog,
  TicketBenefitReference,
} from '../../types';

type TicketStatus =
  | 'draft'
  | 'pending_review'
  | 'reviewing'
  | 'supplement_needed'
  | 'escalated_review'
  | 'processing'
  | 'completed'
  | 'closed';

type Priority = 'low' | 'medium' | 'high' | 'urgent' | number;

interface TicketDetailData {
  ticket: CommunityTicket;
}

const STATUS_LABEL: Record<TicketStatus, string> = {
  draft: '待提交',
  pending_review: '待审核',
  reviewing: '审核中',
  supplement_needed: '补资料',
  escalated_review: '升级复核',
  processing: '处理中',
  completed: '已完成',
  closed: '已关闭',
};

const STATUS_COLOR: Record<TicketStatus, string> = {
  draft: '#909399',
  pending_review: '#E6A23C',
  reviewing: '#409EFF',
  supplement_needed: '#F56C6C',
  escalated_review: '#8B5CF6',
  processing: '#36CFC9',
  completed: '#67C23A',
  closed: '#606266',
};

const PRIORITY_LABEL: Record<Priority, string> = { low: '低优先级', medium: '中优先级', high: '高优先级', urgent: '紧急' };
const PRIORITY_COLOR: Record<Priority, string> = { low: '#909399', medium: '#409EFF', high: '#E6A23C', urgent: '#F56C6C' };

const SOURCE_LABEL: Record<string, string> = {
  wechat: '微信社群',
  wechat_group: '微信群',
  phone: '电话咨询',
  online: '官网留言',
  referral: '转介绍',
  offline: '线下活动',
  offline_activity: '线下活动',
  qq_group: 'QQ群',
  advertisement: '广告',
  other: '其他',
};

const MEMBER_LEVEL_COLOR: Record<string, { bg: string; text: string }> = {
  basic: { bg: '#f3f4f6', text: '#4b5563' },
  silver: { bg: '#e5e7eb', text: '#374151' },
  gold: { bg: '#fef3c7', text: '#92400e' },
  platinum: { bg: '#dbeafe', text: '#1e40af' },
  diamond: { bg: '#ede9fe', text: '#6d28d9' },
};

const MEMBER_LEVEL_LABEL: Record<string, string> = {
  basic: '普通会员',
  silver: '银卡会员',
  gold: '金卡会员',
  platinum: '白金会员',
  diamond: '钻石会员',
};

const TRANSACTION_TYPE_LABEL: Record<string, string> = {
  payment: '支付',
  refund: '退款',
  commission: '佣金',
  deduction: '扣款',
  bonus: '奖励',
};

const TRANSACTION_TYPE_COLOR: Record<string, string> = {
  payment: '#3b82f6',
  refund: '#ef4444',
  commission: '#10b981',
  deduction: '#f59e0b',
  bonus: '#8b5cf6',
};

const BENEFIT_TYPE_LABEL: Record<string, string> = {
  discount: '折扣',
  points: '积分',
  cash: '现金券',
  gift: '礼品',
  service: '服务',
};

const BENEFIT_TYPE_COLOR: Record<string, string> = {
  discount: '#ec4899',
  points: '#14b8a6',
  cash: '#f97316',
  gift: '#8b5cf6',
  service: '#06b6d4',
};

const REVIEW_TAG_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function TicketDetail({ ticketId }: { ticketId: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TicketDetailData | null>(null);
  const [highlightTxId, setHighlightTxId] = useState<number | null>(null);
  const [highlightBenefitId, setHighlightBenefitId] = useState<number | null>(null);
  const [expandedBenefits, setExpandedBenefits] = useState<Set<number>>(new Set());
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'review' | 'audit'>('review');

  const [statusModal, setStatusModal] = useState<{ visible: boolean; action: string; title: string }>({
    visible: false,
    action: '',
    title: '',
  });
  const [statusForm, setStatusForm] = useState({ remark: '', evidenceUrls: '' });
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    review_tag: '',
    score: 0,
    summary: '',
    cited_transaction_ids: '',
    cited_benefit_ids: '',
    follow_up_actions: '',
    is_escalated: false,
  });

  const txRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const benefitRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchDetail();
  }, [ticketId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      setData(res as TicketDetailData);
    } catch (e) {
      console.error('fetch ticket detail error', e);
      setData(generateMockData(Number(ticketId)));
    } finally {
      setLoading(false);
    }
  };

  const scrollAndHighlight = (type: 'tx' | 'benefit', id: number) => {
    const refMap = type === 'tx' ? txRefs : benefitRefs;
    const setHighlight = type === 'tx' ? setHighlightTxId : setHighlightBenefitId;
    const el = refMap.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      setHighlight(id);
      highlightTimer.current = setTimeout(() => setHighlight(null), 3000);
    }
  };

  const toggleBenefit = (id: number) => {
    setExpandedBenefits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleReview = (id: number) => {
    setExpandedReviews((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isClosed = data?.ticket.status === 'closed';

  const statusActions = useMemo(() => {
    if (!data) return [];
    const s = data.ticket.status as TicketStatus;
    const actions: { key: string; label: string; className: string }[] = [];
    switch (s) {
      case 'draft':
        actions.push({ key: 'submit', label: '提交审核', className: 'btn-primary' });
        break;
      case 'pending_review':
        actions.push({ key: 'start_review', label: '开始审核', className: 'btn-primary' });
        break;
      case 'reviewing':
        actions.push({ key: 'approve', label: '通过', className: 'btn-success' });
        actions.push({ key: 'supplement', label: '要求补资料', className: 'btn-warning' });
        actions.push({ key: 'escalate', label: '升级复核', className: 'btn-purple' });
        break;
      case 'supplement_needed':
        actions.push({ key: 'resubmit', label: '重新提交', className: 'btn-primary' });
        break;
      case 'escalated_review':
        actions.push({ key: 'senior_approve', label: '复核通过', className: 'btn-success' });
        actions.push({ key: 'supplement', label: '要求补资料', className: 'btn-warning' });
        break;
      case 'processing':
        actions.push({ key: 'complete', label: '完成处理', className: 'btn-success' });
        break;
      case 'completed':
        actions.push({ key: 'close', label: '关闭', className: 'btn-gray' });
        break;
    }
    if (s !== 'closed') {
      actions.push({ key: 'review', label: '复盘', className: 'btn-secondary' });
    }
    return actions;
  }, [data]);

  const handleActionClick = (action: string) => {
    if (action === 'review') {
      setReviewModal(true);
      return;
    }
    const titles: Record<string, string> = {
      submit: '确认提交审核',
      start_review: '确认开始审核',
      approve: '确认通过',
      senior_approve: '确认复核通过',
      supplement: '要求补资料',
      escalate: '确认升级复核',
      resubmit: '确认重新提交',
      complete: '确认完成处理',
      close: '确认关闭单据',
    };
    setStatusModal({ visible: true, action, title: titles[action] || action });
  };

  const handleStatusConfirm = async () => {
    const actionToStatus: Record<string, string> = {
      submit: 'pending_review',
      start_review: 'reviewing',
      approve: 'processing',
      senior_approve: 'processing',
      supplement: 'supplement_needed',
      escalate: 'escalated_review',
      resubmit: 'pending_review',
      complete: 'completed',
      close: 'closed',
    };
    const newStatus = actionToStatus[statusModal.action];
    const payload: any = {
      new_status: newStatus,
      comment: statusForm.remark || undefined,
      evidence_urls: statusForm.evidenceUrls.split(',').map((s) => s.trim()).filter(Boolean),
    };
    if (statusModal.action === 'supplement' && statusForm.remark) {
      payload.supplement_requirements = statusForm.remark;
    }
    if (statusModal.action === 'close' && statusForm.remark) {
      payload.close_remark = statusForm.remark;
    }
    try {
      await api.post(`/tickets/${ticketId}/status`, payload);
    } catch (e) {
      console.error('status change error', e);
    }
    setStatusModal({ visible: false, action: '', title: '' });
    setStatusForm({ remark: '', evidenceUrls: '' });
    fetchDetail();
  };

  const REVIEW_TAG_OPTIONS = [
    { value: 'excellent', label: '优秀' },
    { value: 'good', label: '良好' },
    { value: 'normal', label: '一般' },
    { value: 'needs_improvement', label: '待改进' },
    { value: 'problematic', label: '存疑' },
  ];

  const parseIds = (str: string): number[] => {
    if (!str.trim()) return [];
    return str.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n) && n > 0);
  };

  const handleReviewSubmit = async () => {
    if (!reviewForm.review_tag) {
      alert('请选择复盘标签');
      return;
    }
    try {
      await api.post(`/tickets/${ticketId}/review`, {
        review_tag: reviewForm.review_tag,
        score: reviewForm.score || undefined,
        summary: reviewForm.summary || undefined,
        evidence_urls: [],
        cited_transaction_ids: parseIds(reviewForm.cited_transaction_ids),
        cited_benefit_ids: parseIds(reviewForm.cited_benefit_ids),
        follow_up_actions: reviewForm.follow_up_actions.split('\n').map((s) => s.trim()).filter(Boolean),
        is_escalated: reviewForm.is_escalated,
      });
    } catch (e) {
      console.error('review submit error', e);
    }
    setReviewModal(false);
    setReviewForm({
      review_tag: '',
      score: 0,
      summary: '',
      cited_transaction_ids: '',
      cited_benefit_ids: '',
      follow_up_actions: '',
      is_escalated: false,
    });
    fetchDetail();
  };

  const totalTransactionAmount = useMemo(() => {
    if (!data) return { income: 0, expense: 0 };
    let income = 0, expense = 0;
    (data.ticket.transactions || []).forEach((t) => {
      const amt = t.amount || 0;
      if (t.type === 'refund' || t.type === 'deduction') {
        expense += Math.abs(amt);
      } else {
        income += Math.abs(amt);
      }
    });
    return { income, expense };
  }, [data]);

  const totalBenefitValue = useMemo(() => {
    if (!data) return 0;
    return data.ticket.benefit_references?.reduce((sum, b) => sum + (b.applied_value || 0), 0) || 0;
  }, [data]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <style>{detailStyles}</style>
        <div className="text-gray-500 text-lg">加载中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <style>{detailStyles}</style>
        <div className="text-gray-500 text-lg">未找到该单据数据</div>
      </div>
    );
  }

  const { ticket } = data;
  const member = ticket.member || ({} as any);
  const benefit_references = ticket.benefit_references || [];
  const transactions = ticket.transactions || [];
  const review_records = ticket.review_records || [];
  const audit_logs = ticket.audit_logs || [];
  const ticketStatus = ticket.status as TicketStatus;
  const priority = ticket.priority || 'medium';

  return (
    <div className="ticket-detail-page">
      <style>{detailStyles}</style>

      <div className="breadcrumb-bar">
        <span className="breadcrumb-item" onClick={() => navigate({ to: '/tickets' })}>单据管理</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">单据详情</span>
      </div>

      <div className="header-card">
        <div className="header-top">
          <div className="title-row">
            <h1 className="ticket-title">{ticket.title}</h1>
            <span
              className="status-badge-lg"
              style={{ backgroundColor: STATUS_COLOR[ticketStatus] + '20', color: STATUS_COLOR[ticketStatus], borderColor: STATUS_COLOR[ticketStatus] }}
            >
              {STATUS_LABEL[ticketStatus]}
            </span>
          </div>
          <div className="ticket-meta-row">
            <span className="ticket-no">#{ticket.ticket_no}</span>
            <span
              className="priority-tag"
              style={{
                backgroundColor: PRIORITY_COLOR[priority] + '15',
                color: PRIORITY_COLOR[priority],
                border: '1px solid ' + PRIORITY_COLOR[priority] + '40',
              }}
            >
              {PRIORITY_LABEL[priority]}
            </span>
          </div>
        </div>

        <div className="action-row">
          {statusActions.length === 0 ? (
            <span className="text-muted text-sm">当前状态下无可用操作</span>
          ) : (
            statusActions.map((a) => (
              <button
                key={a.key}
                className={`btn ${a.className}`}
                disabled={isClosed}
                onClick={() => handleActionClick(a.key)}
              >
                {a.label}
              </button>
            ))
          )}
        </div>

        <div className="info-bar">
          <div className="info-item">
            <span className="info-label">会员姓名</span>
            <span className="info-value link-text" onClick={() => navigate({ to: '/members' })}>
              {member.name || '-'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">来源渠道</span>
            <span className="info-value">{SOURCE_LABEL[ticket.source || ''] || ticket.source || '-'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">责任人</span>
            <span className="info-value">{ticket.responsible?.full_name || '-'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">创建时间</span>
            <span className="info-value mono">{ticket.created_at ? dayjs(ticket.created_at).format('YYYY-MM-DD HH:mm') : '-'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">更新时间</span>
            <span className="info-value mono">{ticket.updated_at ? dayjs(ticket.updated_at).format('YYYY-MM-DD HH:mm') : '-'}</span>
          </div>
        </div>
      </div>

      <div className="three-column-layout" style={{ gridTemplateColumns: '320px 1fr 1fr' }}>
        {/* 左栏 - 会员档案 */}
        <div className="left-column">
          <div className="card">
            <h3 className="card-title">👤 会员档案</h3>

            <div className="profile-section">
              <h4 className="section-subtitle">基本信息</h4>
              <div className="info-grid">
                <div className="info-line"><span className="k">姓名</span><span className="v font-semibold">{member.name || '-'}</span></div>
                <div className="info-line"><span className="k">会员号</span><span className="v mono">{member.member_no || '-'}</span></div>
                <div className="info-line"><span className="k">手机号</span><span className="v mono">{member.phone || '-'}</span></div>
                <div className="info-line"><span className="k">邮箱</span><span className="v">{member.email || '-'}</span></div>
                <div className="info-line">
                  <span className="k">等级</span>
                  <span className="v">
                    {member.level ? (
                      <span
                        className="level-tag"
                        style={{
                          backgroundColor: MEMBER_LEVEL_COLOR[member.level]?.bg || '#f3f4f6',
                          color: MEMBER_LEVEL_COLOR[member.level]?.text || '#4b5563',
                        }}
                      >
                        {MEMBER_LEVEL_LABEL[member.level] || member.level}
                      </span>
                    ) : '-'}
                  </span>
                </div>
                <div className="info-line"><span className="k">来源</span><span className="v">{SOURCE_LABEL[member.source_channel || ''] || '-'}</span></div>
                <div className="info-line"><span className="k">加入日期</span><span className="v mono">{member.join_date ? dayjs(member.join_date).format('YYYY-MM-DD') : '-'}</span></div>
              </div>
            </div>

            <div className="profile-section">
              <h4 className="section-subtitle">考试信息</h4>
              <div className="info-grid">
                <div className="info-line">
                  <span className="k">考试分数</span>
                  <span className={`v font-semibold ${member.exam_pass_status ? 'text-success' : 'text-danger'}`}>
                    {member.exam_score !== undefined ? `${member.exam_score}分 (${member.exam_pass_status ? '通过' : '未通过'})` : '-'}
                  </span>
                </div>
                <div className="info-line"><span className="k">考试日期</span><span className="v mono">{member.exam_date ? dayjs(member.exam_date).format('YYYY-MM-DD') : '-'}</span></div>
                <div className="info-line"><span className="k">学习时长</span><span className="v">{member.total_learning_hours ? `${member.total_learning_hours}小时` : '-'}</span></div>
                <div className="info-line"><span className="k">所属社群</span><span className="v">{member.community_group || '-'}</span></div>
              </div>
            </div>

            {member.tags && member.tags.length > 0 && (
              <div className="profile-section">
                <h4 className="section-subtitle">标签</h4>
                <div className="tag-list">
                  {(member.tags || []).map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="color-tag"
                      style={{
                        backgroundColor: REVIEW_TAG_COLORS[i % REVIEW_TAG_COLORS.length] + '20',
                        color: REVIEW_TAG_COLORS[i % REVIEW_TAG_COLORS.length],
                        borderColor: REVIEW_TAG_COLORS[i % REVIEW_TAG_COLORS.length],
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="profile-actions">
              <button className="btn btn-sm btn-primary" onClick={() => navigate({ to: '/members' })}>
                查看完整档案
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => navigate({ to: '/tickets' })}>
                查看该会员单据
              </button>
            </div>
          </div>
        </div>

        {/* 中栏 - 权益规则 + 单据详情 */}
        <div className="middle-column">
          <div className="card section-card">
            <h3 className="card-title">🎁 权益规则</h3>
            {benefit_references.length === 0 ? (
              <div className="empty-state">暂无关联权益</div>
            ) : (
              <>
                <div className="benefit-list">
                  {benefit_references.map((b, i) => (
                    <div
                      key={b.id || i}
                      ref={(el) => { if (b.id !== undefined) benefitRefs.current[b.id] = el; }}
                      className={`benefit-item ${highlightBenefitId === b.id ? 'highlight-row' : ''}`}
                    >
                      <div className="benefit-header" onClick={() => b.id !== undefined && toggleBenefit(b.id)}>
                        <div className="benefit-title-row">
                          <span className="benefit-name">{b.benefit?.rule_name || '未命名权益'}</span>
                          {b.benefit?.benefit_type && (
                            <span
                              className="benefit-type-tag"
                              style={{
                                backgroundColor: BENEFIT_TYPE_COLOR[b.benefit.benefit_type] + '20',
                                color: BENEFIT_TYPE_COLOR[b.benefit.benefit_type],
                              }}
                            >
                              {BENEFIT_TYPE_LABEL[b.benefit.benefit_type] || b.benefit.benefit_type}
                            </span>
                          )}
                        </div>
                        <div className="benefit-meta">
                          {b.applied_value !== undefined && (
                            <span className="benefit-value text-orange">￥{b.applied_value.toFixed(2)}</span>
                          )}
                          {b.benefit?.is_active !== undefined && (
                            <span className={`benefit-status ${b.benefit.is_active ? 'status-active' : 'status-inactive'}`}>
                              {b.benefit.is_active ? '可用' : '已失效'}
                            </span>
                          )}
                        </div>
                      </div>
                      {b.id !== undefined && expandedBenefits.has(b.id) && (
                        <div className="benefit-detail">
                          {b.benefit?.applicable_levels && b.benefit.applicable_levels.length > 0 && (
                            <div className="detail-line">
                              <span className="k">适用等级：</span>
                              <span className="v">{b.benefit.applicable_levels.map((l) => MEMBER_LEVEL_LABEL[l] || l).join('、')}</span>
                            </div>
                          )}
                          {b.benefit?.description && (
                            <div className="detail-line">
                              <span className="k">条件描述：</span>
                              <span className="v">{b.benefit.description}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="benefit-summary">
                  共 <strong>{benefit_references.length}</strong> 项权益，累计价值{' '}
                  <strong className="text-orange">￥{totalBenefitValue.toFixed(2)}</strong>
                </div>
              </>
            )}
          </div>

          <div className="card section-card">
            <h3 className="card-title">📋 单据详情</h3>
            <div className="ticket-detail-section">
              <div className="detail-line">
                <span className="k">复盘标签</span>
                <span className="v">
                  {ticket.review_tag
                    ? (() => {
                        const tagOpt = REVIEW_TAG_OPTIONS.find((o) => o.value === ticket.review_tag);
                        return (
                          <span
                            className="color-tag"
                            style={{
                              backgroundColor: REVIEW_TAG_COLORS[0] + '20',
                              color: REVIEW_TAG_COLORS[0],
                              borderColor: REVIEW_TAG_COLORS[0],
                            }}
                          >
                            {tagOpt?.label || ticket.review_tag}
                          </span>
                        );
                      })()
                    : '-'}
                </span>
              </div>
              <div className="detail-line">
                <span className="k">创建人</span>
                <span className="v">{ticket.creator?.full_name || ticket.creator?.username || '-'}</span>
              </div>
              <div className="detail-block">
                <span className="k">问题描述</span>
                <div className="v content-block">{ticket.description || '-'}</div>
              </div>
            </div>

            {ticket.evidence_urls && ticket.evidence_urls.length > 0 && (
              <div className="evidence-section">
                <h4 className="section-subtitle">凭证附件</h4>
                <div className="evidence-list">
                  {ticket.evidence_urls.map((url, i) => (
                    <div
                      key={i}
                      className="evidence-item link-text"
                      onClick={() => window.open(url, '_blank')}
                    >
                      📎 附件 {i + 1}
                      <span className="evidence-url mono">{url.length > 40 ? url.slice(0, 40) + '...' : url}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ticket.supplement_requirements && (
              <div className="supplement-card">
                <div className="supplement-title">⚠️ 补资料要求</div>
                <div className="supplement-content">{ticket.supplement_requirements}</div>
              </div>
            )}
          </div>
        </div>

        {/* 右栏 - 账户流水 + 复盘记录/审计轨迹 */}
        <div className="right-column">
          <div className="card section-card">
            <div className="card-header-between">
              <h3 className="card-title no-margin">💰 账户流水</h3>
              <span className="link-text text-sm" onClick={() => navigate({ to: '/transactions' })}>
                查看全部流水 →
              </span>
            </div>
            <div className="tx-summary-row">
              <div className="tx-summary-item income">
                <span className="tx-summary-label">总收入</span>
                <span className="tx-summary-value">￥{totalTransactionAmount.income.toFixed(2)}</span>
              </div>
              <div className="tx-summary-item expense">
                <span className="tx-summary-label">总支出</span>
                <span className="tx-summary-value">￥{totalTransactionAmount.expense.toFixed(2)}</span>
              </div>
            </div>
            {transactions.length === 0 ? (
              <div className="empty-state">暂无关联流水</div>
            ) : (
              <div className="tx-list">
                {transactions.map((t, i) => (
                  <div
                    key={t.id || i}
                    ref={(el) => { if (t.id !== undefined) txRefs.current[t.id] = el; }}
                    className={`tx-item ${highlightTxId === t.id ? 'highlight-row' : ''}`}
                  >
                    <div className="tx-header">
                      <span className="tx-no mono">{t.transaction_no || `TX-${t.id}`}</span>
                      {t.type && (
                        <span
                          className="tx-type-tag"
                          style={{
                            backgroundColor: TRANSACTION_TYPE_COLOR[t.type] + '20',
                            color: TRANSACTION_TYPE_COLOR[t.type],
                          }}
                        >
                          {TRANSACTION_TYPE_LABEL[t.type] || t.type}
                        </span>
                      )}
                    </div>
                    <div className="tx-body">
                      <div className="tx-row">
                        <span className={`tx-amount ${t.type === 'refund' || t.type === 'deduction' ? 'tx-neg' : 'tx-pos'}`}>
                          {t.type === 'refund' || t.type === 'deduction' ? '-' : '+'}
                          ￥{Math.abs(t.amount || 0).toFixed(2)}
                        </span>
                        <span className="tx-balance">余额 ￥{(t.balance_after || 0).toFixed(2)}</span>
                      </div>
                      <div className="tx-row tx-meta">
                        <span className="tx-method">{t.payment_method || '-'}</span>
                        <span className="tx-date mono">{t.created_at ? dayjs(t.created_at).format('YYYY-MM-DD HH:mm') : '-'}</span>
                      </div>
                      {t.evidence_urls && t.evidence_urls.length > 0 && (
                        <div className="tx-row">
                          {t.evidence_urls.map((url, j) => (
                            <span
                              key={j}
                              className="link-text text-sm"
                              onClick={() => window.open(url, '_blank')}
                              style={{ marginRight: j < t.evidence_urls!.length - 1 ? '8px' : '0' }}
                            >
                              📎 凭证{j + 1}
                            </span>
                          ))}
                        </div>
                      )}
                      {t.description && (
                        <div className="tx-desc">{t.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card section-card">
            <div className="tab-bar">
              <button
                className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
                onClick={() => setActiveTab('review')}
              >
                📝 复盘记录
              </button>
              <button
                className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => setActiveTab('audit')}
              >
                📊 审计轨迹
              </button>
            </div>

            {activeTab === 'review' && (
              <div className="review-section">
                <div className="review-header-row">
                  <span className="text-muted text-sm">共 {review_records.length} 条复盘</span>
                  {!isClosed && (
                    <button className="btn btn-sm btn-primary" onClick={() => setReviewModal(true)}>
                      + 新建复盘
                    </button>
                  )}
                </div>
                {review_records.length === 0 ? (
                  <div className="empty-state">暂无复盘记录</div>
                ) : (
                  <div className="review-list">
                    {review_records.map((r, i) => (
                      <div key={r.id || i} className="review-item">
                        <div className="review-header" onClick={() => r.id !== undefined && toggleReview(r.id)}>
                          <div className="review-title-row">
                            <span className="review-round">第 {r.round || i + 1} 轮复盘</span>
                            {r.is_escalated && <span className="escalated-tag">已升级</span>}
                          </div>
                          <div className="review-meta-row">
                            {r.review_tag && (() => {
                              const tagOpt = REVIEW_TAG_OPTIONS.find((o) => o.value === r.review_tag);
                              return (
                                <span
                                  className="color-tag-sm"
                                  style={{
                                    backgroundColor: REVIEW_TAG_COLORS[0] + '20',
                                    color: REVIEW_TAG_COLORS[0],
                                  }}
                                >
                                  {tagOpt?.label || r.review_tag}
                                </span>
                              );
                            })()}
                            <span className="review-score">得分 {r.score || 0}</span>
                          </div>
                        </div>
                        <div className="review-subheader">
                          <span className="reviewer">{r.reviewer?.full_name || r.reviewer?.username || '未知'}</span>
                          <span className="review-time mono">{r.created_at ? dayjs(r.created_at).format('YYYY-MM-DD HH:mm') : '-'}</span>
                        </div>
                        {r.id !== undefined && expandedReviews.has(r.id) && (
                          <div className="review-detail">
                            {r.summary && (
                              <div className="detail-block">
                                <span className="k">复盘结论</span>
                                <div className="v content-block">{r.summary}</div>
                              </div>
                            )}
                            {r.follow_up_actions && r.follow_up_actions.length > 0 && (
                              <div className="detail-block">
                                <span className="k">后续动作</span>
                                <ul className="action-list">
                                  {r.follow_up_actions.map((a, j) => (
                                    <li key={j}>• {a}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {r.cited_transaction_ids && r.cited_transaction_ids.length > 0 && (
                              <div className="detail-block">
                                <span className="k">引用流水</span>
                                <div className="cite-list">
                                  {r.cited_transaction_ids.map((tid) => (
                                    <span
                                      key={tid}
                                      className="cite-link"
                                      onClick={() => scrollAndHighlight('tx', tid)}
                                    >
                                      #{tid}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {r.cited_benefit_ids && r.cited_benefit_ids.length > 0 && (
                              <div className="detail-block">
                                <span className="k">引用权益</span>
                                <div className="cite-list">
                                  {r.cited_benefit_ids.map((bid) => (
                                    <span
                                      key={bid}
                                      className="cite-link"
                                      onClick={() => scrollAndHighlight('benefit', bid)}
                                    >
                                      #{bid}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="audit-section">
                {audit_logs.length === 0 ? (
                  <div className="empty-state">暂无审计记录</div>
                ) : (
                  <div className="timeline">
                    {audit_logs.map((log, i) => (
                      <div key={log.id || i} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="operator font-semibold">{log.operator?.full_name || log.operator?.username || '系统'}</span>
                            <span className="timeline-time mono">{log.created_at ? dayjs(log.created_at).format('YYYY-MM-DD HH:mm') : '-'}</span>
                          </div>
                          <div className="timeline-action">
                            <span className="action-text">{log.action || '操作'}</span>
                            {log.old_status && log.new_status && (
                              <span className="status-transition">
                                <StatusBadge status={log.old_status} type="ticket" />
                                <span className="arrow">→</span>
                                <StatusBadge status={log.new_status} type="ticket" />
                              </span>
                            )}
                          </div>
                          {log.comment && (
                            <div className="timeline-comment">{log.comment}</div>
                          )}
                          {log.evidence_urls && log.evidence_urls.length > 0 && (
                            <div className="timeline-evidence">
                              <span className="k">凭证：</span>
                              {log.evidence_urls.map((url, j) => (
                                <span
                                  key={j}
                                  className="link-text text-sm evidence-link"
                                  onClick={() => window.open(url, '_blank')}
                                >
                                  📎 附件{j + 1}
                                </span>
                              ))}
                            </div>
                          )}
                          {log.reference_ids && log.reference_ids.length > 0 && (
                            <div className="timeline-refs">
                              <span className="k">关联单据：</span>
                              {log.reference_ids.map((rid, j) => (
                                <span key={j} className="cite-link">#{rid}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 状态操作弹窗 */}
      <Modal
        visible={statusModal.visible}
        title={statusModal.title}
        onClose={() => setStatusModal({ visible: false, action: '', title: '' })}
        footer={
          <>
            <button className="btn btn-gray" onClick={() => setStatusModal({ visible: false, action: '', title: '' })}>
              取消
            </button>
            <button className="btn btn-primary" onClick={handleStatusConfirm}>
              确认
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">备注说明</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="请输入备注说明..."
            value={statusForm.remark}
            onChange={(e) => setStatusForm({ ...statusForm, remark: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">凭证URL（多个用逗号分隔）</label>
          <textarea
            className="form-textarea"
            rows={2}
            placeholder="https://..., https://..."
            value={statusForm.evidenceUrls}
            onChange={(e) => setStatusForm({ ...statusForm, evidenceUrls: e.target.value })}
          />
        </div>
      </Modal>

      {/* 新建复盘弹窗 */}
      <Modal
        visible={reviewModal}
        title="新建复盘"
        onClose={() => setReviewModal(false)}
        width={560}
        footer={
          <>
            <button className="btn btn-gray" onClick={() => setReviewModal(false)}>
              取消
            </button>
            <button className="btn btn-primary" onClick={handleReviewSubmit}>
              提交
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">复盘标签 <span style={{ color: '#F56C6C' }}>*</span></label>
            <select
              className="form-input"
              value={reviewForm.review_tag}
              onChange={(e) => setReviewForm({ ...reviewForm, review_tag: e.target.value })}
            >
              <option value="">请选择复盘标签</option>
              {REVIEW_TAG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">复盘分数（0-100）</label>
            <input
              type="number"
              min={0}
              max={100}
              className="form-input"
              placeholder="0-100"
              value={reviewForm.score || ''}
              onChange={(e) => setReviewForm({ ...reviewForm, score: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">复盘总结</label>
          <textarea
            className="form-textarea"
            rows={4}
            placeholder="请输入复盘总结..."
            value={reviewForm.summary}
            onChange={(e) => setReviewForm({ ...reviewForm, summary: e.target.value })}
          />
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">引用流水ID（多个用逗号分隔）</label>
            <input
              className="form-input"
              placeholder="例如: 1,2,3"
              value={reviewForm.cited_transaction_ids}
              onChange={(e) => setReviewForm({ ...reviewForm, cited_transaction_ids: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">引用权益ID（多个用逗号分隔）</label>
            <input
              className="form-input"
              placeholder="例如: 1,2,3"
              value={reviewForm.cited_benefit_ids}
              onChange={(e) => setReviewForm({ ...reviewForm, cited_benefit_ids: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">后续动作（每行一条）</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder={'第一行动作\n第二行动作...'}
            value={reviewForm.follow_up_actions}
            onChange={(e) => setReviewForm({ ...reviewForm, follow_up_actions: e.target.value })}
          />
        </div>
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={reviewForm.is_escalated}
              onChange={(e) => setReviewForm({ ...reviewForm, is_escalated: e.target.checked })}
            />
            <span>是否升级处理</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}

function generateMockData(id: number): TicketDetailData {
  const memberId = 1000 + (id % 100);
  const nameArr = ['李小明', '王小红', '张小强', '刘大美', '赵小刚'];
  const memberName = nameArr[id % 5];
  const respName = ['张三', '李四', '王五', '赵六'][id % 4];
  return {
    ticket: {
      id,
      ticket_no: `TK${dayjs().format('YYYYMMDD')}${String(id).padStart(4, '0')}`,
      title: ['会员投诉问题处理', '课程咨询记录', '退款申请单据', '权益兑换登记', '学习进度跟进'][id % 5],
      source: ['wechat', 'phone', 'online', 'referral', 'offline'][id % 5],
      member_id: memberId,
      amount: [999, 1999, 2999, 599, 3999][id % 5],
      description: '会员反馈购买的课程无法正常观看，已经尝试重新登录、清除缓存等操作，问题仍然存在。希望能够尽快解决，否则要求全额退款。同时询问是否有其他补偿方案。',
      evidence_urls: [
        'https://example.com/evidence/1.png',
        'https://example.com/evidence/2.png',
        'https://example.com/evidence/3.pdf',
      ],
      status: (['draft', 'pending_review', 'reviewing', 'supplement_needed', 'escalated_review', 'processing', 'completed', 'closed'] as TicketStatus[])[id % 8],
      responsible_id: 1,
      priority: [1, 2, 3, 4][id % 4],
      supplement_requirements: id % 3 === 0 ? '请补充以下资料：1. 购买凭证截图 2. 问题录屏视频 3. 会员身份证明' : undefined,
      review_tag: ['excellent', 'good', 'normal', 'needs_improvement', 'problematic'][id % 5],
      created_at: dayjs().subtract(id * 2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs().subtract(id, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      creator: { id: memberId, username: memberName, full_name: memberName },
      responsible: { id: 1, username: respName, full_name: respName },
      member: {
        id: memberId,
        user_id: memberId,
        name: memberName,
        member_no: `M${String(memberId).padStart(6, '0')}`,
        phone: `138${String(10000000 + id).slice(0, 8)}`,
        email: `user${memberId}@example.com`,
        level: (['basic', 'silver', 'gold', 'platinum', 'diamond'] as const)[id % 5],
        source_channel: ['wechat_group', 'qq_group', 'offline_activity', 'referral', 'advertisement'][id % 5],
        join_date: dayjs().subtract(30 + id, 'day').format('YYYY-MM-DD'),
        exam_score: 60 + (id * 7) % 40,
        exam_pass_status: id % 4 !== 0,
        exam_date: dayjs().subtract(15 + id, 'day').format('YYYY-MM-DD'),
        total_learning_hours: 10 + (id * 3) % 50,
        community_group: ['VIP核心群A', '学习交流群B', '高级会员群C', '新人群D'][id % 4],
        tags: [
          ['活跃', '高价值', '推荐达人'],
          ['新会员', '潜力股'],
          ['沉默用户', '需要唤醒'],
          ['投诉用户', '重点关注'],
          ['学霸', '考试达人'],
        ][id % 5],
      },
      benefit_references: [
        {
          id: 101,
          ticket_id: id,
          benefit_id: 1,
          applied_value: 99.9,
          benefit: {
            id: 1,
            rule_code: 'BR001',
            rule_name: '新手专享9折券',
            benefit_type: 'discount',
            discount_rate: 0.9,
            bonus_points: 0,
            cash_value: 0,
            is_active: true,
            applicable_levels: ['basic', 'silver'],
            description: '仅限首次购买课程使用，不与其他优惠叠加',
          },
        },
        {
          id: 102,
          ticket_id: id,
          benefit_id: 2,
          applied_value: 50,
          benefit: {
            id: 2,
            rule_code: 'BR002',
            rule_name: '会员积分奖励',
            benefit_type: 'points',
            discount_rate: 0,
            bonus_points: 500,
            cash_value: 0,
            is_active: true,
            applicable_levels: ['silver', 'gold', 'platinum', 'diamond'],
            description: '消费满1000元自动发放',
          },
        },
        {
          id: 103,
          ticket_id: id,
          benefit_id: 3,
          applied_value: 200,
          benefit: {
            id: 3,
            rule_code: 'BR003',
            rule_name: '补偿现金券',
            benefit_type: 'cash',
            discount_rate: 0,
            bonus_points: 0,
            cash_value: 200,
            is_active: true,
            applicable_levels: ['gold', 'platinum', 'diamond'],
            description: '30天内有效，满500可用',
          },
        },
      ],
      transactions: [
        {
          id: 1001,
          member_id: memberId,
          transaction_no: `TX${dayjs().format('YYYYMMDD')}001`,
          type: 'payment',
          amount: 999,
          balance_after: 2580,
          related_order_no: `ORD${id}001`,
          description: '购买高级课程套餐',
          payment_method: '微信支付',
          evidence_urls: [],
          transaction_date: dayjs().subtract(id * 2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          created_at: dayjs().subtract(id * 2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        },
        {
          id: 1002,
          member_id: memberId,
          transaction_no: `TX${dayjs().format('YYYYMMDD')}002`,
          type: 'refund',
          amount: -199.8,
          balance_after: 2380.2,
          related_order_no: `ORD${id}001`,
          description: '问题课程部分退款（20%）',
          payment_method: '原路退回',
          evidence_urls: ['https://example.com/refund/evidence.pdf'],
          transaction_date: dayjs().subtract(id, 'hour').subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
          created_at: dayjs().subtract(id, 'hour').subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
        },
        {
          id: 1003,
          member_id: memberId,
          transaction_no: `TX${dayjs().format('YYYYMMDD')}003`,
          type: 'bonus',
          amount: 200,
          balance_after: 2580.2,
          related_order_no: `ORD${id}002`,
          description: '投诉补偿奖励金',
          payment_method: '账户余额',
          evidence_urls: [],
          transaction_date: dayjs().subtract(id, 'hour').subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss'),
          created_at: dayjs().subtract(id, 'hour').subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss'),
        },
      ],
      review_records: [
        {
          id: 201,
          ticket_id: id,
          round: 1,
          is_escalated: false,
          review_tag: 'good',
          score: 85,
          summary: '会员反馈的技术问题已初步定位为CDN节点异常，已联系技术部门处理。同时给予部分退款和补偿券，会员表示接受但仍需观察后续情况。',
          evidence_urls: [],
          cited_transaction_ids: [1002, 1003],
          cited_benefit_ids: [103],
          follow_up_actions: [
            '24小时内跟进技术修复进度',
            '修复完成后主动联系会员确认',
            '3天后回访满意度',
          ],
          reviewer: { id: 1, username: '张三', full_name: '张三' },
          created_at: dayjs().subtract(id, 'hour').subtract(45, 'minute').format('YYYY-MM-DD HH:mm:ss'),
        },
        {
          id: 202,
          ticket_id: id,
          round: 2,
          is_escalated: true,
          review_tag: 'excellent',
          score: 90,
          summary: '技术部门已确认问题修复，补偿方案已执行完毕。会员已确认可正常观看，情绪稳定。',
          evidence_urls: [],
          cited_transaction_ids: [1001],
          cited_benefit_ids: [101, 102],
          follow_up_actions: [
            '一周后回访确认满意度',
            '记录为典型案例用于培训',
          ],
          reviewer: { id: 2, username: '李四', full_name: '李四' },
          created_at: dayjs().subtract(id, 'hour').subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss'),
        },
      ],
      audit_logs: [
        {
          id: 301,
          ticket_id: id,
          action: '创建单据',
          old_status: undefined,
          new_status: 'draft',
          comment: '会员自助提交问题单据',
          evidence_urls: ['https://example.com/screenshot-1.png'],
          reference_ids: undefined,
          operator: { id: memberId, username: memberName, full_name: memberName },
          created_at: dayjs().subtract(id * 2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        },
        {
          id: 302,
          ticket_id: id,
          action: '提交审核',
          old_status: 'draft',
          new_status: 'pending_review',
          comment: '确认信息无误，提交处理',
          evidence_urls: [],
          reference_ids: undefined,
          operator: { id: memberId, username: memberName, full_name: memberName },
          created_at: dayjs().subtract(id * 2, 'hour').add(10, 'minute').format('YYYY-MM-DD HH:mm:ss'),
        },
        {
          id: 303,
          ticket_id: id,
          action: '开始审核',
          old_status: 'pending_review',
          new_status: 'reviewing',
          comment: '联系会员核实情况中',
          evidence_urls: [],
          reference_ids: undefined,
          operator: { id: 1, username: '张三', full_name: '张三' },
          created_at: dayjs().subtract(id * 2, 'hour').add(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
        },
        {
          id: 304,
          ticket_id: id,
          action: '执行退款',
          old_status: 'reviewing',
          new_status: 'processing',
          comment: '执行部分退款20% + 发放补偿券',
          evidence_urls: ['https://example.com/refund-proof.pdf'],
          reference_ids: undefined,
          operator: { id: 1, username: '张三', full_name: '张三' },
          created_at: dayjs().subtract(id, 'hour').subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
        },
        {
          id: 305,
          ticket_id: id,
          action: '升级复核',
          old_status: 'processing',
          new_status: 'escalated_review',
          comment: '涉及金额超过1000元，按流程升级',
          evidence_urls: [],
          reference_ids: [id - 1 > 0 ? id - 1 : undefined].filter(Boolean) as number[],
          operator: { id: 2, username: '李四', full_name: '李四' },
          created_at: dayjs().subtract(id, 'hour').subtract(25, 'minute').format('YYYY-MM-DD HH:mm:ss'),
        },
        {
          id: 306,
          ticket_id: id,
          action: '复核通过',
          old_status: 'escalated_review',
          new_status: 'completed',
          comment: '补偿方案合理，流程规范',
          evidence_urls: [],
          reference_ids: undefined,
          operator: { id: 2, username: '李四', full_name: '李四' },
          created_at: dayjs().subtract(id, 'hour').subtract(15, 'minute').format('YYYY-MM-DD HH:mm:ss'),
        },
      ],
    },
  };
}

const detailStyles = `
.ticket-detail-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.breadcrumb-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
  color: #606266;
}
.breadcrumb-item {
  cursor: pointer;
  color: #409EFF;
}
.breadcrumb-item:hover {
  text-decoration: underline;
}
.breadcrumb-sep {
  margin: 0 8px;
  color: #c0c4cc;
}
.breadcrumb-current {
  color: #303133;
  font-weight: 500;
}

.header-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.ticket-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}
.status-badge-lg {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid transparent;
}
.ticket-meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.ticket-no {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}
.priority-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.action-row {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.info-bar {
  display: flex;
  gap: 32px;
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #f0f2f5;
  flex-wrap: wrap;
}
.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.info-label {
  font-size: 13px;
  color: #909399;
}
.info-value {
  font-size: 13px;
  color: #303133;
}

.three-column-layout {
  display: grid;
  gap: 20px;
  align-items: start;
}

.left-column,
.middle-column,
.right-column {
  min-width: 0;
}

.card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}
.card-title.no-margin {
  margin: 0;
}
.card-header-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-card {
  margin-bottom: 20px;
}
.section-card:last-child {
  margin-bottom: 0;
}

.section-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin: 0 0 12px 0;
}

.profile-section {
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px dashed #ebeef5;
}
.profile-section:last-of-type {
  border-bottom: none;
  margin-bottom: 16px;
  padding-bottom: 0;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.info-line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
}
.info-line .k {
  color: #909399;
  min-width: 60px;
  flex-shrink: 0;
}
.info-line .v {
  color: #303133;
  flex: 1;
  word-break: break-all;
}

.level-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.tag-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.color-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  border: 1px solid transparent;
}
.color-tag-sm {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}

.profile-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed #ebeef5;
}
.profile-actions .btn {
  width: 100%;
}

.btn {
  padding: 7px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  background: #fff;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.btn:hover {
  opacity: 0.88;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-sm {
  padding: 5px 12px;
  font-size: 12px;
}
.btn-primary {
  background: #409EFF;
  border-color: #409EFF;
  color: #fff;
}
.btn-success {
  background: #67C23A;
  border-color: #67C23A;
  color: #fff;
}
.btn-warning {
  background: #E6A23C;
  border-color: #E6A23C;
  color: #fff;
}
.btn-danger {
  background: #F56C6C;
  border-color: #F56C6C;
  color: #fff;
}
.btn-secondary {
  background: #909399;
  border-color: #909399;
  color: #fff;
}
.btn-gray {
  background: #f5f7fa;
  border-color: #dcdfe6;
  color: #606266;
}
.btn-purple {
  background: #8B5CF6;
  border-color: #8B5CF6;
  color: #fff;
}
.btn-link {
  background: transparent;
  border: none;
  color: #409EFF;
  padding: 4px 6px;
}

.link-text {
  color: #409EFF;
  cursor: pointer;
}
.link-text:hover {
  text-decoration: underline;
}

.text-muted { color: #909399; }
.text-success { color: #67C23A; }
.text-danger { color: #F56C6C; }
.text-warning { color: #E6A23C; }
.text-primary { color: #409EFF; }
.text-orange { color: #f97316; }
.text-pink { color: #ec4899; }
.text-teal { color: #14b8a6; }
.font-semibold { font-weight: 600; }
.text-sm { font-size: 12px; }
.mono { font-family: 'SF Mono', Menlo, Consolas, monospace; }

.benefit-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.benefit-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}
.benefit-item:hover {
  border-color: #409EFF40;
}
.benefit-item.highlight-row {
  animation: highlightBlink 0.6s ease-in-out 5;
  border-color: #409EFF;
  box-shadow: 0 0 0 2px #409EFF20;
}
@keyframes highlightBlink {
  0%, 100% { background-color: #fff; }
  50% { background-color: #409EFF20; }
}
.benefit-header {
  padding: 12px 14px;
  cursor: pointer;
  background: #fafbfc;
}
.benefit-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.benefit-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.benefit-type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}
.benefit-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
}
.benefit-value {
  font-weight: 600;
}
.benefit-used {
  color: #909399;
}
.benefit-status {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}
.benefit-status.status-active {
  background: #67C23A20;
  color: #67C23A;
}
.benefit-status.status-inactive {
  background: #90939920;
  color: #909399;
}
.benefit-detail {
  padding: 12px 14px;
  background: #fff;
  border-top: 1px solid #f0f2f5;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}
.detail-line {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}
.detail-line .k {
  color: #909399;
  flex-shrink: 0;
}
.detail-line .v {
  color: #606266;
}
.benefit-summary {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #ebeef5;
  font-size: 13px;
  color: #606266;
  text-align: right;
}

.ticket-detail-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.detail-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.detail-block .k {
  font-size: 13px;
  color: #909399;
}
.content-block {
  background: #f9fafb;
  padding: 12px 14px;
  border-radius: 6px;
  font-size: 13px;
  color: #303133;
  line-height: 1.7;
  white-space: pre-wrap;
}

.evidence-section {
  margin-top: 18px;
}
.evidence-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.evidence-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
  transition: background 0.2s;
}
.evidence-item:hover {
  background: #f0f2f5;
}
.evidence-url {
  margin-left: auto;
  color: #909399;
  font-size: 11px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.supplement-card {
  margin-top: 18px;
  padding: 14px 16px;
  background: #FDF6EC;
  border: 1px solid #F56C6C40;
  border-radius: 8px;
}
.supplement-title {
  font-size: 14px;
  font-weight: 600;
  color: #E6A23C;
  margin-bottom: 6px;
}
.supplement-content {
  font-size: 13px;
  color: #303133;
  line-height: 1.6;
}

.tx-summary-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
.tx-summary-item {
  padding: 12px 14px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tx-summary-item.income {
  background: #F0F9EB;
  border: 1px solid #67C23A40;
}
.tx-summary-item.expense {
  background: #FEF0F0;
  border: 1px solid #F56C6C40;
}
.tx-summary-label {
  font-size: 12px;
  color: #606266;
}
.tx-summary-value {
  font-size: 18px;
  font-weight: 700;
}
.tx-summary-item.income .tx-summary-value {
  color: #67C23A;
}
.tx-summary-item.expense .tx-summary-value {
  color: #F56C6C;
}

.tx-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tx-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}
.tx-item:hover {
  border-color: #409EFF40;
}
.tx-item.highlight-row {
  animation: highlightBlink 0.6s ease-in-out 5;
  border-color: #409EFF;
  box-shadow: 0 0 0 2px #409EFF20;
}
.tx-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #fafbfc;
  border-bottom: 1px solid #f0f2f5;
}
.tx-no {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}
.tx-type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}
.tx-body {
  padding: 10px 14px;
}
.tx-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.tx-row:last-child {
  margin-bottom: 0;
}
.tx-amount {
  font-size: 15px;
  font-weight: 700;
}
.tx-amount.tx-pos {
  color: #67C23A;
}
.tx-amount.tx-neg {
  color: #F56C6C;
}
.tx-balance {
  font-size: 12px;
  color: #909399;
}
.tx-meta {
  font-size: 12px;
  color: #909399;
}
.tx-method {
  color: #606266;
}
.tx-date {
  font-size: 11px;
}
.tx-desc {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #f0f2f5;
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.tab-bar {
  display: flex;
  gap: 0;
  margin: -20px -20px 16px -20px;
  padding: 0 20px;
  border-bottom: 1px solid #ebeef5;
  background: #fff;
  border-radius: 10px 10px 0 0;
  overflow: hidden;
}
.tab-btn {
  flex: 1;
  padding: 14px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.2s;
  font-weight: 500;
}
.tab-btn:hover {
  color: #409EFF;
}
.tab-btn.active {
  color: #409EFF;
  border-bottom-color: #409EFF;
}

.review-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.review-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}
.review-item:hover {
  border-color: #409EFF40;
}
.review-header {
  padding: 12px 14px;
  cursor: pointer;
  background: #fafbfc;
}
.review-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.review-round {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.escalated-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #F56C6C20;
  color: #F56C6C;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}
.review-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.review-score {
  margin-left: auto;
  padding: 2px 10px;
  background: #409EFF20;
  color: #409EFF;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}
.review-subheader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: #fff;
  border-bottom: 1px solid #f0f2f5;
  font-size: 12px;
  color: #606266;
}
.reviewer {
  font-weight: 500;
}
.review-time {
  color: #909399;
  font-size: 11px;
}
.review-detail {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.action-list {
  padding-left: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}
.cite-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.cite-link {
  display: inline-block;
  padding: 2px 10px;
  background: #409EFF15;
  color: #409EFF;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  transition: all 0.2s;
  border: 1px solid #409EFF30;
}
.cite-link:hover {
  background: #409EFF25;
  text-decoration: underline;
}

.timeline {
  position: relative;
  padding-left: 4px;
}
.timeline-item {
  position: relative;
  padding-left: 20px;
  padding-bottom: 20px;
}
.timeline-item:last-child {
  padding-bottom: 0;
}
.timeline-item::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 4px;
  bottom: -4px;
  width: 2px;
  background: #ebeef5;
}
.timeline-item:last-child::before {
  display: none;
}
.timeline-dot {
  position: absolute;
  left: -3px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #409EFF;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #409EFF40;
}
.timeline-content {
  padding-bottom: 4px;
}
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.operator {
  font-size: 13px;
  color: #303133;
}
.timeline-time {
  font-size: 11px;
  color: #909399;
}
.timeline-action {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.action-text {
  font-size: 13px;
  color: #409EFF;
  font-weight: 500;
}
.status-transition {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.status-transition .arrow {
  color: #c0c4cc;
  font-weight: bold;
}
.timeline-comment {
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 6px;
}
.timeline-evidence,
.timeline-refs {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: #606266;
  flex-wrap: wrap;
}
.timeline-evidence .k,
.timeline-refs .k {
  color: #909399;
  flex-shrink: 0;
}
.evidence-link {
  margin-right: 6px;
}

.form-group {
  margin-bottom: 16px;
}
.form-group:last-child {
  margin-bottom: 0;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
}
.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}
.form-input:focus,
.form-textarea:focus {
  border-color: #409EFF;
}
.form-textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.6;
}
.checkbox-group {
  padding: 8px 0;
}
.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #303133;
}
.checkbox-label input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

@media (max-width: 1280px) {
  .three-column-layout {
    grid-template-columns: 280px 1fr 1fr !important;
  }
}
@media (max-width: 1024px) {
  .three-column-layout {
    grid-template-columns: 1fr !important;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
}
`;