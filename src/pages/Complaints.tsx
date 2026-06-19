import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, Eye, Edit, Clock, User, MapPin, AlertTriangle, X, CheckCircle, PhoneCall, MessageSquare } from 'lucide-react';
import { getComplaints, getComplaintDetail, updateComplaint, getCallbackStats } from '../services/api';
import type { Complaint, ComplaintDetail, ComplaintLog, CallbackRecord, CallbackStats } from '../types';
import { StatusBadge, SeverityBadge, CallbackBadge } from '../components/StatusBadge';
import PieChart from '../components/Charts/PieChart';
import { useStore } from '../store/useStore';

const Complaints: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { filters, setFilters } = useStore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [callbackStats, setCallbackStats] = useState<CallbackStats[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [category, setCategory] = useState('all');
  const [region, setRegion] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [callbackResultFilter, setCallbackResultFilter] = useState<string>('all');
  const [editForm, setEditForm] = useState({
    status: '',
    handler: '',
    callback_result: '',
    callback_note: '',
    responsibility: '',
    responsibility_dept: '',
    action: '',
    note: '',
  });

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, pageSize: 1000, status, severity, category, region };
      if (search) params.search = search;
      if (callbackResultFilter && callbackResultFilter !== 'all') {
        params.callback_result = callbackResultFilter;
      }
      const res = await getComplaints(params);
      let filtered = res.data;
      if (callbackResultFilter && callbackResultFilter !== 'all') {
        filtered = filtered.filter((c: any) => c.callback_result === callbackResultFilter);
      }
      const start = (page - 1) * pageSize;
      setComplaints(filtered.slice(start, start + pageSize));
      setTotal(filtered.length);
    } catch (error) {
      console.error('Failed to load complaints:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status, severity, category, region, search, callbackResultFilter]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const detail = await getComplaintDetail(id);
      setSelectedComplaint(detail);
      setEditForm({
        status: detail.status,
        handler: detail.handler || '',
        callback_result: detail.callback_result || '',
        callback_note: detail.callback_note || '',
        responsibility: detail.responsibility || '',
        responsibility_dept: detail.responsibility_dept || '',
        action: '',
        note: '',
      });
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to load complaint detail:', error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
    getCallbackStats().then(setCallbackStats);
  }, [loadComplaints]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const cb = params.get('callback_result');
    if (id) {
      loadDetail(id);
      navigate('/complaints', { replace: true });
    }
    if (cb) {
      setCallbackResultFilter(cb);
    }
  }, [location.search, loadDetail, navigate]);

  const handleSave = async () => {
    if (!selectedComplaint) return;
    try {
      await updateComplaint(selectedComplaint.id, editForm);
      await loadDetail(selectedComplaint.id);
      await loadComplaints();
    } catch (error) {
      console.error('Failed to update complaint:', error);
    }
  };

  const getProcessingTimeText = (minutes: number, target: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const text = hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
    const isOverdue = minutes > target;
    return (
      <span className={isOverdue ? 'text-danger-400' : 'text-success-400'}>
        {text} {isOverdue && '(超时)'}
      </span>
    );
  };

  const regions = ['华东区', '华南区', '华北区', '西南区', '西北区', '华中区', '东北区'];
  const categories = ['卫生问题', '设施故障', '服务态度', '噪音问题', '预订纠纷', '安全问题', '其他'];
  const statuses = [
    { value: 'pending', label: '待处理' },
    { value: 'processing', label: '处理中' },
    { value: 'escalated', label: '已升级' },
    { value: 'resolved', label: '已解决' },
    { value: 'closed', label: '已关闭' },
  ];
  const severities = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
    { value: 'critical', label: '严重' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">客诉明细管理</h1>
          <p className="text-gray-400">查看、处理和跟进所有客诉工单</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card p-4 rounded-xl">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-gray-400 mb-1 block">搜索</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="搜索描述、民宿、处理人..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="min-w-[120px]">
                <label className="text-sm text-gray-400 mb-1 block">状态</label>
                <select
                  value={status}
                  onChange={e => { setStatus(e.target.value); setPage(1); }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="all" className="bg-slate-800">全部</option>
                  {statuses.map(s => (
                    <option key={s.value} value={s.value} className="bg-slate-800">{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[120px]">
                <label className="text-sm text-gray-400 mb-1 block">紧急程度</label>
                <select
                  value={severity}
                  onChange={e => { setSeverity(e.target.value); setPage(1); }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="all" className="bg-slate-800">全部</option>
                  {severities.map(s => (
                    <option key={s.value} value={s.value} className="bg-slate-800">{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[120px]">
                <label className="text-sm text-gray-400 mb-1 block">类型</label>
                <select
                  value={category}
                  onChange={e => { setCategory(e.target.value); setPage(1); }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="all" className="bg-slate-800">全部</option>
                  {categories.map(c => (
                    <option key={c} value={c} className="bg-slate-800">{c}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[120px]">
                <label className="text-sm text-gray-400 mb-1 block">区域</label>
                <select
                  value={region}
                  onChange={e => { setRegion(e.target.value); setPage(1); }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="all" className="bg-slate-800">全部</option>
                  {regions.map(r => (
                    <option key={r} value={r} className="bg-slate-800">{r}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[120px]">
                <label className="text-sm text-gray-400 mb-1 block">回访结果</label>
                <select
                  value={callbackResultFilter}
                  onChange={e => { setCallbackResultFilter(e.target.value); setPage(1); }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="all" className="bg-slate-800">全部</option>
                  <option value="satisfied" className="bg-slate-800">满意</option>
                  <option value="unsatisfied" className="bg-slate-800">不满意</option>
                  <option value="pending" className="bg-slate-800">待回访</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr className="text-left text-gray-400">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">类型</th>
                    <th className="px-4 py-3">程度</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">民宿</th>
                    <th className="px-4 py-3">区域</th>
                    <th className="px-4 py-3">处理人</th>
                    <th className="px-4 py-3">处理时长</th>
                    <th className="px-4 py-3">回访</th>
                    <th className="px-4 py-3">创建时间</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-12 text-center text-gray-400">加载中...</td>
                    </tr>
                  ) : complaints.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-12 text-center text-gray-400">暂无数据</td>
                    </tr>
                  ) : (
                    complaints.map(c => (
                      <tr
                        key={c.id}
                        className={`border-b border-white/5 hover:bg-white/5 transition-all ${
                          c.is_overdue ? 'bg-danger-500/5' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.id.slice(0, 8)}...</td>
                        <td className="px-4 py-3 text-white">{c.category}</td>
                        <td className="px-4 py-3"><SeverityBadge severity={c.severity} /></td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3 text-white">{c.property_name}</td>
                        <td className="px-4 py-3 text-gray-400">{c.region}</td>
                        <td className="px-4 py-3 text-white">{c.handler}</td>
                        <td className="px-4 py-3">
                          {c.processing_time > 0
                            ? getProcessingTimeText(c.processing_time, c.target_time)
                            : <span className="text-gray-500">-</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          {c.callback_result ? <CallbackBadge result={c.callback_result} /> : <span className="text-gray-500">-</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.created_at).toLocaleString('zh-CN')}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => loadDetail(c.id)}
                            className="p-1.5 text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <span className="text-sm text-gray-400">共 {total} 条记录</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm bg-white/5 text-white rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  上一页
                </button>
                <span className="px-3 py-1 text-sm text-gray-400">第 {page} 页</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * pageSize >= total}
                  className="px-3 py-1 text-sm bg-white/5 text-white rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-4 rounded-xl">
            <h3 className="text-sm font-semibold text-white mb-3">回访结果统计</h3>
            <PieChart
              data={callbackStats.map(c => ({
                name: c.result === 'satisfied' ? '满意' : c.result === 'unsatisfied' ? '不满意' : '待回访',
                value: c.count,
              }))}
              height={200}
            />
            <div className="grid grid-cols-1 gap-2 mt-4">
              {callbackStats.map(c => (
                <div key={c.result} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    {c.result === 'satisfied' ? '满意' : c.result === 'unsatisfied' ? '不满意' : '待回访'}
                  </span>
                  <span className="text-white font-medium">{c.count} ({c.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl">
            <h3 className="text-sm font-semibold text-white mb-3">快捷筛选</h3>
            <div className="space-y-2">
              {[
                { label: '超时未处理', filter: { status: 'all', severity: 'all', category: 'all' }, special: 'overdue' },
                { label: '已升级处理', filter: { status: 'escalated', severity: 'all', category: 'all' } },
                { label: '待回访', filter: { status: 'closed', severity: 'all', category: 'all' }, special: 'pendingCallback' },
                { label: '高优先级', filter: { status: 'all', severity: 'high', category: 'all' } },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setStatus(item.filter.status);
                    setSeverity(item.filter.severity);
                    setCategory(item.filter.category);
                    setPage(1);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showDetailModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white">客诉详情</h2>
                <p className="text-sm text-gray-400">工单ID: {selectedComplaint.id}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-white animate-pulse">加载中...</div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">投诉类型</label>
                      <p className="text-white text-lg">{selectedComplaint.category}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">紧急程度</label>
                        <SeverityBadge severity={selectedComplaint.severity} />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">处理状态</label>
                        <StatusBadge status={selectedComplaint.status} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">问题描述</label>
                      <p className="text-gray-300">{selectedComplaint.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-white">{selectedComplaint.property_name}</span>
                      <span className="text-gray-400">({selectedComplaint.region})</span>
                    </div>
                    {selectedComplaint.platform_order_no && (
                      <div className="text-sm text-gray-400">
                        订单号: <span className="text-white font-mono">{selectedComplaint.platform_order_no}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">处理人</label>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{selectedComplaint.handler}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">创建时间</label>
                        <p className="text-white text-sm">{new Date(selectedComplaint.created_at).toLocaleString('zh-CN')}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">目标时限</label>
                        <p className="text-white text-sm">{Math.floor(selectedComplaint.target_time / 60)}小时{selectedComplaint.target_time % 60}分钟</p>
                      </div>
                    </div>
                    {selectedComplaint.processing_time > 0 && (
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">实际处理时长</label>
                        <p className={selectedComplaint.is_overdue ? 'text-danger-400 font-medium' : 'text-success-400 font-medium'}>
                          {Math.floor(selectedComplaint.processing_time / 60)}小时{selectedComplaint.processing_time % 60}分钟
                          {selectedComplaint.is_overdue && ' (超时)'}
                        </p>
                      </div>
                    )}
                    {selectedComplaint.escalated && (
                      <div className="bg-warning-500/10 border border-warning-500/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-warning-400 mb-1">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium">已升级至 {selectedComplaint.escalation_level} 级</span>
                        </div>
                        <p className="text-xs text-gray-400">升级时间: {selectedComplaint.escalated_at ? new Date(selectedComplaint.escalated_at).toLocaleString('zh-CN') : 'N/A'}</p>
                      </div>
                    )}
                    {selectedComplaint.callback_result && (
                      <div className="bg-success-500/10 border border-success-500/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-success-400 mb-1">
                          <PhoneCall className="w-4 h-4" />
                          <span className="font-medium">回访完成</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CallbackBadge result={selectedComplaint.callback_result} />
                          <span className="text-gray-400">{selectedComplaint.callback_note}</span>
                        </div>
                      </div>
                    )}
                    {selectedComplaint.responsibility && (
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">责任归属</label>
                        <p className="text-white">
                          {selectedComplaint.responsibility_dept} - {selectedComplaint.responsibility}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">* 用于解释口径和责任认定</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">处理记录</h3>
                  <div className="space-y-3 max-h-[200px] overflow-y-auto">
                    {selectedComplaint.logs.map((log: ComplaintLog) => (
                      <div key={log.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4 text-primary-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-medium">{log.action}</span>
                            <span className="text-gray-500 text-xs">{log.operator}</span>
                            <span className="text-gray-500 text-xs">{new Date(log.created_at).toLocaleString('zh-CN')}</span>
                          </div>
                          {log.note && <p className="text-gray-400 text-sm mt-1">{log.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">更新处理信息</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">处理状态</label>
                      <select
                        value={editForm.status}
                        onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                      >
                        {statuses.map(s => (
                          <option key={s.value} value={s.value} className="bg-slate-800">{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">处理人</label>
                      <input
                        type="text"
                        value={editForm.handler}
                        onChange={e => setEditForm(f => ({ ...f, handler: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">回访结果</label>
                      <select
                        value={editForm.callback_result}
                        onChange={e => setEditForm(f => ({ ...f, callback_result: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                      >
                        <option value="" className="bg-slate-800">未回访</option>
                        <option value="satisfied" className="bg-slate-800">满意</option>
                        <option value="unsatisfied" className="bg-slate-800">不满意</option>
                        <option value="pending" className="bg-slate-800">待跟进</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">责任归属</label>
                      <select
                        value={editForm.responsibility}
                        onChange={e => setEditForm(f => ({ ...f, responsibility: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                      >
                        <option value="" className="bg-slate-800">请选择</option>
                        {['客房部', '前台', '工程部', '安保部', '保洁部', '管理层'].map(r => (
                          <option key={r} value={r} className="bg-slate-800">{r}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-400 block mb-1">回访备注</label>
                      <input
                        type="text"
                        value={editForm.callback_note}
                        onChange={e => setEditForm(f => ({ ...f, callback_note: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                        placeholder="请输入回访备注..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-400 block mb-1">添加处理备注</label>
                      <textarea
                        value={editForm.note}
                        onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                        rows={3}
                        placeholder="请输入处理说明..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 text-gray-300 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                保存更新
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
