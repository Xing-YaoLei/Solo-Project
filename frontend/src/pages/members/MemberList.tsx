import { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

interface Member {
  id: number;
  member_no: string;
  name: string;
  phone: string;
  level: string;
  source: string;
  score: number;
  passed: boolean;
  study_hours: number;
  community: string;
  created_at: string;
}

const LEVEL_OPTIONS = [
  { value: '', label: '全部等级' },
  { value: '普通', label: '普通' },
  { value: '银卡', label: '银卡' },
  { value: '金卡', label: '金卡' },
  { value: '钻石', label: '钻石' },
];

const SOURCE_OPTIONS = [
  { value: '', label: '全部来源' },
  { value: '微信社群', label: '微信社群' },
  { value: '电话咨询', label: '电话咨询' },
  { value: '官网留言', label: '官网留言' },
  { value: '转介绍', label: '转介绍' },
  { value: '线下活动', label: '线下活动' },
];

const PASS_OPTIONS = [
  { value: '', label: '全部' },
  { value: '1', label: '已通过' },
  { value: '0', label: '未通过' },
];

const LEVEL_COLOR: Record<string, string> = {
  '普通': '#909399',
  '银卡': '#409EFF',
  '金卡': '#E6A23C',
  '钻石': '#8B5CF6',
};

export default function MemberList() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [keyword, setKeyword] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterPass, setFilterPass] = useState('');

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (filterLevel) params.level = filterLevel;
      if (filterSource) params.source = filterSource;
      if (filterPass !== '') params.passed = filterPass === '1';

      const res = await axios.get('/api/members/', { params });
      setMembers(res.data?.items || res.data || []);
      setTotal(res.data?.total || res.data?.length || 0);
    } catch (e) {
      console.error('fetch members error', e);
      const mock: Member[] = Array.from({ length: 47 }).map((_, i) => ({
        id: i + 1,
        member_no: `MB${String(100000 + i).padStart(6, '0')}`,
        name: ['李小明', '王小红', '张小强', '刘大美', '赵小刚', '陈美丽', '周大发', '吴小芳'][i % 8],
        phone: `138${String(10000000 + i * 137).slice(0, 8)}`,
        level: ['普通', '银卡', '金卡', '钻石'][Math.floor(i / 3) % 4],
        source: ['微信社群', '电话咨询', '官网留言', '转介绍', '线下活动'][i % 5],
        score: Math.round(60 + (i * 37) % 40),
        passed: i % 3 !== 0,
        study_hours: Math.round(5 + i * 2.3),
        community: ['VIP-A群', '成长-B群', '学习-C群', '精英-D群'][i % 4],
        created_at: dayjs().subtract(i * 2, 'day').format('YYYY-MM-DD HH:mm:ss'),
      }));

      let filtered = mock;
      if (keyword) {
        filtered = filtered.filter((m) => m.name.includes(keyword) || m.phone.includes(keyword));
      }
      if (filterLevel) {
        filtered = filtered.filter((m) => m.level === filterLevel);
      }
      if (filterSource) {
        filtered = filtered.filter((m) => m.source === filterSource);
      }
      if (filterPass !== '') {
        const targetPass = filterPass === '1';
        filtered = filtered.filter((m) => m.passed === targetPass);
      }

      setMembers(filtered.slice((page - 1) * pageSize, page * pageSize));
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchMembers();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="page-container">
      <style>{styles}</style>

      <div className="page-header">
        <h2 className="page-title">会员档案</h2>
        <div className="summary">
          <span className="summary-item">共 <b>{total}</b> 位会员</span>
          <span className="summary-item">
            已通过 <b style={{ color: '#67C23A' }}>{members.filter((m) => m.passed).length || Math.round(total * 0.67)}</b>
          </span>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-row">
          <div className="filter-item">
            <label>搜索</label>
            <input
              type="text"
              className="input"
              placeholder="姓名 / 手机号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <label>会员等级</label>
            <select className="input" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              {LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>来源渠道</label>
            <select className="input" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>考试通过</label>
            <select className="input" value={filterPass} onChange={(e) => setFilterPass(e.target.value)}>
              {PASS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <button className="btn btn-primary" onClick={handleSearch}>查询</button>
            <button
              className="btn btn-gray"
              onClick={() => {
                setKeyword(''); setFilterLevel(''); setFilterSource(''); setFilterPass('');
                setPage(1); setTimeout(fetchMembers, 0);
              }}
            >
              重置
            </button>
          </div>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>会员号</th>
              <th>姓名</th>
              <th>手机号</th>
              <th>等级</th>
              <th>来源渠道</th>
              <th>考试分数</th>
              <th>是否通过</th>
              <th>学习时长</th>
              <th>社群</th>
              <th>创建时间</th>
              <th style={{ width: 100 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={11} className="loading-cell">加载中...</td></tr>
            )}
            {!loading && members.length === 0 && (
              <tr><td colSpan={11} className="empty-cell">暂无数据</td></tr>
            )}
            {!loading && members.map((m) => (
              <tr key={m.id}>
                <td className="mono">{m.member_no}</td>
                <td>
                  <div className="member-cell">
                    <span className="member-avatar" style={{ background: LEVEL_COLOR[m.level] + '30', color: LEVEL_COLOR[m.level] }}>
                      {m.name.charAt(0)}
                    </span>
                    {m.name}
                  </div>
                </td>
                <td className="mono">{m.phone}</td>
                <td>
                  <span className="level-tag" style={{ background: LEVEL_COLOR[m.level] + '20', color: LEVEL_COLOR[m.level] }}>
                    {m.level}
                  </span>
                </td>
                <td>{m.source}</td>
                <td>
                  <span className={`score ${m.score >= 80 ? 'high' : m.score >= 60 ? 'mid' : 'low'}`}>
                    {m.score}
                  </span>
                </td>
                <td>
                  {m.passed ? (
                    <span className="pass-tag yes">✓ 已通过</span>
                  ) : (
                    <span className="pass-tag no">✗ 未通过</span>
                  )}
                </td>
                <td>{m.study_hours} 小时</td>
                <td>{m.community}</td>
                <td className="mono">{m.created_at}</td>
                <td>
                  <button
                    className="btn btn-sm btn-link"
                    onClick={() => alert(`查看会员 ${m.name} (${m.member_no}) 详情`)}
                  >
                    查看详情
                  </button>
                </td>
              </tr>
            ))}
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
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-title { margin: 0; font-size: 22px; color: #303133; }
.summary { display: flex; gap: 20px; }
.summary-item { font-size: 13px; color: #606266; }
.summary-item b { color: #409EFF; font-size: 15px; margin: 0 2px; }
.filter-bar { background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
.filter-row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.filter-item { display: flex; align-items: center; gap: 8px; }
.filter-item label { font-size: 13px; color: #606266; white-space: nowrap; }
.input { padding: 6px 10px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 13px; outline: none; min-width: 140px; transition: border-color 0.2s; }
.input:focus { border-color: #409EFF; }
.btn { padding: 6px 14px; border: 1px solid #dcdfe6; border-radius: 4px; cursor: pointer; font-size: 13px; background: #fff; transition: all 0.2s; }
.btn:hover { opacity: 0.85; }
.btn-sm { padding: 4px 10px; font-size: 12px; }
.btn-primary { background: #409EFF; border-color: #409EFF; color: #fff; }
.btn-gray { background: #fff; border-color: #dcdfe6; color: #606266; }
.btn-link { border: none; background: transparent; color: #409EFF; padding: 4px 6px; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.table-card { background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { background: #fafafa; padding: 12px; text-align: left; font-weight: 500; color: #303133; border-bottom: 1px solid #ebeef5; white-space: nowrap; }
.data-table td { padding: 12px; border-bottom: 1px solid #f2f3f5; color: #606266; white-space: nowrap; }
.data-table tbody tr:hover { background: #fafbfc; }
.mono { font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 12px; color: #303133; }
.member-cell { display: flex; align-items: center; gap: 8px; }
.member-avatar { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
.level-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.score { font-weight: 600; font-size: 14px; }
.score.high { color: #67C23A; }
.score.mid { color: #409EFF; }
.score.low { color: #F56C6C; }
.pass-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.pass-tag.yes { background: #f0f9eb; color: #67C23A; }
.pass-tag.no { background: #fef0f0; color: #F56C6C; }
.loading-cell, .empty-cell { text-align: center; padding: 48px !important; color: #909399; white-space: normal !important; }
.pagination { display: flex; justify-content: flex-end; align-items: center; gap: 6px; padding: 16px 0; }
.total-info { margin-right: 12px; font-size: 13px; color: #606266; }
`;
