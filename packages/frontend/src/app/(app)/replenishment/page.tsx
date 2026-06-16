'use client';

import { useEffect, useState } from 'react';
import { replenishmentApi, followUpApi } from '@/lib/api';
import type { ReplenishmentOrder } from '@/lib/types';
import Link from 'next/link';

export default function ReplenishmentPage() {
  const [orders, setOrders] = useState<ReplenishmentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await replenishmentApi.getOrders();
        setOrders(res.data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreateTask = async (orderId: string) => {
    try {
      await replenishmentApi.createFromOrder(orderId);
      const res = await replenishmentApi.getOrders();
      setOrders(res.data);
    } catch {
    }
  };

  if (loading) return <div className="animate-pulse text-surface-200 text-lg p-8">加载中...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">补货单管理</h1>
        <p className="text-surface-200 mt-1">从补货单发起用药回访任务</p>
      </div>

      <div className="bg-surface-800 rounded-xl border border-surface-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700 text-left">
              <th className="px-5 py-3 text-xs font-medium text-surface-200">单号</th>
              <th className="px-5 py-3 text-xs font-medium text-surface-200">药品名称</th>
              <th className="px-5 py-3 text-xs font-medium text-surface-200">规格</th>
              <th className="px-5 py-3 text-xs font-medium text-surface-200">生产厂商</th>
              <th className="px-5 py-3 text-xs font-medium text-surface-200">数量</th>
              <th className="px-5 py-3 text-xs font-medium text-surface-200">金额</th>
              <th className="px-5 py-3 text-xs font-medium text-surface-200">门店</th>
              <th className="px-5 py-3 text-xs font-medium text-surface-200">状态</th>
              <th className="px-5 py-3 text-xs font-medium text-surface-200">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-surface-700/50 transition-colors">
                <td className="px-5 py-3 text-sm text-primary-400 font-mono">{order.orderNo}</td>
                <td className="px-5 py-3 text-sm text-surface-50">{order.drugName}</td>
                <td className="px-5 py-3 text-sm text-surface-200">{order.drugSpec}</td>
                <td className="px-5 py-3 text-sm text-surface-200">{order.manufacturer}</td>
                <td className="px-5 py-3 text-sm text-surface-200">{order.quantity}</td>
                <td className="px-5 py-3 text-sm text-surface-200">¥{order.totalAmount.toFixed(2)}</td>
                <td className="px-5 py-3 text-sm text-surface-200">{order.storeName}</td>
                <td className="px-5 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-400">{order.status}</span>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleCreateTask(order.id)}
                    className="text-xs px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
                  >
                    发起回访
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="px-5 py-12 text-center text-surface-200">暂无补货单</div>
        )}
      </div>
    </div>
  );
}
