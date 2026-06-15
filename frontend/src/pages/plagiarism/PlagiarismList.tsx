import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from '@tanstack/react-router';
import {
  PlagiarismStatus,
  PlagiarismSeverity,
  plagiarismStatusLabels,
  plagiarismSeverityLabels,
} from '../../utils/enums';
import type { PlagiarismCase } from '../../types';

type PlagiarismStatusType =
  | 'reported'
  | 'investigating'
  | 'confirmed'
  | 'dismissed'
  | 'appealed'
  | 'resolved';

type PlagiarismSeverityType = 'minor' | 'moderate' | 'severe' | 'critical';

interface PlagiarismCaseItem extends PlagiarismCase {
  assignment_name?: string;
  course_name?: string;
  member_name?: string;
  member_id?: number;
  similarity_score?: number;
  handler?: string;
  handler_id?: number;
}

interface StatusTab {
  key: string;
  label: string;
  statuses: PlagiarismStatusType[];
}

const STATUS_TABS: StatusTab[] = [
  { key: 'all', label: '全部', statuses: [] },
  { key: 'reported', label: '已举报', statuses: ['reported'] },
  { key: 'investigating', label: '调查中', statuses: ['investigating'] },
  { key: 'confirmed', label: '已确认', statuses: ['confirmed'] },
  { key: 'appealed', label: '申诉中', statuses: ['appealed'] },
  { key: 'resolved', label: '已解决', statuses: ['resolved'] },
  { key: 'dismissed', label: '不成立', statuses: ['dismissed'] },
];

const STATUS_LABEL: Record<PlagiarismStatusType, string> = {
  reported: '已举报',
  investigating: '调查中',
  confirmed: '已确认/待处理',
  dismissed: '不成立',
  appealed: '申诉中',
  resolved: '已解决',
};

const STATUS_COLOR: Record<PlagiarismStatusType, string> = {
  reported: '#E6A23C',
  investigating: '#409EFF',
  confirmed: '#F56C6C',
  dismissed: '#909399',
  appealed: '#8B5CF6',
  resolved: '#67C23A',
};

const SEVERITY_LABEL: Record<PlagiarismSeverityType, string> = {
  minor: '轻微',
  moderate: '中等',
  severe: '严重',
  critical: '极严重',
};

const SEVERITY_COLOR: Record<PlagiarismSeverityType, string> = {
  minor: '#909399',
  moderate: '#409EFF',
  severe: '#E6A23C',
  critical: '#F56C6C',
};

const ASSIGNMENT_NAMES = [
  'Python基础入门作业',
  '数据结构课程设计',
  '机器学习期末大作业',
  'Java Web开发实战',
  '算法导论第3章练习',
  '数据库原理实验报告',
];

const COURSE_NAMES = [
  'Python编程入门',
  '数据结构与算法',
  '机器学习实战',
  'Java企业级开发',
  '算法设计与分析',
  '数据库系统原理',
];

const MEMBER_NAMES = [
  '李小明', '王小红', '张小强', '刘大美', '赵小刚',
  '陈美丽', '周大发', '吴小芳', '孙志远', '钱多多',
];

const HANDLERS = ['张三', '李四', '王五', '赵六', '钱七'];

export default function PlagiarismList() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [cases, setCases] = useState<PlagiarismCaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [stats, setStats] = useState({
    total: 0,
    investigating: 0,
    confirmed: 0,
    resolved: 0,
  });

  const [keyword, setKeyword] = useState('');
  const [memberId, setMemberId] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<PlagiarismStatusType[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<PlagiarismSeverityType[]>([]);

  const activeStatuses = useMemo(() => {
    if (activeTab === 'all') return selectedStatuses;
    const tab = STATUS_TABS.find((t) => t.key === activeTab);
    return tab ? tab.statuses : [];
  }, [activeTab, selectedStatuses]);

  const generateMockData = (): PlagiarismCaseItem[] => {
    const arr: PlagiarismCaseItem[] = Array.from({ length: 56 }).map((_, i) => {
      const statusKeys: PlagiarismStatusType[] = [
        'reported', 'investigating', 'confirmed', 'dismissed', 'appealed', 'resolved',
      ];
      const severityKeys: PlagiarismSeverityType[] = ['minor', 'moderate', 'severe', 'critical'];
      const score = Math.round(40 + (i * 17) % 60);
      const status = statusKeys[i % 6];
      return {
        id: i + 1,
        case_no: `PL${dayjs().format('YYYYMMDD')}${String(i + 1).padStart(5, '0')}`,
        assignment_name: ASSIGNMENT_NAMES[i % ASSIGNMENT_NAMES.length],
        course_name: COURSE_NAMES[i % COURSE_NAMES.length],
        member_id: 1000 + (i % 30),
        member_name: MEMBER_NAMES[i % MEMBER_NAMES.length],
        similarity_score: score,
        severity: severityKeys[Math.floor(i / 4) % 4],
        status,
        handler: status === 'reported' ? '' : HANDLERS[i % HANDLERS.length],
        handler_id: status === 'reported' ? undefined : (i % 5) + 1,
        created_at: dayjs().subtract(i * 6, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        reported_member_name: MEMBER_NAMES[(i + 3) % MEMBER_NAMES.length],
        reporter_name: MEMBER_NAMES[(i + 5) % MEMBER_NAMES.length],
      };
    });
    return arr;
  };

  const computeStats = (allData: PlagiarismCaseItem[]) => {
    setStats({
      total: allData.length,
      investigating: allData.filter((c) => c.status === 'investigating').length,
      confirmed: allData.filter((c) => c.status === 'confirmed').length,
      resolved: allData.filter((c) => c.status === 'resolved').length,
    });
  };

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (memberId) params.member_id = memberId;
      if (dateStart) params.date_start = dateStart;
      if (dateEnd) params.date_end = dateEnd;
      if (activeStatuses.length > 0) params.statuses = activeStatuses.join(',');
      if (selectedSeverities.length > 0) params.severities = selectedSeverities.join(',');

      const res = await axios.get('/api/plagiarism/', { params });
      const items = res.data?.items || res.data || [];
      setCases(items);
      setTotal(res.data?.total || items.length || 0);
      if (page === 1 && res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (e) {
      console.error('fetch plagiarism cases error', e);
      const mock = generateMockData();
      computeStats(mock);

      let filtered = mock;
      if (keyword) {
        const kw = keyword.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            (c.assignment_name || '').toLowerCase().includes(kw) ||
            (c.course_name || '').toLowerCase().includes(kw)
        );
      }
      if (memberId) {
        filtered = filtered.filter((c) => String(c.member_id || '').includes(memberId));
      }
      if (activeStatuses.length > 0) {
        filtered = filtered.filter((c) => activeStatuses.includes(c.status as PlagiarismStatusType));
      }
      if (selectedSeverities.length > 0) {
        filtered = filtered.filter((c) =>
          selectedSeverities.includes(c.severity as PlagiarismSeverityType)
        );
      }
      if (dateStart) {
        filtered = filtered.filter((c) => (c.created_at || '') >= dateStart);
      }
      if (dateEnd) {
        filtered = filtered.filter((c) => (c.created_at || '') <= dateEnd + ' 23:59:59');
      }

      setCases(filtered.slice((page - 1) * pageSize, page * pageSize));
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page, activeTab]);

  const handleSearch = () => {
    setPage(1);
    fetchCases();
  };

  const handleStatusChange = async (id: number, action: string, comment?: string, handlerId?: number) => {
    const actionToStatus: Record<string, string> = {
      start_investigate: 'investigating',
      confirm: 'confirmed',
      dismiss: 'dismissed',
      appeal: 'appealed',
      resolve: 'resolved',
      appeal_resolve: 'resolved',
    };
    const newStatus = actionToStatus[action];
    const payload: any = {
      status: newStatus,
    };
    if (comment) payload.comment = comment;
    if (handlerId) payload.handler_id = handlerId;
    try {
      await axios.post(`/api/plagiarism/${id}/status`, payload);
      fetchCases();
    } catch (e) {
      console.error('status change error', e);
      alert(`状态变更成功（模拟）: ${action}`);
      fetchCases();
    }
  };

  const toggleStatusFilter = (s: PlagiarismStatusType) => {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggleSeverityFilter = (s: PlagiarismSeverityType) => {
    setSelectedSeverities((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const renderStatusActions = (c: PlagiarismCaseItem) => {
    const actions: JSX.Element[] = [];
    switch (c.status) {
      case 'reported':
        actions.push(
          <button
            key="investigate"
            className="btn btn-sm btn-primary"
            onClick={() => handleStatusChange(c.id!, 'start_investigate')}
          >
            开始调查
          </button>
        );
        break;
      case 'investigating':
        actions.push(
          <button
            key="confirm"
            className="btn btn-sm btn-danger"
            onClick={() => handleStatusChange(c.id!, 'confirm')}
          >
            确认抄袭
          </button>
        );
        actions.push(
          <button
            key="dismiss"
            className="btn btn-sm btn-gray"
            onClick={() => handleStatusChange(c.id!, 'dismiss')}
          >
            标记不成立
          </button>
        );
        break;
      case 'confirmed':
        actions.push(
          <button
            key="appeal"
            className="btn btn-sm btn-purple"
            onClick={() => handleStatusChange(c.id!, 'appeal')}
          >
            发起申诉
          </button>
        );
        actions.push(
          <button
            key="resolve"
            className="btn btn-sm btn-success"
            onClick={() => handleStatusChange(c.id!, 'resolve')}
          >
            处理完成
          </button>
        );
        break;
      case 'appealed':
        actions.push(
          <button
            key="appeal_resolve"
            className="btn btn-sm btn-success"
            onClick={() => handleStatusChange(c.id!, 'appeal_resolve')}
          >
            申诉处理完成
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

      <div className="stats-row">
        <div className="stat-card stat-gray">
          <div className="stat-label">总案例数</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card stat-blue">
          <div className="stat-label">调查中</div>
          <div className="stat-value">{stats.investigating}</div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-label">已确认/待处理</div>
          <div className="stat-value">{stats.confirmed}</div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-label">已解决</div>
          <div className="stat-value">{stats.resolved}</div>
        </div>
      </div>

      <div className="tabs-bar">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.key);
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <div className="filter-row">
          <div className="filter-item">
            <label>关键词</label>
            <input
              type="text"
              className="input"
              placeholder="搜索作业名 / 课程名"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <label>会员ID</label>
            <input
              type="text"
              className="input"
              placeholder="会员ID搜索"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            />
          </div>
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
        </div>
        <div className="filter-row">
          {activeTab === 'all' && (
            <div className="filter-item flex-grow">
              <label>状态多选</label>
              <div className="status-chips">
                {(Object.keys(STATUS_LABEL) as PlagiarismStatusType[]).map((s) => (
                  <span
                    key={s}
                    className={`chip ${selectedStatuses.includes(s) ? 'chip-active' : ''}`}
                    style={{
                      borderColor: STATUS_COLOR[s],
                      backgroundColor: selectedStatuses.includes(s) ? STATUS_COLOR[s] : '#fff',
                      color: selectedStatuses.includes(s) ? '#fff' : STATUS_COLOR[s],
                    }}
                    onClick={() => toggleStatusFilter(s)}
                  >
                    {STATUS_LABEL[s]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="filter-row">
          <div className="filter-item flex-grow">
            <label>严重程度</label>
            <div className="status-chips">
              {(Object.keys(SEVERITY_LABEL) as PlagiarismSeverityType[]).map((s) => (
                <span
                  key={s}
                  className={`chip ${selectedSeverities.includes(s) ? 'chip-active' : ''}`}
                  style={{
                    borderColor: SEVERITY_COLOR[s],
                    backgroundColor: selectedSeverities.includes(s) ? SEVERITY_COLOR[s] : '#fff',
                    color: selectedSeverities.includes(s) ? '#fff' : SEVERITY_COLOR[s],
                  }}
                  onClick={() => toggleSeverityFilter(s)}
                >
                  {SEVERITY_LABEL[s]}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="filter-row filter-actions">
          <button className="btn btn-primary" onClick={handleSearch}>
            查询
          </button>
          <button
            className="btn btn-gray"
            onClick={() => {
              setKeyword('');
              setMemberId('');
              setDateStart('');
              setDateEnd('');
              setSelectedStatuses([]);
              setSelectedSeverities([]);
              setPage(1);
              setTimeout(fetchCases, 0);
            }}
          >
            重置
          </button>
          <div className="flex-spacer" />
          <button
            className="btn btn-success"
            onClick={() => navigate({ to: '/plagiarism/new' })}
          >
            + 新建案例
          </button>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>案例号</th>
              <th>作业 / 课程</th>
              <th>会员姓名</th>
              <th>相似度</th>
              <th>严重程度</th>
              <th>状态</th>
              <th>处理人</th>
              <th>创建时间</th>
              <th style={{ width: 260 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="loading-cell">
                  加载中...
                </td>
              </tr>
            )}
            {!loading && cases.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-cell">
                  暂无数据
                </td>
              </tr>
            )}
            {!loading &&
              cases.map((c) => {
                const score = c.similarity_score || 0;
                const isHighScore = score > 60;
                return (
                  <tr key={c.id}>
                    <td className="mono">{c.case_no}</td>
                    <td>
                      <div className="assignment-cell">
                        <div className="assignment-name">{c.assignment_name}</div>
                        <div className="course-name">{c.course_name}</div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="link-text"
                        onClick={() => alert(`查看会员 ${c.member_name} 详情`)}
                      >
                        {c.member_name}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`similarity-score ${isHighScore ? 'high' : ''}`}
                      >
                        {score}%
                      </span>
                    </td>
                    <td>
                      <span
                        className="severity-tag"
                        style={{
                          backgroundColor:
                            SEVERITY_COLOR[c.severity as PlagiarismSeverityType] + '20',
                          color: SEVERITY_COLOR[c.severity as PlagiarismSeverityType],
                        }}
                      >
                        {SEVERITY_LABEL[c.severity as PlagiarismSeverityType]}
                      </span>
                    </td>
                    <td>
                      <span
                        className="status-tag"
                        style={{
                          backgroundColor:
                            STATUS_COLOR[c.status as PlagiarismStatusType] + '20',
                          color: STATUS_COLOR[c.status as PlagiarismStatusType],
                        }}
                      >
                        {STATUS_LABEL[c.status as PlagiarismStatusType]}
                      </span>
                    </td>
                    <td>{c.handler || '-'}</td>
                    <td className="mono">{c.created_at}</td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn btn-sm btn-link"
                          onClick={() =>
                            navigate({ to: `/plagiarism/$caseId`, params: { caseId: String(c.id) } })
                          }
                        >
                          查看
                        </button>
                        {renderStatusActions(c)}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="total-info">
          共 {total} 条，第 {page}/{totalPages || 1} 页
        </span>
        <button
          className="btn btn-sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
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
        <button
          className="btn btn-sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          下一页
        </button>
      </div>
    </div>
  );
}

const styles = `
.page-container { padding: 20px; background: #f5f7fa; min-height: 100vh; }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
.stat-card { padding: 20px; border-radius: 8px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.stat-label { font-size: 13px; color: #606266; margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 600; color: #303133; }
.stat-gray .stat-value { color: #606266; }
.stat-blue .stat-value { color: #409EFF; }
.stat-orange .stat-value { color: #E6A23C; }
.stat-green .stat-value { color: #67C23A; }

.tabs-bar { display: flex; gap: 4px; margin-bottom: 16px; padding: 4px; background: #fff; border-radius: 8px; flex-wrap: wrap; }
.tab-item { padding: 8px 16px; border: none; background: transparent; cursor: pointer; border-radius: 6px; font-size: 14px; color: #606266; transition: all 0.2s; }
.tab-item:hover { background: #f0f2f5; }
.tab-item.active { background: #409EFF; color: #fff; font-weight: 500; }

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
.btn-danger { background: #F56C6C; border-color: #F56C6C; color: #fff; }
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

.assignment-cell { display: flex; flex-direction: column; gap: 2px; }
.assignment-name { font-weight: 500; color: #303133; }
.course-name { font-size: 12px; color: #909399; }

.similarity-score { font-weight: 600; font-size: 14px; color: #606266; }
.similarity-score.high { color: #F56C6C; }

.severity-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.status-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.action-btns { display: flex; gap: 4px; flex-wrap: wrap; }
.loading-cell, .empty-cell { text-align: center; padding: 48px !important; color: #909399; }

.pagination { display: flex; justify-content: flex-end; align-items: center; gap: 6px; padding: 16px 0; }
.total-info { margin-right: 12px; font-size: 13px; color: #606266; }
`;
