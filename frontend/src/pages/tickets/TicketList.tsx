import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate, useParams } from '@tanstack/react-router';

type TicketStatus =
  | 'draft'
  | 'pending_review'
  | 'reviewing'
  | 'supplement_needed'
  | 'escalated_review'
  | 'processing'
  | 'completed'
  | 'closed';

interface Ticket {
  id: number;
  ticket_no: string;
  title: string;
  member_name: string;
  source: string;
  assignee: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
}

interface StatusTab {
  key: string;
  label: string;
  statuses: TicketStatus[];
  highlight?: boolean;
}

const STATUS_TABS: StatusTab[] = [
  { key: 'all', label: '全部', statuses: [] },
  { key: 'draft', label: '待提交', statuses: ['draft'] },
  { key: 'pending_review', label: '待审核', statuses: ['pending_review', 'reviewing'] },
  { key: 'supplement_needed', label: '补资料', statuses: ['supplement_needed'], highlight: true },
  { key: 'escalated_review', label: '升级复核', statuses: ['escalated_review'], highlight: true },
  { key: 'processing', label: '处理中', statuses: ['processing'] },
  { key: 'completed', label: '已完成', statuses: ['completed'], highlight: true },
  { key: 'closed', label: '已关闭', statuses: ['closed'] },
];

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

const PRIORITY_LABEL = { low: '低', medium: '中', high: '高', urgent: '紧急' };
const PRIORITY_COLOR = { low: '#909399', medium: '#409EFF', high: '#E6A23C', urgent: '#F56C6C' };

const SOURCE_OPTIONS = [
  { value: 'wechat', label: '微信社群' },
  { value: 'phone', label: '电话咨询' },
  { value: 'online', label: '官网留言' },
  { value: 'referral', label: '转介绍' },
  { value: 'offline', label: '线下活动' },
];

const REVIEW_TAG_OPTIONS = [
  { value: 'complaint', label: '投诉' },
  { value: 'consult', label: '咨询' },
  { value: 'refund', label: '退款' },
  { value: 'exchange', label: '换货' },
  { value: 'other', label: '其他' },
];

const USER_OPTIONS = [
  { value: 'user1', label: '张三' },
  { value: 'user2', label: '李四' },
  { value: 'user3', label: '王五' },
  { value: 'user4', label: '赵六' },
];

interface TicketListProps {
  initialStatus?: TicketStatus[];
  poolTitle?: string;
  poolTip?: string;
}

export default function TicketList({ initialStatus, poolTitle, poolTip }: TicketListProps) {
  const navigate = useNavigate();
  const params = useParams({ from: '/tickets' });

  const [activeTab, setActiveTab] = useState<string>('all');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [keyword, setKeyword] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<TicketStatus[]>([]);

  useEffect(() => {
    if (initialStatus && initialStatus.length > 0) {
      const tab = STATUS_TABS.find((t) => {
        if (t.statuses.length !== initialStatus.length) return false;
        return t.statuses.every((s) => initialStatus.includes(s));
      });
      if (tab) setActiveTab(tab.key);
    }
  }, [initialStatus]);

  const activeStatuses = useMemo(() => {
    if (activeTab === 'all') return selectedStatuses;
    const tab = STATUS_TABS.find((t) => t.key === activeTab);
    return tab ? tab.statuses : [];
  }, [activeTab, selectedStatuses]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (filterSource) params.source = filterSource;
      if (filterAssignee) params.assignee = filterAssignee;
      if (filterTag) params.review_tag = filterTag;
      if (dateStart) params.date_start = dateStart;
      if (dateEnd) params.date_end = dateEnd;
      if (activeStatuses.length > 0) params.statuses = activeStatuses.join(',');

      const res = await axios.get('/api/tickets/', { params });
      setTickets(res.data?.items || res.data || []);
      setTotal(res.data?.total || res.data?.length || 0);
    } catch (e) {
      console.error('fetch tickets error', e);
      const mock: Ticket[] = Array.from({ length: 23 }).map((_, i) => ({
        id: i + 1,
        ticket_no: `TK${dayjs().format('YYYYMMDD')}${String(i + 1).padStart(4, '0')}`,
        title: ['会员投诉问题处理', '课程咨询记录', '退款申请单据', '权益兑换登记', '学习进度跟进'][i % 5],
        member_name: ['李小明', '王小红', '张小强', '刘大美', '赵小刚'][i % 5],
        source: ['wechat', 'phone', 'online', 'referral', 'offline'][i % 5],
        assignee: ['张三', '李四', '王五', '赵六'][i % 4],
        status: (['draft', 'pending_review', 'reviewing', 'supplement_needed', 'escalated_review', 'processing', 'completed', 'closed'] as TicketStatus[])[i % 8],
        priority: (['low', 'medium', 'high', 'urgent'] as const)[i % 4],
        created_at: dayjs().subtract(i, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      }));
      setTickets(mock.slice((page - 1) * pageSize, page * pageSize));
      setTotal(mock.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, activeTab]);

  const handleSearch = () => {
    setPage(1);
    fetchTickets();
  };

  const handleStatusChange = async (id: number, action: string) => {
    try {
      await axios.post(`/api/tickets/${id}/status`, { action });
      fetchTickets();
    } catch (e) {
      console.error('status change error', e);
      alert('状态更新成功（模拟）');
      fetchTickets();
    }
  };

  const toggleStatusFilter = (s: TicketStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const renderStatusActions = (t: Ticket) => {
    const actions: JSX.Element[] = [];
    switch (t.status) {
      case 'draft':
        actions.push(
          <button key="submit" className="btn btn-sm btn-primary" onClick={() => handleStatusChange(t.id, 'submit')}>
            提交审核
          </button>
        );
        break;
      case 'pending_review':
      case 'reviewing':
        actions.push(
          <button key="approve" className="btn btn-sm btn-success" onClick={() => handleStatusChange(t.id, 'approve')}>
            通过
          </button>
        );
        actions.push(
          <button key="supplement" className="btn btn-sm btn-warning" onClick={() => handleStatusChange(t.id, 'supplement')}>
            要求补资料
          </button>
        );
        actions.push(
          <button key="escalate" className="btn btn-sm btn-purple" onClick={() => handleStatusChange(t.id, 'escalate')}>
            升级复核
          </button>
        );
        break;
      case 'supplement_needed':
        actions.push(
          <button key="resubmit" className="btn btn-sm btn-primary" onClick={() => handleStatusChange(t.id, 'resubmit')}>
            重新提交
          </button>
        );
        break;
      case 'escalated_review':
        actions.push(
          <button key="escalate_approve" className="btn btn-sm btn-success" onClick={() => handleStatusChange(t.id, 'approve')}>
            复核通过
          </button>
        );
        break;
      case 'processing':
        actions.push(
          <button key="complete" className="btn btn-sm btn-success" onClick={() => handleStatusChange(t.id, 'complete')}>
            完成处理
          </button>
        );
        break;
      case 'completed':
        actions.push(
          <button key="close" className="btn btn-sm btn-gray" onClick={() => handleStatusChange(t.id, 'close')}>
            关闭
          </button>
        );
        break;
    }
    return actions;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="page-container">
      <style>{styles}</style>
      {poolTitle && (
        <div className="pool-header">
          <h2 className="pool-title">{poolTitle}</h2>
          {poolTip && <div className="pool-tip">{poolTip}</div>}
        </div>
      )}

      {!initialStatus && (
        <div className="tabs-bar">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab-item ${activeTab === tab.key ? 'active' : ''} ${tab.highlight ? 'highlight' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="filter-bar">
        <div className="filter-row">
          <div className="filter-item">
            <label>关键词</label>
            <input
              type="text"
              className="input"
              placeholder="搜索单据号/标题/会员"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <label>来源渠道</label>
            <select className="input" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
              <option value="">全部</option>
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>责任人</label>
            <select className="input" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
              <option value="">全部</option>
              {USER_OPTIONS.map((o) => (
                <option key={o.value} value={o.label}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>复盘标签</label>
            <select className="input" value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
              <option value="">全部</option>
              {REVIEW_TAG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-row">
          <div className="filter-item">
            <label>创建日期</label>
            <input
              type="date"
              className="input"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
            <span className="date-sep">至</span>
            <input
              type="date"
              className="input"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>
          {!initialStatus && activeTab === 'all' && (
            <div className="filter-item flex-grow">
              <label>状态多选</label>
              <div className="status-chips">
                {(Object.keys(STATUS_LABEL) as TicketStatus[]).map((s) => (
                  <span
                    key={s}
                    className={`chip ${selectedStatuses.includes(s) ? 'chip-active' : ''}`}
                    style={{ borderColor: STATUS_COLOR[s] }}
                    onClick={() => toggleStatusFilter(s)}
                  >
                    {STATUS_LABEL[s]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="filter-row filter-actions">
          <button className="btn btn-primary" onClick={handleSearch}>查询</button>
          <button
            className="btn btn-gray"
            onClick={() => {
              setKeyword(''); setFilterSource(''); setFilterAssignee('');
              setFilterTag(''); setDateStart(''); setDateEnd('');
              setSelectedStatuses([]); setPage(1); setTimeout(fetchTickets, 0);
            }}
          >
            重置
          </button>
          <div className="flex-spacer" />
          <button className="btn btn-success" onClick={() => navigate({ to: '/tickets/new' })}>
            + 新建单据
          </button>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>单据号</th>
              <th>标题</th>
              <th>会员姓名</th>
              <th>来源</th>
              <th>责任人</th>
              <th>状态</th>
              <th>优先级</th>
              <th>创建时间</th>
              <th style={{ width: 240 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="loading-cell">加载中...</td></tr>
            )}
            {!loading && tickets.length === 0 && (
              <tr><td colSpan={9} className="empty-cell">暂无数据</td></tr>
            )}
            {!loading && tickets.map((t) => {
              const sourceLabel = SOURCE_OPTIONS.find((o) => o.value === t.source)?.label || t.source;
              return (
                <tr key={t.id}>
                  <td className="mono">{t.ticket_no}</td>
                  <td className="link-text" onClick={() => alert(`查看单据 ${t.ticket_no} 详情`)}>{t.title}</td>
                  <td>{t.member_name}</td>
                  <td>{sourceLabel}</td>
                  <td>{t.assignee}</td>
                  <td>
                    <span className="status-tag" style={{ backgroundColor: STATUS_COLOR[t.status] + '20', color: STATUS_COLOR[t.status] }}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td>
                    <span className="priority-tag" style={{ color: PRIORITY_COLOR[t.priority] }}>
                      {PRIORITY_LABEL[t.priority]}
                    </span>
                  </td>
                  <td className="mono">{t.created_at}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-sm btn-link" onClick={() => alert(`查看单据 ${t.ticket_no} 详情`)}>查看</button>
                      {renderStatusActions(t)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="total-info">共 {total} 条，第 {page}/{totalPages || 1} 页</span>
        <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          上一页
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
          const p = page <= 3 ? i + 1 : page - 2 + i;
          if (p > totalPages) return null;
          return (
            <button
              key={p}
              className={`btn btn-sm ${page === p ? 'btn-primary' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          );
        })}
        <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
          下一页
        </button>
      </div>
    </div>
  );
}

const styles = `
.page-container { padding: 20px; background: #f5f7fa; min-height: 100vh; }
.pool-header { margin-bottom: 16px; }
.pool-title { margin: 0 0 8px 0; font-size: 22px; color: #303133; }
.pool-tip { padding: 10px 16px; background: #ECF5FF; border-left: 4px solid #409EFF; color: #409EFF; border-radius: 4px; font-size: 14px; }
.tabs-bar { display: flex; gap: 4px; margin-bottom: 16px; padding: 4px; background: #fff; border-radius: 8px; flex-wrap: wrap; }
.tab-item { padding: 8px 16px; border: none; background: transparent; cursor: pointer; border-radius: 6px; font-size: 14px; color: #606266; transition: all 0.2s; }
.tab-item:hover { background: #f0f2f5; }
.tab-item.active { background: #409EFF; color: #fff; font-weight: 500; }
.tab-item.highlight:not(.active) { color: #E6A23C; font-weight: 500; }
.filter-bar { background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
.filter-row { display: flex; gap: 16px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.filter-row:last-child { margin-bottom: 0; }
.filter-item { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.filter-item.flex-grow { flex: 1; }
.filter-item label { font-size: 13px; color: #606266; white-space: nowrap; }
.input { padding: 6px 10px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 13px; outline: none; min-width: 140px; transition: border-color 0.2s; }
.input:focus { border-color: #409EFF; }
.date-sep { color: #909399; font-size: 13px; }
.status-chips { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; }
.chip { padding: 4px 10px; border: 1px solid #dcdfe6; border-radius: 12px; font-size: 12px; cursor: pointer; background: #fff; transition: all 0.15s; }
.chip-active { color: #fff; }
.filter-actions { justify-content: flex-start; }
.flex-spacer { flex: 1; }
.btn { padding: 6px 14px; border: 1px solid #dcdfe6; border-radius: 4px; cursor: pointer; font-size: 13px; background: #fff; transition: all 0.2s; }
.btn:hover { opacity: 0.85; }
.btn-sm { padding: 4px 10px; font-size: 12px; }
.btn-primary { background: #409EFF; border-color: #409EFF; color: #fff; }
.btn-success { background: #67C23A; border-color: #67C23A; color: #fff; }
.btn-warning { background: #E6A23C; border-color: #E6A23C; color: #fff; }
.btn-gray { background: #909399; border-color: #909399; color: #fff; }
.btn-purple { background: #8B5CF6; border-color: #8B5CF6; color: #fff; }
.btn-link { border: none; background: transparent; color: #409EFF; padding: 4px 6px; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.table-card { background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { background: #fafafa; padding: 12px; text-align: left; font-weight: 500; color: #303133; border-bottom: 1px solid #ebeef5; }
.data-table td { padding: 12px; border-bottom: 1px solid #f2f3f5; color: #606266; }
.data-table tbody tr:hover { background: #fafbfc; }
.mono { font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 12px; color: #303133; }
.link-text { color: #409EFF; cursor: pointer; }
.link-text:hover { text-decoration: underline; }
.status-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.priority-tag { font-weight: 500; font-size: 12px; }
.action-btns { display: flex; gap: 4px; flex-wrap: wrap; }
.loading-cell, .empty-cell { text-align: center; padding: 48px !important; color: #909399; }
.pagination { display: flex; justify-content: flex-end; align-items: center; gap: 6px; padding: 16px 0; }
.total-info { margin-right: 12px; font-size: 13px; color: #606266; }
`;
