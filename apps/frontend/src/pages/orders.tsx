import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Search, Plus, Filter, Eye, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { cn, formatDate, getStatusText, getStatusClass } from '@/lib/utils';

interface Order {
  id: number;
  orderNo: string;
  channel: string;
  channelOrderNo: string;
  guestName: string;
  guestPhone: string;
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalAmount: number;
  status: string;
  specialRequests: string;
  property: { name: string };
  room: { roomNumber: string; roomType: string };
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [page, keyword, statusFilter, channelFilter, propertyId]);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties?pageSize=100');
      setProperties(res.data.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;
      if (channelFilter) params.channel = channelFilter;
      if (propertyId) params.propertyId = propertyId;

      const res = await api.get('/orders', { params });
      setOrders(res.data.list || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const viewOrder = async (order: Order) => {
    try {
      const res = await api.get(`/orders/${order.id}`);
      setSelectedOrder(res.data);
      setShowDetail(true);
    } catch (e) {
      console.error(e);
    }
  };

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      fetchOrders();
      if (showDetail) {
        const res = await api.get(`/orders/${id}`);
        setSelectedOrder(res.data);
      }
    } catch (e) {
      alert('操作失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const getChannelText = (channel: string) => {
    const channels: Record<string, string> = {
      AIRBNB: 'Airbnb',
      TRIP_ADVISOR: 'TripAdvisor',
      BOOKING_COM: 'Booking.com',
      MEITUAN: '美团',
      XIANCHENG: '携程',
      DIRECT: '直订',
      OTHER: '其他',
    };
    return channels[channel] || channel;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号、客人姓名..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input pl-10 w-72"
            />
          </div>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="input w-40"
          >
            <option value="">全部房源</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-32"
          >
            <option value="">全部状态</option>
            <option value="PENDING">待确认</option>
            <option value="CONFIRMED">已确认</option>
            <option value="CHECKED_IN">已入住</option>
            <option value="CHECKED_OUT">已退房</option>
            <option value="CANCELLED">已取消</option>
          </select>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="input w-32"
          >
            <option value="">全部渠道</option>
            <option value="AIRBNB">Airbnb</option>
            <option value="BOOKING_COM">Booking</option>
            <option value="MEITUAN">美团</option>
            <option value="XIANCHENG">携程</option>
            <option value="DIRECT">直订</option>
          </select>
        </div>
        <button className="btn btn-primary flex items-center gap-1">
          <Plus className="w-4 h-4" />
          新建订单
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-500">今日入住</div>
          <div className="text-2xl font-bold text-green-600 mt-1">-</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">今日退房</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">-</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">在住客人</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">-</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">订单总数</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{total}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">订单号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">渠道</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">客人信息</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">房源/房间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">入住/退房</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">金额</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    暂无订单数据
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{order.orderNo}</div>
                      <div className="text-xs text-gray-500">{order.channelOrderNo}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getChannelText(order.channel)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{order.guestName}</div>
                      <div className="text-xs text-gray-500">{order.guestPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-800">{order.property?.name}</div>
                      <div className="text-xs text-gray-500">
                        {order.room?.roomNumber} · {order.room?.roomType}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-800">{formatDate(order.checkInDate)}</div>
                      <div className="text-gray-500">
                        至 {formatDate(order.checkOutDate)} ({order.nights}晚)
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">
                        ¥{order.totalAmount}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', getStatusClass(order.status))}>
                        {getStatusText(order.status, 'order')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewOrder(order)}
                          className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          详情
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              共 {total} 条，第 {page}/{totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {showDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">订单详情</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-3">基本信息</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">订单号：</span>
                    <span className="text-gray-800">{selectedOrder.orderNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">渠道：</span>
                    <span className="text-gray-800">{getChannelText(selectedOrder.channel)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">渠道单号：</span>
                    <span className="text-gray-800">{selectedOrder.channelOrderNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">状态：</span>
                    <span className={cn('badge', getStatusClass(selectedOrder.status))}>
                      {getStatusText(selectedOrder.status, 'order')}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-3">客人信息</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">姓名：</span>
                    <span className="text-gray-800">{selectedOrder.guestName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">电话：</span>
                    <span className="text-gray-800">{selectedOrder.guestPhone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">人数：</span>
                    <span className="text-gray-800">{selectedOrder.guestCount}人</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-3">入住信息</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">房源：</span>
                    <span className="text-gray-800">{selectedOrder.property?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">房间：</span>
                    <span className="text-gray-800">
                      {selectedOrder.room?.roomNumber} · {selectedOrder.room?.roomType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">入住日期：</span>
                    <span className="text-gray-800">{formatDate(selectedOrder.checkInDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">退房日期：</span>
                    <span className="text-gray-800">{formatDate(selectedOrder.checkOutDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">入住天数：</span>
                    <span className="text-gray-800">{selectedOrder.nights}晚</span>
                  </div>
                  <div>
                    <span className="text-gray-500">订单金额：</span>
                    <span className="text-gray-800 font-medium">¥{selectedOrder.totalAmount}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.specialRequests && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">特殊要求</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {selectedOrder.specialRequests}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {selectedOrder.status === 'PENDING' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'CONFIRMED')}
                    className="btn btn-primary flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    确认订单
                  </button>
                )}
                {selectedOrder.status === 'CONFIRMED' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'CHECKED_IN')}
                    className="btn btn-primary flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    办理入住
                  </button>
                )}
                {selectedOrder.status === 'CHECKED_IN' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'CHECKED_OUT')}
                    className="btn btn-primary flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    办理退房
                  </button>
                )}
                {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'CHECKED_OUT' && (
                  <button
                    onClick={() => {
                      if (confirm('确定取消该订单吗？')) {
                        updateOrderStatus(selectedOrder.id, 'CANCELLED');
                      }
                    }}
                    className="btn btn-danger flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    取消订单
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
