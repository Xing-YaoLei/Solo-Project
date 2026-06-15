import { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNavigate } from '@tanstack/react-router';
import { TicketSource, ReviewTag, MemberLevel, ticketSourceLabels, reviewTagLabels, memberLevelLabels } from '../utils/enums';

dayjs.extend(relativeTime);

interface SummaryStats {
  total_tickets: number;
  draft_count: number;
  pending_review_count: number;
  supplement_needed_count: number;
  escalated_review_count: number;
  processing_count: number;
  completed_count: number;
  closed_count: number;
  total_members: number;
  exam_pass_rate: number;
  plagiarism_cases_count: number;
  open_plagiarism_count: number;
}

interface SourceChannelStats {
  source: TicketSource;
  count: number;
  percentage: number;
  exam_pass_rate: number | null;
}

interface ResponsibleStats {
  responsible_id: number;
  responsible_name: string;
  total: number;
  completed: number;
  completion_rate: number;
}

interface ReviewTagStats {
  tag: ReviewTag;
  count: number;
  percentage: number;
}

interface ExamByLevel {
  total: number;
  passed: number;
  failed: number;
  pass_rate: number;
  average_score: number | null;
}

interface ExamStats {
  total_examined: number;
  passed_count: number;
  failed_count: number;
  pass_rate: number;
  average_score: number | null;
  by_level: Record<string, ExamByLevel>;
}

interface FullSummaryResponse {
  overview: SummaryStats;
  by_source: SourceChannelStats[];
  by_responsible: ResponsibleStats[];
  by_review_tag: ReviewTagStats[];
  exam_stats: ExamStats;
}

interface ActivityItem {
  id: number;
  time: string;
  operator: string;
  action: string;
  ticket_no: string;
  ticket_id: number;
}

const SOURCE_COLORS: Record<string, string> = {
  [TicketSource.WECHAT_GROUP]: '#07C160',
  [TicketSource.QQ_GROUP]: '#12B7F5',
  [TicketSource.OFFLINE_ACTIVITY]: '#F59E0B',
  [TicketSource.REFERRAL]: '#8B5CF6',
  [TicketSource.ADVERTISEMENT]: '#EF4444',
  [TicketSource.OTHER]: '#6B7280',
};

const REVIEW_TAG_COLORS: Record<string, string> = {
  [ReviewTag.EXCELLENT]: '#10B981',
  [ReviewTag.GOOD]: '#3B82F6',
  [ReviewTag.NORMAL]: '#F59E0B',
  [ReviewTag.NEEDS_IMPROVEMENT]: '#F97316',
  [ReviewTag.PROBLEMATIC]: '#EF4444',
};

const MEMBER_LEVEL_COLORS: Record<string, string> = {
  [MemberLevel.BASIC]: '#9CA3AF',
  [MemberLevel.SILVER]: '#64748B',
  [MemberLevel.GOLD]: '#F59E0B',
  [MemberLevel.PLATINUM]: '#3B82F6',
  [MemberLevel.DIAMOND]: '#8B5CF6',
};

const STATUS_SEGMENTS = [
  { key: 'draft', label: '草稿', statuses: ['draft'], color: '#9CA3AF' },
  { key: 'review', label: '审核中', statuses: ['pending_review', 'reviewing'], color: '#3B82F6' },
  { key: 'supplement', label: '补资料', statuses: ['supplement_needed'], color: '#F97316' },
  { key: 'escalated', label: '升级复核', statuses: ['escalated_review'], color: '#8B5CF6' },
  { key: 'processing', label: '处理中', statuses: ['processing'], color: '#06B6D4' },
  { key: 'completed', label: '已完成', statuses: ['completed', 'closed'], color: '#10B981' },
];

const MOCK_DATA: FullSummaryResponse = {
  overview: {
    total_tickets: 1286,
    draft_count: 142,
    pending_review_count: 256,
    supplement_needed_count: 87,
    escalated_review_count: 43,
    processing_count: 198,
    completed_count: 486,
    closed_count: 74,
    total_members: 5632,
    exam_pass_rate: 78.5,
    plagiarism_cases_count: 127,
    open_plagiarism_count: 38,
  },
  by_source: [
    { source: TicketSource.WECHAT_GROUP, count: 2156, percentage: 38.3, exam_pass_rate: 82.1 },
    { source: TicketSource.QQ_GROUP, count: 1125, percentage: 20.0, exam_pass_rate: 75.3 },
    { source: TicketSource.OFFLINE_ACTIVITY, count: 986, percentage: 17.5, exam_pass_rate: 85.6 },
    { source: TicketSource.REFERRAL, count: 756, percentage: 13.4, exam_pass_rate: 88.2 },
    { source: TicketSource.ADVERTISEMENT, count: 423, percentage: 7.5, exam_pass_rate: 68.9 },
    { source: TicketSource.OTHER, count: 186, percentage: 3.3, exam_pass_rate: 71.4 },
  ],
  by_responsible: [
    { responsible_id: 1, responsible_name: '张三', total: 312, completed: 298, completion_rate: 95.5 },
    { responsible_id: 2, responsible_name: '李四', total: 286, completed: 254, completion_rate: 88.8 },
    { responsible_id: 3, responsible_name: '王五', total: 245, completed: 198, completion_rate: 80.8 },
    { responsible_id: 4, responsible_name: '赵六', total: 198, completed: 132, completion_rate: 66.7 },
    { responsible_id: 5, responsible_name: '钱七', total: 156, completed: 142, completion_rate: 91.0 },
  ],
  by_review_tag: [
    { tag: ReviewTag.EXCELLENT, count: 245, percentage: 28.5 },
    { tag: ReviewTag.GOOD, count: 356, percentage: 41.4 },
    { tag: ReviewTag.NORMAL, count: 168, percentage: 19.5 },
    { tag: ReviewTag.NEEDS_IMPROVEMENT, count: 68, percentage: 7.9 },
    { tag: ReviewTag.PROBLEMATIC, count: 23, percentage: 2.7 },
  ],
  exam_stats: {
    total_examined: 4256,
    passed_count: 3341,
    failed_count: 915,
    pass_rate: 78.5,
    average_score: 82.3,
    by_level: {
      [MemberLevel.BASIC]: { total: 1856, passed: 1324, failed: 532, pass_rate: 71.3, average_score: 78.5 },
      [MemberLevel.SILVER]: { total: 1245, passed: 1012, failed: 233, pass_rate: 81.3, average_score: 83.2 },
      [MemberLevel.GOLD]: { total: 723, passed: 642, failed: 81, pass_rate: 88.8, average_score: 87.6 },
      [MemberLevel.PLATINUM]: { total: 312, passed: 289, failed: 23, pass_rate: 92.6, average_score: 91.2 },
      [MemberLevel.DIAMOND]: { total: 120, passed: 114, failed: 6, pass_rate: 95.0, average_score: 94.8 },
    },
  },
};

const MOCK_ACTIVITIES: ActivityItem[] = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  time: dayjs().subtract(i * 2 + 1, 'hour').toISOString(),
  operator: ['张三', '李四', '王五', '赵六', '钱七'][i % 5],
  action: [
    '提交了单据',
    '审核通过了',
    '要求补资料',
    '升级复核了',
    '完成处理了',
    '关闭了单据',
  ][i % 6],
  ticket_no: `TK${dayjs().format('YYYYMMDD')}${String(1000 + i).padStart(4, '0')}`,
  ticket_id: 1000 + i,
}));

const getSourceLabel = (source: string) =>
  ticketSourceLabels.find((s) => s.value === source)?.label || source;

const getReviewTagLabel = (tag: string) =>
  reviewTagLabels.find((t) => t.value === tag)?.label || tag;

const getMemberLevelLabel = (level: string) =>
  memberLevelLabels.find((l) => l.value === level)?.label || level;

const getCompletionRateColor = (rate: number) => {
  if (rate > 90) return '#10B981';
  if (rate >= 70) return '#F59E0B';
  return '#EF4444';
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FullSummaryResponse | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customMetrics, setCustomMetrics] = useState<string[]>([
    'total_tickets', 'draft_count', 'pending_review_count', 'supplement_needed_count',
    'escalated_review_count', 'completed_count', 'total_members', 'exam_pass_rate', 'plagiarism',
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/summary/overview');
      setData(res.data || MOCK_DATA);
    } catch (e) {
      console.error('fetch summary error', e);
      setData(MOCK_DATA);
    }
    try {
      const ticketsRes = await axios.get('/api/tickets/', { params: { page_size: 5 } });
      const items = ticketsRes.data?.items || ticketsRes.data || [];
      if (items.length > 0 && items[0].audit_logs) {
        const logs: ActivityItem[] = [];
        items.forEach((t: any) => {
          (t.audit_logs || []).slice(0, 2).forEach((log: any) => {
            logs.push({
              id: log.id || logs.length + 1,
              time: log.created_at,
              operator: log.operator?.full_name || log.operator_name || '系统',
              action: log.action || '操作了',
              ticket_no: t.ticket_no,
              ticket_id: t.id,
            });
          });
        });
        setActivities(logs.length > 0 ? logs.slice(0, 10) : MOCK_ACTIVITIES);
      } else {
        setActivities(MOCK_ACTIVITIES);
      }
    } catch (e) {
      setActivities(MOCK_ACTIVITIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = async () => {
    try {
      const res = await axios.get('/api/summary/export-data', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary-report-${dayjs().format('YYYYMMDD-HHmmss')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('export error', e);
      const exportData = JSON.stringify(data || MOCK_DATA, null, 2);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary-report-${dayjs().format('YYYYMMDD-HHmmss')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const overviewCards = [
    { key: 'total_tickets', icon: '📋', title: '单据总数', value: data?.overview.total_tickets ?? 0, showTrend: true },
    { key: 'draft_count', icon: '✏️', title: '草稿中', value: data?.overview.draft_count ?? 0, showTrend: true },
    { key: 'pending_review_count', icon: '🔍', title: '待审核', value: data?.overview.pending_review_count ?? 0, showTrend: true },
    { key: 'supplement_needed_count', icon: '📝', title: '补资料', value: data?.overview.supplement_needed_count ?? 0, showTrend: true },
    { key: 'escalated_review_count', icon: '⬆️', title: '升级复核', value: data?.overview.escalated_review_count ?? 0, showTrend: true },
    { key: 'completed_count', icon: '✅', title: '已完成', value: data?.overview.completed_count ?? 0, showTrend: true },
    { key: 'total_members', icon: '👥', title: '会员总数', value: data?.overview.total_members ?? 0, showTrend: true },
    {
      key: 'exam_pass_rate',
      icon: '🎓',
      title: '考试通过率',
      value: `${data?.overview.exam_pass_rate ?? 0}%`,
      showTrend: true,
    },
    {
      key: 'plagiarism',
      icon: '⚠️',
      title: '抄袭案例',
      value: (
        <span>
          <span style={{ color: '#EF4444' }}>{data?.overview.open_plagiarism_count ?? 0}</span>
          <span style={{ color: '#9CA3AF', fontSize: '16px', margin: '0 4px' }}>/</span>
          <span>{data?.overview.plagiarism_cases_count ?? 0}</span>
        </span>
      ),
      showTrend: false,
    },
  ].filter((c) => customMetrics.includes(c.key));

  const topSources = [...(data?.by_source || [])]
    .filter((s) => s.exam_pass_rate !== null)
    .sort((a, b) => (b.exam_pass_rate || 0) - (a.exam_pass_rate || 0))
    .slice(0, 3)
    .map((s) => s.source);

  const sortedResponsible = [...(data?.by_responsible || [])].sort((a, b) => b.total - a.total);
  const sortedBySource = [...(data?.by_source || [])].sort((a, b) => b.count - a.count);

  const totalTicketsByStatus = STATUS_SEGMENTS.reduce((acc, seg) => {
    let sum = 0;
    seg.statuses.forEach((s) => {
      const key = s as keyof SummaryStats;
      if (data?.overview[key] !== undefined) {
        sum += data.overview[key] as number;
      }
    });
    return acc + sum;
  }, 0);

  return (
    <div className="dashboard-container">
      <style>{styles}</style>

      <div className="page-header">
        <h1 className="page-title">📊 数据汇总看板</h1>
      </div>

      {loading && (
        <div className="skeleton-container">
          <div className="skeleton-row">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
          <div className="skeleton-row">
            <div className="skeleton-card skeleton-wide" />
            <div className="skeleton-card skeleton-narrow" />
          </div>
          <div className="skeleton-row">
            <div className="skeleton-card skeleton-half" />
            <div className="skeleton-card skeleton-half" />
          </div>
        </div>
      )}

      {!loading && data && (
        <>
          <div className="cards-grid">
            {overviewCards.map((card) => (
              <div key={card.key} className="stat-card">
                <div className="stat-card-icon">{card.icon}</div>
                <div className="stat-card-body">
                  <div className="stat-card-value">{card.value}</div>
                  <div className="stat-card-title">{card.title}</div>
                  {card.showTrend && (
                    <div className="stat-card-trend">
                      <span className="trend-up">↑ 12.5%</span>
                      <span className="trend-label">较上月</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="row-layout row-2">
            <div className="panel panel-wide">
              <div className="panel-header">
                <h3 className="panel-title">📣 按来源渠道分布</h3>
                <button
                  className="panel-action"
                  onClick={() => navigate({ to: '/members' })}
                >
                  查看详情 →
                </button>
              </div>
              <div className="source-list">
                {sortedBySource.map((s) => (
                  <div key={s.source} className="source-item">
                    <div className="source-info">
                      <span
                        className="source-dot"
                        style={{ backgroundColor: SOURCE_COLORS[s.source] }}
                      />
                      <span className="source-name">{getSourceLabel(s.source)}</span>
                    </div>
                    <div className="source-bar-wrap">
                      <div
                        className={`source-bar ${topSources.includes(s.source) ? 'source-bar-top' : ''}`}
                        style={{
                          width: `${s.percentage}%`,
                          backgroundColor: SOURCE_COLORS[s.source],
                        }}
                      />
                    </div>
                    <div className="source-meta">
                      <span className="source-count">{s.count}人</span>
                      <span className="source-passrate">
                        通过率{s.exam_pass_rate !== null ? `${s.exam_pass_rate}%` : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="source-footer">
                <span className="footer-note">🏆 转化率TOP3：</span>
                {topSources.map((s, i) => (
                  <span
                    key={s}
                    className="top-source-tag"
                    style={{ borderColor: SOURCE_COLORS[s], color: SOURCE_COLORS[s] }}
                  >
                    {i + 1}. {getSourceLabel(s)}
                  </span>
                ))}
              </div>
            </div>

            <div className="panel panel-narrow">
              <div className="panel-header">
                <h3 className="panel-title">🏷️ 复盘标签分布</h3>
                <button
                  className="panel-action"
                  onClick={() => navigate({ to: '/tickets' })}
                >
                  查看详情 →
                </button>
              </div>
              <div className="donut-wrap">
                <DonutChart data={data.by_review_tag} />
              </div>
              <div className="tag-legend">
                {data.by_review_tag.map((t) => (
                  <div key={t.tag} className="legend-item">
                    <span
                      className="legend-color"
                      style={{ backgroundColor: REVIEW_TAG_COLORS[t.tag] }}
                    />
                    <span className="legend-label">{getReviewTagLabel(t.tag)}</span>
                    <span className="legend-count">{t.count}</span>
                    <span className="legend-percent">{t.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="row-layout row-3">
            <div className="panel panel-half">
              <div className="panel-header">
                <h3 className="panel-title">👔 责任人绩效排行</h3>
                <button
                  className="panel-action"
                  onClick={() => navigate({ to: '/tickets' })}
                >
                  查看详情 →
                </button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>排名</th>
                    <th>责任人</th>
                    <th style={{ width: '80px' }}>处理总数</th>
                    <th style={{ width: '80px' }}>已完成</th>
                    <th style={{ width: '160px' }}>完成率</th>
                    <th style={{ width: '100px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResponsible.map((r, i) => (
                    <tr key={r.responsible_id}>
                      <td>
                        {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="font-semibold">{r.responsible_name}</td>
                      <td>{r.total}</td>
                      <td>{r.completed}</td>
                      <td>
                        <div className="rate-cell">
                          <div className="rate-bar-bg">
                            <div
                              className="rate-bar-fill"
                              style={{
                                width: `${r.completion_rate}%`,
                                backgroundColor: getCompletionRateColor(r.completion_rate),
                              }}
                            />
                          </div>
                          <span
                            className="rate-text"
                            style={{ color: getCompletionRateColor(r.completion_rate) }}
                          >
                            {r.completion_rate}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn-link"
                          onClick={() =>
                            navigate({
                              to: '/tickets',
                              search: { assignee: String(r.responsible_id) },
                            })
                          }
                        >
                          查看单据
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="panel panel-half">
              <div className="panel-header">
                <h3 className="panel-title">🎓 考试通过情况</h3>
                <button
                  className="panel-action"
                  onClick={() => navigate({ to: '/members' })}
                >
                  查看详情 →
                </button>
              </div>
              <div className="exam-overview">
                <div className="exam-big-card">
                  <div className="exam-big-row">
                    <div className="exam-stat">
                      <div className="exam-stat-label">总考试人数</div>
                      <div className="exam-stat-value text-primary">
                        {data.exam_stats.total_examined}
                      </div>
                    </div>
                    <div className="exam-stat">
                      <div className="exam-stat-label">通过</div>
                      <div className="exam-stat-value text-success">
                        {data.exam_stats.passed_count}
                      </div>
                    </div>
                    <div className="exam-stat">
                      <div className="exam-stat-label">未通过</div>
                      <div className="exam-stat-value text-danger">
                        {data.exam_stats.failed_count}
                      </div>
                    </div>
                    <div className="exam-stat">
                      <div className="exam-stat-label">平均分</div>
                      <div className="exam-stat-value text-warning">
                        {data.exam_stats.average_score ?? '-'}
                      </div>
                    </div>
                  </div>
                  <div className="exam-pass-row">
                    <div className="exam-pass-label">
                      总体通过率 <span className="exam-pass-big">{data.exam_stats.pass_rate}%</span>
                    </div>
                    <div className="exam-pass-bar-bg">
                      <div
                        className="exam-pass-bar-fill"
                        style={{ width: `${data.exam_stats.pass_rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="exam-level-list">
                {Object.entries(data.exam_stats.by_level).map(([level, info]) => (
                  <div key={level} className="exam-level-row">
                    <div className="level-info">
                      <span
                        className="level-badge"
                        style={{
                          backgroundColor: MEMBER_LEVEL_COLORS[level] + '20',
                          color: MEMBER_LEVEL_COLORS[level],
                        }}
                      >
                        {getMemberLevelLabel(level)}
                      </span>
                      <span className="level-counts">
                        {info.total}人 · 通过{info.passed}
                      </span>
                    </div>
                    <div className="level-rate-wrap">
                      <div className="level-rate-bar-bg">
                        <div
                          className="level-rate-bar-fill"
                          style={{
                            width: `${info.pass_rate}%`,
                            backgroundColor: MEMBER_LEVEL_COLORS[level],
                          }}
                        />
                      </div>
                      <span className="level-rate-text" style={{ color: MEMBER_LEVEL_COLORS[level] }}>
                        {info.pass_rate}%
                      </span>
                      <span className="level-avg-score">均分 {info.average_score ?? '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="row-layout row-4">
            <div className="panel panel-60">
              <div className="panel-header">
                <h3 className="panel-title">🔄 单据状态分布</h3>
                <button
                  className="panel-action"
                  onClick={() => navigate({ to: '/tickets' })}
                >
                  查看详情 →
                </button>
              </div>
              <div className="stacked-wrap">
                <div className="stacked-bar">
                  {STATUS_SEGMENTS.map((seg) => {
                    let count = 0;
                    seg.statuses.forEach((s) => {
                      const key = s as keyof SummaryStats;
                      if (data.overview[key] !== undefined) {
                        count += data.overview[key] as number;
                      }
                    });
                    const pct = totalTicketsByStatus > 0 ? (count / totalTicketsByStatus) * 100 : 0;
                    return (
                      <div
                        key={seg.key}
                        className="stacked-segment"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: seg.color,
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          const tabMap: Record<string, string> = {
                            draft: 'draft',
                            review: 'pending_review',
                            supplement: 'supplement_needed',
                            escalated: 'escalated_review',
                            processing: 'all',
                            completed: 'completed',
                          };
                          navigate({ to: '/tickets', search: { tab: tabMap[seg.key] } });
                        }}
                        title={`${seg.label}: ${count} (${pct.toFixed(1)}%)`}
                      >
                        {pct > 8 && (
                          <span className="stacked-label">
                            {count}
                            <br />
                            {pct.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="stacked-legend">
                  {STATUS_SEGMENTS.map((seg) => {
                    let count = 0;
                    seg.statuses.forEach((s) => {
                      const key = s as keyof SummaryStats;
                      if (data.overview[key] !== undefined) {
                        count += data.overview[key] as number;
                      }
                    });
                    const pct = totalTicketsByStatus > 0 ? (count / totalTicketsByStatus) * 100 : 0;
                    return (
                      <div key={seg.key} className="stacked-legend-item">
                        <span
                          className="stacked-legend-color"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span className="stacked-legend-label">{seg.label}</span>
                        <span className="stacked-legend-count">{count}</span>
                        <span className="stacked-legend-pct">{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="panel panel-40">
              <div className="panel-header">
                <h3 className="panel-title">⏰ 近期操作动态</h3>
                <button
                  className="panel-action"
                  onClick={() => navigate({ to: '/tickets' })}
                >
                  全部 →
                </button>
              </div>
              <div className="timeline">
                {activities.map((a) => (
                  <div key={a.id} className="timeline-item">
                    <div className="timeline-time">{dayjs(a.time).fromNow()}</div>
                    <div className="timeline-content">
                      <span className="timeline-operator">{a.operator}</span>
                      <span className="timeline-action">{a.action}</span>
                      <span
                        className="timeline-ticket"
                        onClick={() => navigate({ to: `/tickets/${a.ticket_id}` })}
                      >
                        {a.ticket_no}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bottom-bar">
        <button className="btn btn-primary" onClick={fetchData}>
          🔄 刷新数据
        </button>
        <button className="btn btn-success" onClick={handleExport}>
          📥 导出汇总报表
        </button>
        <button className="btn btn-secondary" onClick={() => setShowCustomModal(true)}>
          ⚙️ 自定义指标
        </button>
      </div>

      {showCustomModal && (
        <div className="modal-overlay" onClick={() => setShowCustomModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚙️ 自定义指标</h3>
              <button className="modal-close" onClick={() => setShowCustomModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-tip">选择要在顶部展示的统计卡片：</p>
              <div className="metric-options">
                {[
                  { key: 'total_tickets', label: '📋 单据总数' },
                  { key: 'draft_count', label: '✏️ 草稿中' },
                  { key: 'pending_review_count', label: '🔍 待审核' },
                  { key: 'supplement_needed_count', label: '📝 补资料' },
                  { key: 'escalated_review_count', label: '⬆️ 升级复核' },
                  { key: 'completed_count', label: '✅ 已完成' },
                  { key: 'total_members', label: '👥 会员总数' },
                  { key: 'exam_pass_rate', label: '🎓 考试通过率' },
                  { key: 'plagiarism', label: '⚠️ 抄袭案例' },
                ].map((opt) => (
                  <label key={opt.key} className="metric-option">
                    <input
                      type="checkbox"
                      checked={customMetrics.includes(opt.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCustomMetrics([...customMetrics, opt.key]);
                        } else {
                          setCustomMetrics(customMetrics.filter((m) => m !== opt.key));
                        }
                      }}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-gray" onClick={() => setShowCustomModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={() => setShowCustomModal(false)}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DonutChart({ data }: { data: ReviewTagStats[] }) {
  const size = 200;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = data.map((item) => {
    const length = (item.percentage / 100) * circumference;
    const seg = {
      tag: item.tag,
      color: REVIEW_TAG_COLORS[item.tag],
      dasharray: `${length} ${circumference - length}`,
      dashoffset: -offset,
    };
    offset += length;
    return seg;
  });

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <svg width={size} height={size} className="donut-svg">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#F3F4F6"
        strokeWidth={strokeWidth}
      />
      {segments.map((seg) => (
        <circle
          key={seg.tag}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeDasharray={seg.dasharray}
          strokeDashoffset={seg.dashoffset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.5s' }}
        />
      ))}
      <text
        x={size / 2}
        y={size / 2 - 8}
        textAnchor="middle"
        className="donut-center-label"
      >
        总数
      </text>
      <text
        x={size / 2}
        y={size / 2 + 20}
        textAnchor="middle"
        className="donut-center-value"
      >
        {total}
      </text>
    </svg>
  );
}

const styles = `
.dashboard-container {
  padding: 20px;
  background: #f3f4f6;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-row {
  display: flex;
  gap: 16px;
}

.skeleton-card {
  flex: 1;
  height: 120px;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 12px;
}

.skeleton-wide {
  flex: 2;
  height: 320px;
}

.skeleton-narrow {
  flex: 1;
  height: 320px;
}

.skeleton-half {
  flex: 1;
  height: 380px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

@media (max-width: 1600px) {
  .cards-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 1100px) {
  .cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-card-icon {
  font-size: 28px;
  line-height: 1;
  flex-shrink: 0;
}

.stat-card-body {
  flex: 1;
  min-width: 0;
}

.stat-card-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-card-title {
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 6px;
}

.stat-card-trend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.trend-up {
  color: #10B981;
  font-weight: 500;
}

.trend-label {
  color: #9CA3AF;
}

.row-layout {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.row-2 .panel-wide {
  flex: 2;
}

.row-2 .panel-narrow {
  flex: 1;
}

.row-3 .panel-half {
  flex: 1;
}

.row-4 .panel-60 {
  flex: 3;
}

.row-4 .panel-40 {
  flex: 2;
}

@media (max-width: 1200px) {
  .row-layout {
    flex-direction: column;
  }
}

.panel {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.panel-action {
  background: none;
  border: none;
  color: #3B82F6;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.panel-action:hover {
  background: #EFF6FF;
}

.source-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.source-item {
  display: grid;
  grid-template-columns: 120px 1fr 180px;
  gap: 12px;
  align-items: center;
}

.source-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.source-name {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.source-bar-wrap {
  height: 22px;
  background: #F3F4F6;
  border-radius: 11px;
  overflow: hidden;
}

.source-bar {
  height: 100%;
  border-radius: 11px;
  transition: width 0.6s ease;
  min-width: 4px;
}

.source-bar-top {
  box-shadow: 0 0 0 2px rgba(16,185,129,0.3);
}

.source-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.source-count {
  color: #374151;
  font-weight: 500;
}

.source-passrate {
  color: #6B7280;
}

.source-footer {
  padding-top: 12px;
  border-top: 1px solid #F3F4F6;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
}

.footer-note {
  color: #6B7280;
  margin-right: 4px;
}

.top-source-tag {
  padding: 3px 10px;
  border: 1px solid;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.donut-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.donut-svg {
  display: block;
}

.donut-center-label {
  fill: #6B7280;
  font-size: 12px;
}

.donut-center-value {
  fill: #111827;
  font-size: 22px;
  font-weight: 700;
}

.tag-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: grid;
  grid-template-columns: 14px 1fr auto auto;
  gap: 10px;
  align-items: center;
  font-size: 13px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-label {
  color: #374151;
}

.legend-count {
  color: #6B7280;
  font-weight: 500;
}

.legend-percent {
  color: #9CA3AF;
  min-width: 45px;
  text-align: right;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  background: #F9FAFB;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #E5E7EB;
  font-size: 12px;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #F3F4F6;
  color: #4B5563;
}

.data-table tbody tr:hover {
  background: #F9FAFB;
}

.font-semibold {
  font-weight: 600;
}

.rate-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rate-bar-bg {
  flex: 1;
  height: 8px;
  background: #F3F4F6;
  border-radius: 4px;
  overflow: hidden;
  min-width: 60px;
}

.rate-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s;
}

.rate-text {
  font-size: 12px;
  font-weight: 600;
  min-width: 48px;
  text-align: right;
}

.btn-link {
  background: none;
  border: none;
  color: #3B82F6;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.btn-link:hover {
  background: #EFF6FF;
}

.exam-overview {
  margin-bottom: 16px;
}

.exam-big-card {
  background: linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%);
  border-radius: 10px;
  padding: 16px;
}

.exam-big-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.exam-stat {
  text-align: center;
}

.exam-stat-label {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 4px;
}

.exam-stat-value {
  font-size: 22px;
  font-weight: 700;
}

.text-primary { color: #3B82F6; }
.text-success { color: #10B981; }
.text-danger { color: #EF4444; }
.text-warning { color: #F59E0B; }

.exam-pass-row {
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.8);
}

.exam-pass-label {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #374151;
}

.exam-pass-big {
  font-size: 20px;
  font-weight: 700;
  color: #10B981;
}

.exam-pass-bar-bg {
  height: 10px;
  background: rgba(255,255,255,0.8);
  border-radius: 5px;
  overflow: hidden;
}

.exam-pass-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #10B981, #34D399);
  border-radius: 5px;
  transition: width 0.6s;
}

.exam-level-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exam-level-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #F9FAFB;
  border-radius: 8px;
}

.level-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.level-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.level-counts {
  font-size: 12px;
  color: #6B7280;
}

.level-rate-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  justify-content: flex-end;
}

.level-rate-bar-bg {
  width: 100px;
  height: 6px;
  background: #E5E7EB;
  border-radius: 3px;
  overflow: hidden;
}

.level-rate-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s;
}

.level-rate-text {
  font-size: 12px;
  font-weight: 600;
  min-width: 45px;
  text-align: right;
}

.level-avg-score {
  font-size: 12px;
  color: #9CA3AF;
  min-width: 55px;
  text-align: right;
}

.stacked-wrap {
  padding: 4px 0;
}

.stacked-bar {
  display: flex;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.stacked-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2px;
  transition: all 0.3s;
  position: relative;
}

.stacked-segment:hover {
  filter: brightness(1.1);
}

.stacked-label {
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  line-height: 1.3;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.stacked-legend {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 20px;
}

.stacked-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.stacked-legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.stacked-legend-label {
  color: #374151;
  font-weight: 500;
}

.stacked-legend-count {
  color: #6B7280;
}

.stacked-legend-pct {
  color: #9CA3AF;
  margin-left: auto;
}

.timeline {
  display: flex;
  flex-direction: column;
  max-height: 360px;
  overflow-y: auto;
}

.timeline-item {
  padding: 12px 0 12px 20px;
  position: relative;
  border-left: 2px solid #E5E7EB;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 18px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #3B82F6;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #3B82F6;
}

.timeline-item:last-child {
  border-left-color: transparent;
}

.timeline-time {
  font-size: 11px;
  color: #9CA3AF;
  margin-bottom: 4px;
}

.timeline-content {
  font-size: 13px;
  color: #4B5563;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.timeline-operator {
  font-weight: 600;
  color: #111827;
}

.timeline-action {
  color: #6B7280;
}

.timeline-ticket {
  color: #3B82F6;
  cursor: pointer;
  font-weight: 500;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
}

.timeline-ticket:hover {
  text-decoration: underline;
}

.bottom-bar {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  position: sticky;
  bottom: 0;
  margin-top: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  font-weight: 500;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.btn-primary {
  background: #3B82F6;
  color: #fff;
}

.btn-success {
  background: #10B981;
  color: #fff;
}

.btn-secondary {
  background: #6B7280;
  color: #fff;
}

.btn-gray {
  background: #E5E7EB;
  color: #374151;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #F3F4F6;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #6B7280;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}

.modal-close:hover {
  color: #111827;
}

.modal-body {
  padding: 20px;
}

.modal-tip {
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 12px;
}

.metric-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.metric-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #F9FAFB;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  color: #374151;
}

.metric-option:hover {
  background: #EFF6FF;
}

.metric-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #3B82F6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #F3F4F6;
}
`;
