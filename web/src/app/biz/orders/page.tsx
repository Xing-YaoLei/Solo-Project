'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApi, buildQuery } from '@/lib/api';

interface OrderItem {
  id: string;
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNo: string;
  buyerName: string;
  buyerPhone: string;
  totalAmount: number;
  status: string;
  assigneeId?: string;
  assigneeName?: string;
  eventId?: string;
  eventName?: string;
  items?: OrderItem[];
  createdAt: string;
}

interface ListResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'cancelled', label: '已取消' },
  { value: 'refunded', label: '已退款' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
  refunded: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [filterEventId, setFilterEventId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssigneeId, setFilterAssigneeId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailItems, setDetailItems] = useState<OrderItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdateId, setStatusUpdateId] = useState<string | null>(null);
  const [statusUpdateValue, setStatusUpdateValue] = useState('');
  const [assignId, setAssignId] = useState<string | null>(null);
  const [assignValue, setAssignValue] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQuery({
        page,
        limit,
        eventId: filterEventId || undefined,
        status: filterStatus || undefined,
        assigneeId: filterAssigneeId || undefined,
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
      });
      const res = await fetchApi<ListResponse>(`/orders${qs}`);
      setItems(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterEventId, filterStatus, filterAssigneeId, filterDateFrom, filterDateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(total / limit);

  const handleExpand = async (order: Order) => {
    if (expandedId === order.id) {
      setExpandedId(null);
      setDetailItems([]);
      return;
    }
    setExpandedId(order.id);
    if (order.items && order.items.length > 0) {
      setDetailItems(order.items);
      return;
    }
    setDetailLoading(true);
    try {
      const res = await fetchApi<Order>(`/orders/${order.id}`);
      setDetailItems(res.items || []);
    } catch (e) {
      console.error(e);
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string) => {
    try {
      await fetchApi(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: statusUpdateValue }),
      });
      setStatusUpdateId(null);
      setStatusUpdateValue('');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssign = async (orderId: string) => {
    try {
      await fetchApi(`/orders/${orderId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ assigneeId: assignValue }),
      });
      setAssignId(null);
      setAssignValue('');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const statusLabel = (s: string) => STATUS_OPTIONS.find((o) => o.value === s)?.label || s;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">订单管理</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs text-gray-500 mb-1">活动ID</label>
          <input value={filterEventId} onChange={(e) => { setFilterEventId(e.target.value); setPage(1); }} placeholder="输入活动ID" className="border rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">状态</label>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">处理人ID</label>
          <input value={filterAssigneeId} onChange={(e) => { setFilterAssigneeId(e.target.value); setPage(1); }} placeholder="输入处理人ID" className="border rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">开始日期</label>
          <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">结束日期</label>
          <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">订单号</th>
                <th className="px-4 py-3 text-left">买家姓名</th>
                <th className="px-4 py-3 text-left">买家电话</th>
                <th className="px-4 py-3 text-left">总金额</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-left">处理人</th>
                <th className="px-4 py-3 text-left">创建时间</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <>
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.orderNo}</td>
                    <td className="px-4 py-3">{item.buyerName}</td>
                    <td className="px-4 py-3 text-gray-600">{item.buyerPhone}</td>
                    <td className="px-4 py-3">¥{Number(item.totalAmount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-700'}`}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.assigneeName || item.assigneeId || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString('zh-CN')}</td>
                    <td className="px-4 py-3 space-x-1">
                      <button onClick={() => handleExpand(item)} className="text-blue-600 hover:underline text-xs">
                        {expandedId === item.id ? '收起' : '详情'}
                      </button>
                      <button onClick={() => { setStatusUpdateId(item.id); setStatusUpdateValue(item.status); }} className="text-orange-600 hover:underline text-xs">状态</button>
                      <button onClick={() => { setAssignId(item.id); setAssignValue(item.assigneeId || ''); }} className="text-purple-600 hover:underline text-xs">分配</button>
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <tr key={`${item.id}-detail`}>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50">
                        {detailLoading ? (
                          <div className="text-gray-400 text-xs">加载明细...</div>
                        ) : detailItems.length > 0 ? (
                          <div>
                            <div className="text-xs font-medium mb-2 text-gray-600">订单明细</div>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-500">
                                  <th className="text-left py-1 px-2">票种</th>
                                  <th className="text-left py-1 px-2">单价</th>
                                  <th className="text-left py-1 px-2">数量</th>
                                  <th className="text-left py-1 px-2">小计</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detailItems.map((di) => (
                                  <tr key={di.id} className="border-t border-gray-200">
                                    <td className="py-1 px-2">{di.ticketTypeName || di.ticketTypeId}</td>
                                    <td className="py-1 px-2">¥{Number(di.unitPrice).toFixed(2)}</td>
                                    <td className="py-1 px-2">{di.quantity}</td>
                                    <td className="py-1 px-2">¥{Number(di.subtotal).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-gray-400 text-xs">暂无明细</div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        )}
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
          <span>共 {total} 条</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded disabled:opacity-50">上一页</button>
            <span className="px-3 py-1">{page} / {totalPages || 1}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded disabled:opacity-50">下一页</button>
          </div>
        </div>
      </div>

      {statusUpdateId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">更新订单状态</h2>
            <select value={statusUpdateValue} onChange={(e) => setStatusUpdateValue(e.target.value)} className="w-full border rounded px-3 py-2 text-sm mb-4">
              <option value="paid">已支付</option>
              <option value="cancelled">已取消</option>
              <option value="refunded">已退款</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setStatusUpdateId(null); setStatusUpdateValue(''); }} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">取消</button>
              <button onClick={() => handleStatusUpdate(statusUpdateId)} className="px-4 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700">确认</button>
            </div>
          </div>
        </div>
      )}

      {assignId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">分配处理人</h2>
            <input value={assignValue} onChange={(e) => setAssignValue(e.target.value)} placeholder="输入处理人ID" className="w-full border rounded px-3 py-2 text-sm mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setAssignId(null); setAssignValue(''); }} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">取消</button>
              <button onClick={() => handleAssign(assignId)} className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
