import { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatDateTime } from '../utils/helpers';

interface MissedOrder {
  id: string;
  taskId: string;
  propertyId: string;
  detectedAt: string;
  resolvedAt?: string;
  reason?: string;
  status: string;
  notifiedRoles: string[];
  task?: {
    id: string;
    status: string;
    scheduledStart: string;
    scheduledEnd: string;
    property?: { name: string; roomNumber: string };
    assignedTo?: { name: string };
  };
}

export default function MissedOrdersPage() {
  const [orders, setOrders] = useState<MissedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<MissedOrder | null>(null);
  const [resolveReason, setResolveReason] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const result = await api.get('/missed-orders', {
        params: { status: statusFilter || undefined },
      }) as unknown as MissedOrder[];
      setOrders(result);
    } catch (error) {
      console.error('获取漏单失败:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedOrder || !resolveReason) return;
    
    try {
      await api.put(`/missed-orders/${selectedOrder.id}/resolve`, {
        resolvedById: 'demo-user-id',
        reason: resolveReason,
      });
      setSelectedOrder(null);
      setResolveReason('');
      fetchOrders();
    } catch (error) {
      console.error('处理漏单失败:', error);
    }
  };

  const roleMap: Record<string, string> = {
    ADMIN: '管理员',
    MANAGER: '经理',
    HOUSEKEEPER: '保洁员',
    RECEPTIONIST: '前台',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">全部状态</option>
            <option value="open">待处理</option>
            <option value="resolved">已处理</option>
          </select>
          <span className="text-sm text-gray-500">
            共 {orders.length} 条漏单记录
          </span>
        </div>
        <button onClick={fetchOrders} className="btn-secondary">
          🔄 刷新
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500">加载中...</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="card p-4 border-l-4 border-l-red-500"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-gray-900">
                      {order.task?.property?.name}
                    </h3>
                    <span
                      className={`status-badge ${
                        order.status === 'open'
                          ? 'status-missed'
                          : 'status-completed'
                      }`}
                    >
                      {order.status === 'open' ? '待处理' : '已处理'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    房号: {order.task?.property?.roomNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">检测时间</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDateTime(order.detectedAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">计划开始</p>
                  <p className="font-medium mt-1">
                    {order.task?.scheduledStart ? formatDateTime(order.task.scheduledStart) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">计划结束</p>
                  <p className="font-medium mt-1">
                    {order.task?.scheduledEnd ? formatDateTime(order.task.scheduledEnd) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">保洁员</p>
                  <p className="font-medium mt-1">
                    {order.task?.assignedTo?.name || '未指派'}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">通知角色</p>
                <div className="flex flex-wrap gap-2">
                  {order.notifiedRoles.map((role) => (
                    <span
                      key={role}
                      className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded"
                    >
                      {roleMap[role] || role}
                    </span>
                  ))}
                </div>
              </div>

              {order.reason && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500 mb-1">原因</p>
                  <p className="text-sm text-gray-700">{order.reason}</p>
                </div>
              )}

              {order.resolvedAt && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-green-600">
                    ✅ 已于 {formatDateTime(order.resolvedAt)} 处理完成
                  </p>
                </div>
              )}

              {order.status === 'open' && (
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="btn"
                  >
                    处理漏单
                  </button>
                </div>
              )}
            </div>
          ))}
          {orders.length === 0 && (
            <div className="card p-12 text-center text-gray-400">
              暂无漏单记录
            </div>
          )}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">处理漏单</h3>
            <p className="text-sm text-gray-600 mb-4">
              房源: {selectedOrder.task?.property?.name} (
              {selectedOrder.task?.property?.roomNumber})
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                处理说明
              </label>
              <textarea
                value={resolveReason}
                onChange={(e) => setResolveReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={4}
                placeholder="请输入处理说明和原因"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setResolveReason('');
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolveReason}
                className="btn"
              >
                确认处理
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
