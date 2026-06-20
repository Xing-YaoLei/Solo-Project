'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus, AlertTriangle, Search, Filter, ChevronRight, ShieldAlert, Clock, User, Target,
  FileCheck2, BadgeCheck, ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useActivityId } from '@/components/ActivitySelector';
import { fmtDateTime, STATUS_STYLES, LABELS } from '@/lib/utils';

const STATUS_FILTERS = [
  { value: '', label: '全部' },
  ...Object.entries(LABELS.ExceptionStatus).map(([k, v]) => ({ value: k, label: v })),
];
const TYPE_FILTERS = [
  { value: '', label: '全部类型' },
  ...Object.entries(LABELS.ExceptionType).map(([k, v]) => ({ value: k, label: v })),
];

const SEVERITY_STYLES: Record<string, string> = {
  LOW: 'badge bg-emerald-100 text-emerald-700',
  MEDIUM: 'badge bg-amber-100 text-amber-700',
  HIGH: 'badge bg-orange-100 text-orange-700',
  CRITICAL: 'badge bg-rose-100 text-rose-700',
};

export default function ExceptionsPage() {
  const activityId = useActivityId();
  const [data, setData] = useState<any>({ list: [], total: 0 });
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const refresh = () => {
    api.get('/exceptions', { activityId, status, type, keyword, page, pageSize }).then(setData);
  };
  useEffect(() => { refresh(); }, [activityId, status, type, keyword, page]);

  const openNew = () => {
    setFormData({ activityId, type: 'REFUND_DISPUTE', title: '', description: '', impactScope: '', severity: 'MEDIUM', liabilityParty: 'UNCLEAR' });
    setShowForm(true);
  };

  const submit = async () => {
    await api.post('/exceptions', formData);
    setShowForm(false);
    refresh();
  };

  const groupByStatus: Record<string, number> = {};
  (data.list || []).forEach((e: any) => {
    groupByStatus[e.status] = (groupByStatus[e.status] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-rose-500" />
            异常处理台
          </h1>
          <p className="text-sm text-slate-500 mt-1">退票争议、座位冲突等异常单闭环处理，影响范围与责任归属明确记录</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus className="w-4 h-4" /> 新建异常单
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {[
          { label: '全部异常', value: data.total || 0, color: 'from-slate-500 to-slate-700', icon: AlertTriangle },
          { label: '待处理', value: groupByStatus.OPEN || 0, color: 'from-rose-500 to-rose-600', icon: Target },
          { label: '处理中', value: (groupByStatus.INVESTIGATING || 0) + (groupByStatus.PENDING_RESPONSE || 0), color: 'from-amber-500 to-orange-600', icon: Clock },
          { label: '已解决', value: (groupByStatus.RESOLVED || 0) + (groupByStatus.CLOSED || 0), color: 'from-emerald-500 to-teal-600', icon: BadgeCheck },
          { label: '已升级', value: groupByStatus.ESCALATED || 0, color: 'from-violet-500 to-purple-600', icon: ArrowUpRight },
        ].map((k) => (
          <div key={k.label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-500">{k.label}</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{k.value}</div>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.color} text-white flex items-center justify-center`}>
                <k.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="input pl-9"
            placeholder="异常单号 / 标题 / 描述"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select className="input !w-32" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select className="input !w-40" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            {TYPE_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>异常单号</th>
              <th>类型</th>
              <th>标题 / 关联</th>
              <th>严重程度</th>
              <th>责任归属</th>
              <th>处理人</th>
              <th>状态</th>
              <th>创建时间</th>
              <th className="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.list?.length === 0 && <tr><td colSpan={9} className="text-center py-10 text-slate-400">暂无异常单</td></tr>}
            {data.list?.map((e: any) => (
              <tr key={e.id}>
                <td className="font-mono text-brand-600 font-semibold">{e.exceptionNo}</td>
                <td>
                  <span className="badge bg-indigo-50 text-indigo-700">
                    {LABELS.ExceptionType[e.type] || e.type}
                  </span>
                </td>
                <td>
                  <div className="font-medium text-slate-900 max-w-xs truncate">{e.title}</div>
                  {e.order && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      关联订单：
                      <Link href={`/orders/${e.orderId}`} className="text-brand-600 hover:underline ml-1">
                        {e.order.orderNo}
                      </Link>
                      {e.order.customerName && <span className="text-slate-400 ml-1">({e.order.customerName})</span>}
                    </div>
                  )}
                </td>
                <td>
                  <span className={SEVERITY_STYLES[e.severity] || SEVERITY_STYLES.MEDIUM}>
                    {LABELS.Severity[e.severity] || e.severity}
                  </span>
                </td>
                <td>
                  <span className="badge bg-slate-100 text-slate-700">
                    {LABELS.LiabilityParty[e.liabilityParty] || e.liabilityParty}
                  </span>
                </td>
                <td>
                  {e.handlerName ? (
                    <div className="text-sm flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {e.handlerName}
                    </div>
                  ) : <span className="text-slate-400 text-xs">未分配</span>}
                </td>
                <td>
                  <span className={STATUS_STYLES[e.status]}>{LABELS.ExceptionStatus[e.status] || e.status}</span>
                </td>
                <td className="text-xs text-slate-500">{fmtDateTime(e.createdAt)}</td>
                <td className="text-right">
                  <Link href={`/exceptions/${e.id}`} className="btn-secondary !px-3 !py-1 text-xs inline-flex items-center">
                    处理 <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-6" onClick={() => setShowForm(false)}>
          <div className="card w-full max-w-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                新建异常单
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">异常类型</label>
                  <select className="input" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                    {Object.entries(LABELS.ExceptionType).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">严重程度</label>
                  <select className="input" value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })}>
                    {Object.entries(LABELS.Severity).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">标题</label>
                <input className="input" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="一句话概括异常" />
              </div>
              <div>
                <label className="label">详细描述</label>
                <textarea className="input min-h-[80px]" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <label className="label">影响范围</label>
                <textarea className="input min-h-[60px]" value={formData.impactScope || ''} onChange={(e) => setFormData({ ...formData, impactScope: e.target.value })} placeholder="涉及订单数、金额、客户数量等" />
              </div>
              <div>
                <label className="label">关联订单 ID（可选）</label>
                <input className="input" value={formData.orderId || ''} onChange={(e) => setFormData({ ...formData, orderId: e.target.value })} />
              </div>
              <div>
                <label className="label">初步责任归属</label>
                <select className="input" value={formData.liabilityParty} onChange={(e) => setFormData({ ...formData, liabilityParty: e.target.value })}>
                  {Object.entries(LABELS.LiabilityParty).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>取消</button>
              <button className="btn-primary" onClick={submit}>提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
