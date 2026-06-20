'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, ChevronRight, History, XCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { useActivityId } from '@/components/ActivitySelector';
import { fmtMoney, fmtDateTime, STATUS_STYLES, LABELS } from '@/lib/utils';

const STATUS_FILTERS = [
  { value: '', label: '全部' },
  ...Object.entries(LABELS.OrderStatus).map(([k, v]) => ({ value: k, label: v })),
];

export default function OrdersPage() {
  const activityId = useActivityId();
  const [data, setData] = useState<any>({ list: [], total: 0 });
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const refresh = () => {
    api.get('/orders', { activityId, status, keyword, page, pageSize }).then(setData);
  };
  useEffect(() => { refresh(); }, [activityId, status, keyword, page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">购票订单</h1>
          <p className="text-sm text-slate-500 mt-1">订单从创建、支付、确认到完成/退款的全生命周期管理</p>
        </div>
        <Link href="/orders/new" className="btn-primary">
          <Plus className="w-4 h-4" /> 新建订单
        </Link>
      </div>

      <div className="card p-4 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="input pl-9"
            placeholder="订单号 / 客户姓名 / 手机号"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600">状态：</span>
          <select className="input !w-36" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div className="ml-auto text-sm text-slate-500">共 {data.total} 条</div>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>票种明细</th>
              <th>金额</th>
              <th>状态</th>
              <th>来源</th>
              <th>时间</th>
              <th className="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.list?.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-slate-400">暂无订单</td></tr>}
            {data.list?.map((o: any) => (
              <tr key={o.id}>
                <td>
                  <Link href={`/orders/${o.id}`} className="font-mono text-brand-600 hover:underline">{o.orderNo}</Link>
                </td>
                <td>
                  <div className="font-medium text-slate-900">{o.customerName}</div>
                  <div className="text-xs text-slate-500">{o.customerPhone}</div>
                </td>
                <td>
                  <div className="text-sm text-slate-700">
                    {o.orderItems?.slice(0, 2).map((i: any) => (
                      <div key={i.id}>{i.ticketType?.name} × {i.quantity}</div>
                    ))}
                    {(o.orderItems?.length || 0) > 2 && <div className="text-xs text-slate-400">... 还有 {(o.orderItems.length - 2)} 项</div>}
                  </div>
                </td>
                <td>
                  <div className="font-semibold text-slate-900">¥{fmtMoney(o.totalAmount)}</div>
                  <div className="text-xs text-slate-500">实付 ¥{fmtMoney(o.paidAmount)}</div>
                </td>
                <td>
                  <span className={STATUS_STYLES[o.status]}>{LABELS.OrderStatus[o.status] || o.status}</span>
                </td>
                <td className="text-sm">{o.sourceChannel || 'ONLINE'}</td>
                <td className="text-xs text-slate-500">{fmtDateTime(o.createdAt)}</td>
                <td className="text-right">
                  <Link href={`/orders/${o.id}`} className="btn-secondary !px-3 !py-1 text-xs inline-flex">
                    详情 <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.total > pageSize && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              className="btn-outline !px-3 !py-1 text-xs disabled:opacity-50"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >上一页</button>
            <span className="text-sm text-slate-500">第 {page} 页 / 共 {Math.ceil(data.total / pageSize)} 页</span>
            <button
              className="btn-outline !px-3 !py-1 text-xs disabled:opacity-50"
              disabled={page * pageSize >= data.total}
              onClick={() => setPage((p) => p + 1)}
            >下一页</button>
          </div>
        )}
      </div>
    </div>
  );
}
