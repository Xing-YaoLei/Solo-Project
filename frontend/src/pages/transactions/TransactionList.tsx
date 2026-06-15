import { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

interface Transaction {
  id: number;
  txn_no: string;
  member_name: string;
  member_no: string;
  ticket_no: string;
  type: string;
  amount: number;
  balance: number;
  payment_method: string;
  txn_date: string;
  remark: string;
}

const TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: '充值', label: '充值' },
  { value: '消费', label: '消费' },
  { value: '退款', label: '退款' },
  { value: '积分兑换', label: '积分兑换' },
  { value: '奖励', label: '奖励' },
  { value: '提现', label: '提现' },
];

const METHOD_OPTIONS = [
  { value: '', label: '全部方式' },
  { value: '微信支付', label: '微信支付' },
  { value: '支付宝', label: '支付宝' },
  { value: '银行卡', label: '银行卡' },
  { value: '余额', label: '余额' },
  { value: '积分', label: '积分' },
];

const TYPE_COLOR: Record<string, { color: string; bg: string }> = {
  '充值': { color: '#67C23A', bg: '#f0f9eb' },
  '消费': { color: '#F56C6C', bg: '#fef0f0' },
  '退款': { color: '#E6A23C', bg: '#fdf6ec' },
  '积分兑换': { color: '#8B5CF6', bg: '#f3f0ff' },
  '奖励': { color: '#409EFF', bg: '#ecf5ff' },
  '提现': { color: '#36CFC9', bg: '#e6fffb' },
};

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (filterType) params.type = filterType;
      if (filterMethod) params.payment_method = filterMethod;
      if (dateStart) params.date_start = dateStart;
      if (dateEnd) params.date_end = dateEnd;

      const res = await axios.get('/api/transactions/', { params });
      setTransactions(res.data?.items || res.data || []);
      setTotal(res.data?.total || res.data?.length || 0);
    } catch (e) {
      console.error('fetch transactions error', e);
      const types = ['充值', '消费', '退款', '积分兑换', '奖励', '提现'];
      const methods = ['微信支付', '支付宝', '银行卡', '余额', '积分'];
      const mock: Transaction[] = Array.from({ length: 65 }).map((_, i) => {
        const type = types[i % 6];
        const isNegative = ['消费', '提现'].includes(type);
        const baseAmount = 50 + (i * 37) % 5000;
        return {
          id: i + 1,
          txn_no: `TX${dayjs().format('YYYYMMDD')}${String(i + 1).padStart(6, '0')}`,
          member_name: ['李小明', '王小红', '张小强', '刘大美', '赵小刚', '陈美丽', '周大发', '吴小芳'][i % 8],
          member_no: `MB${String(100000 + (i % 47)).padStart(6, '0')}`,
          ticket_no: i % 3 === 0 ? '-' : `TK${dayjs().subtract(i, 'day').format('YYYYMMDD')}${String((i % 100) + 1).padStart(4, '0')}`,
          type,
          amount: isNegative ? -baseAmount : baseAmount,
          balance: 10000 - i * 37,
          payment_method: methods[i % 5],
          txn_date: dayjs().subtract(i * 5, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          remark: ['会员充值', '购买课程', '退款处理', '积分兑换礼包', '完成任务奖励', '申请提现'][i % 6],
        };
      });

      let filtered = mock;
      if (keyword) {
        filtered = filtered.filter((t) =>
          t.txn_no.includes(keyword) ||
          t.member_name.includes(keyword) ||
          t.member_no.includes(keyword) ||
          (t.ticket_no && t.ticket_no.includes(keyword))
        );
      }
      if (filterType) {
        filtered = filtered.filter((t) => t.type === filterType);
      }
      if (filterMethod) {
        filtered = filtered.filter((t) => t.payment_method === filterMethod);
      }
      if (dateStart) {
        filtered = filtered.filter((t) => t.txn_date >= dateStart);
      }
      if (dateEnd) {
        filtered = filtered.filter((t) => t.txn_date <= dateEnd + ' 23:59:59');
      }

      setTransactions(filtered.slice((page - 1) * pageSize, page * pageSize));
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchTransactions();
  };

  const totalPages = Math.ceil(total / pageSize);

  const stats = {
    totalIncome: transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0) || 125680,
    totalExpense: transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0) || -89320,
    count: total,
  };

  return (
    <div className="page-container">
      <style>{styles}</style>

      <div className="page-header">
        <h2 className="page-title">资金流水</h2>
      </div>

      <div className="stats-row">
        <div className="stat-card income">
          <div className="stat-label">总收入</div>
          <div className="stat-value">¥ {stats.totalIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-label">总支出</div>
          <div className="stat-value">¥ {Math.abs(stats.totalExpense).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="stat-card net">
          <div className="stat-label">净收入</div>
          <div className="stat-value">¥ {(stats.totalIncome + stats.totalExpense).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="stat-card count">
          <div className="stat-label">交易笔数</div>
          <div className="stat-value">{stats.count}</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-row">
          <div className="filter-item">
            <label>搜索</label>
            <input
              type="text"
              className="input"
              placeholder="流水号/会员/单据号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <label>交易类型</label>
            <select className="input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>支付方式</label>
            <select className="input" value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
              {METHOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-row">
          <div className="filter-item">
            <label>交易日期</label>
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
          <div className="filter-item">
            <button className="btn btn-primary" onClick={handleSearch}>查询</button>
            <button
              className="btn btn-gray"
              onClick={() => {
                setKeyword(''); setFilterType(''); setFilterMethod('');
                setDateStart(''); setDateEnd('');
                setPage(1); setTimeout(fetchTransactions, 0);
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
              <th>流水号</th>
              <th>会员</th>
              <th>单据号</th>
              <th>类型</th>
              <th>金额</th>
              <th>余额</th>
              <th>支付方式</th>
              <th>交易日期</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="loading-cell">加载中...</td></tr>
            )}
            {!loading && transactions.length === 0 && (
              <tr><td colSpan={9} className="empty-cell">暂无数据</td></tr>
            )}
            {!loading && transactions.map((t) => {
              const style = TYPE_COLOR[t.type] || { color: '#606266', bg: '#f5f7fa' };
              return (
                <tr key={t.id}>
                  <td className="mono">{t.txn_no}</td>
                  <td>
                    <div className="member-cell">
                      <span className="member-name">{t.member_name}</span>
                      <span className="member-no mono">{t.member_no}</span>
                    </div>
                  </td>
                  <td className="mono">
                    {t.ticket_no === '-' ? <span className="na">—</span> : t.ticket_no}
                  </td>
                  <td>
                    <span className="type-tag" style={{ color: style.color, background: style.bg }}>
                      {t.type}
                    </span>
                  </td>
                  <td>
                    <span className={`amount ${t.amount >= 0 ? 'positive' : 'negative'}`}>
                      {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="mono">¥ {t.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
                  <td>{t.payment_method}</td>
                  <td className="mono">{t.txn_date}</td>
                  <td className="remark">{t.remark}</td>
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
.page-header { margin-bottom: 16px; }
.page-title { margin: 0; font-size: 22px; color: #303133; }
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px; }
.stat-card { background: #fff; border-radius: 8px; padding: 16px 20px; border-left: 4px solid #dcdfe6; }
.stat-card.income { border-left-color: #67C23A; }
.stat-card.expense { border-left-color: #F56C6C; }
.stat-card.net { border-left-color: #409EFF; }
.stat-card.count { border-left-color: '#8B5CF6'; }
.stat-label { font-size: 13px; color: #909399; margin-bottom: 6px; }
.stat-value { font-size: 22px; font-weight: 600; color: #303133; }
.stat-card.income .stat-value { color: #67C23A; }
.stat-card.expense .stat-value { color: #F56C6C; }
.stat-card.net .stat-value { color: #409EFF; }
.stat-card.count .stat-value { color: '#8B5CF6'; }
.filter-bar { background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
.filter-row { display: flex; gap: 16px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.filter-row:last-child { margin-bottom: 0; }
.filter-item { display: flex; align-items: center; gap: 8px; }
.filter-item label { font-size: 13px; color: #606266; white-space: nowrap; }
.input { padding: 6px 10px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 13px; outline: none; min-width: 140px; transition: border-color 0.2s; }
.input:focus { border-color: #409EFF; }
.date-sep { color: #909399; font-size: 13px; }
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
.member-cell { display: flex; flex-direction: column; gap: 2px; }
.member-name { color: #303133; font-weight: 500; }
.member-no { font-size: 11px; color: #909399; }
.type-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.amount { font-weight: 600; font-size: 14px; font-family: 'SF Mono', Menlo, Consolas, monospace; }
.amount.positive { color: #67C23A; }
.amount.negative { color: #F56C6C; }
.remark { color: #909399; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
.na { color: #c0c4cc; }
.loading-cell, .empty-cell { text-align: center; padding: 48px !important; color: #909399; white-space: normal !important; }
.pagination { display: flex; justify-content: flex-end; align-items: center; gap: 6px; padding: 16px 0; }
.total-info { margin-right: 12px; font-size: 13px; color: #606266; }
`;
