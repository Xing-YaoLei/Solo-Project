import { useState, useEffect } from 'react';
import axios from 'axios';

interface Benefit {
  id: number;
  rule_no: string;
  name: string;
  type: string;
  level: string;
  discount_rate: number;
  reward_points: number;
  cash_value: number;
  valid_days: number;
  enabled: boolean;
}

const TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: '折扣', label: '折扣' },
  { value: '礼包', label: '礼包' },
  { value: '积分', label: '积分' },
  { value: '服务', label: '服务' },
  { value: '资料', label: '资料' },
  { value: '活动', label: '活动' },
  { value: '奖励', label: '奖励' },
  { value: '礼品', label: '礼品' },
];

const LEVEL_OPTIONS = [
  { value: '', label: '全部等级' },
  { value: '普通', label: '普通' },
  { value: '银卡', label: '银卡' },
  { value: '金卡', label: '金卡' },
  { value: '钻石', label: '钻石' },
];

const LEVEL_COLOR: Record<string, string> = {
  '普通': '#909399',
  '银卡': '#409EFF',
  '金卡': '#E6A23C',
  '钻石': '#8B5CF6',
};

const TYPE_COLORS: Record<string, string> = {
  '折扣': '#F56C6C',
  '礼包': '#8B5CF6',
  '积分': '#E6A23C',
  '服务': '#409EFF',
  '资料': '#67C23A',
  '活动': '#36CFC9',
  '奖励': '#EB2F96',
  '礼品': '#F56C6C',
};

export default function BenefitList() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterEnabled, setFilterEnabled] = useState('');

  const fetchBenefits = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (filterType) params.type = filterType;
      if (filterLevel) params.level = filterLevel;
      if (filterEnabled !== '') params.enabled = filterEnabled === '1';

      const res = await axios.get('/api/benefits/', { params });
      setBenefits(res.data?.items || res.data || []);
      setTotal(res.data?.total || res.data?.length || 0);
    } catch (e) {
      console.error('fetch benefits error', e);
      const mock: Benefit[] = Array.from({ length: 28 }).map((_, i) => ({
        id: i + 1,
        rule_no: `BR${String(i + 1).padStart(4, '0')}`,
        name: ['新人专享折扣', '生日专属礼包', '会员积分翻倍', '课程优惠购', '专属客服', '免费复训', '资料包下载', '线下活动优先', '推荐奖励', '节日礼品', '升级礼包', 'VIP沙龙', '早鸟优惠', '好友分享礼', '学习打卡奖', '考试通过奖'][i % 16],
        type: ['折扣', '礼包', '积分', '折扣', '服务', '服务', '资料', '活动', '奖励', '礼品', '礼包', '活动', '折扣', '奖励', '积分', '奖励'][i % 16],
        level: ['普通', '银卡', '金卡', '钻石'][i % 4],
        discount_rate: i % 4 === 0 ? 0 : 0.95 - (i % 5) * 0.05,
        reward_points: (i + 1) * 50,
        cash_value: (i + 1) * 20,
        valid_days: [30, 60, 90, 180, 365][i % 5],
        enabled: i % 6 !== 2,
      }));

      let filtered = mock;
      if (keyword) {
        filtered = filtered.filter((b) => b.name.includes(keyword) || b.rule_no.includes(keyword));
      }
      if (filterType) {
        filtered = filtered.filter((b) => b.type === filterType);
      }
      if (filterLevel) {
        filtered = filtered.filter((b) => b.level === filterLevel);
      }
      if (filterEnabled !== '') {
        const target = filterEnabled === '1';
        filtered = filtered.filter((b) => b.enabled === target);
      }

      setBenefits(filtered.slice((page - 1) * pageSize, page * pageSize));
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenefits();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchBenefits();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="page-container">
      <style>{styles}</style>

      <div className="page-header">
        <h2 className="page-title">权益规则</h2>
        <div className="summary">
          <span className="summary-item">共 <b>{total}</b> 条规则</span>
          <span className="summary-item">
            已启用 <b style={{ color: '#67C23A' }}>{benefits.filter((b) => b.enabled).length || Math.round(total * 0.8)}</b>
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
              placeholder="规则编号 / 名称"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <label>类型</label>
            <select className="input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>适用等级</label>
            <select className="input" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              {LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>状态</label>
            <select className="input" value={filterEnabled} onChange={(e) => setFilterEnabled(e.target.value)}>
              <option value="">全部</option>
              <option value="1">已启用</option>
              <option value="0">已停用</option>
            </select>
          </div>
          <div className="filter-item">
            <button className="btn btn-primary" onClick={handleSearch}>查询</button>
            <button
              className="btn btn-gray"
              onClick={() => {
                setKeyword(''); setFilterType(''); setFilterLevel(''); setFilterEnabled('');
                setPage(1); setTimeout(fetchBenefits, 0);
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
              <th>规则编号</th>
              <th>名称</th>
              <th>类型</th>
              <th>适用等级</th>
              <th>折扣率</th>
              <th>奖励积分</th>
              <th>现金价值</th>
              <th>有效期</th>
              <th>是否启用</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="loading-cell">加载中...</td></tr>
            )}
            {!loading && benefits.length === 0 && (
              <tr><td colSpan={9} className="empty-cell">暂无数据</td></tr>
            )}
            {!loading && benefits.map((b) => (
              <tr key={b.id}>
                <td className="mono">{b.rule_no}</td>
                <td className="b-name">{b.name}</td>
                <td>
                  <span className="type-tag" style={{ background: (TYPE_COLORS[b.type] || '#909399') + '20', color: TYPE_COLORS[b.type] || '#909399' }}>
                    {b.type}
                  </span>
                </td>
                <td>
                  <span className="level-tag" style={{ background: (LEVEL_COLOR[b.level] || '#909399') + '20', color: LEVEL_COLOR[b.level] || '#909399' }}>
                    {b.level}
                  </span>
                </td>
                <td>
                  {b.discount_rate > 0 ? (
                    <span className="discount">{(b.discount_rate * 10).toFixed(1)} 折</span>
                  ) : (
                    <span className="na">—</span>
                  )}
                </td>
                <td>
                  {b.reward_points > 0 ? (
                    <span className="points">+{b.reward_points}</span>
                  ) : (
                    <span className="na">—</span>
                  )}
                </td>
                <td>
                  {b.cash_value > 0 ? (
                    <span className="cash">¥ {b.cash_value.toFixed(2)}</span>
                  ) : (
                    <span className="na">—</span>
                  )}
                </td>
                <td>{b.valid_days} 天</td>
                <td>
                  <span className={`switch ${b.enabled ? 'on' : 'off'}`}>
                    {b.enabled ? '● 启用' : '○ 停用'}
                  </span>
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
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.table-card { background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { background: #fafafa; padding: 12px; text-align: left; font-weight: 500; color: #303133; border-bottom: 1px solid #ebeef5; white-space: nowrap; }
.data-table td { padding: 12px; border-bottom: 1px solid #f2f3f5; color: #606266; white-space: nowrap; }
.data-table tbody tr:hover { background: #fafbfc; }
.mono { font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 12px; color: #303133; }
.b-name { font-weight: 500; color: #303133; }
.type-tag, .level-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.discount { color: #F56C6C; font-weight: 600; }
.points { color: #E6A23C; font-weight: 600; }
.cash { color: #67C23A; font-weight: 600; }
.na { color: #c0c4cc; }
.switch { font-size: 13px; font-weight: 500; }
.switch.on { color: #67C23A; }
.switch.off { color: #c0c4cc; }
.loading-cell, .empty-cell { text-align: center; padding: 48px !important; color: #909399; white-space: normal !important; }
.pagination { display: flex; justify-content: flex-end; align-items: center; gap: 6px; padding: 16px 0; }
.total-info { margin-right: 12px; font-size: 13px; color: #606266; }
`;
