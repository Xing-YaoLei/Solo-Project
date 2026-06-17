import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useAuthStore, hasPermission } from '@/hooks/useAuthStore';
import { getDailyWorkOrders, getWorkOrders } from '@/api/workOrders';
import type { WorkOrderDailyItem, WorkOrderStatus, WorkOrderCategory, WorkOrderPriority } from '@/types';
import { statusLabels, statusColors, priorityLabels, priorityColors, categoryLabels, categoryColors } from '@/utils/constants';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import dayjs from 'dayjs';
import CreateWorkOrderModal from '@/components/CreateWorkOrderModal';

export default function WorkOrderList() {
  const [orders, setOrders] = useState<WorkOrderDailyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<WorkOrderDailyItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | ''>('');
  const [keyword, setKeyword] = useState('');
  const { user } = useAuthStore();
  const isManager = user ? hasPermission(user.role, 'manager') : false;

  useEffect(() => {
    fetchDailyOrders();
  }, []);

  const fetchDailyOrders = async () => {
    setLoading(true);
    try {
      const response = await getDailyWorkOrders(0, 100);
      setOrders(response.items);
      setAllOrders(response.items);
    } catch (err) {
      console.error('获取工单列表失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...allOrders];

    if (statusFilter) {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.title.toLowerCase().includes(kw) ||
          o.order_no.toLowerCase().includes(kw) ||
          o.location.toLowerCase().includes(kw)
      );
    }

    setOrders(filtered);
  }, [statusFilter, keyword, allOrders]);

  const handleCreated = () => {
    fetchDailyOrders();
    setShowCreateModal(false);
  };

  const getStatusBadgeClass = (order: WorkOrderDailyItem) => {
    if (order.review_failed) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (order.is_overdue) {
      return 'bg-orange-100 text-orange-800 border-orange-300';
    }
    return statusColors[order.status];
  };

  const getStatusText = (order: WorkOrderDailyItem) => {
    if (order.review_failed) {
      return '复核不通过';
    }
    return statusLabels[order.status];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工单列表</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isManager ? '查看和管理所有报修工单' : '您负责的工单和待办事项'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建工单
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索工单号、标题或位置..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as WorkOrderStatus | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">全部状态</option>
              <option value="pending">待派工</option>
              <option value="assigned">已派工</option>
              <option value="in_progress">处理中</option>
              <option value="reviewing">复核中</option>
              <option value="review_failed">复核不通过</option>
              <option value="closed">已结案</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">加载中...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-4">暂无工单</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to="/work-orders/$orderId"
              params={{ orderId: String(order.id) }}
              className={`block bg-white rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 ${
                order.review_failed
                  ? 'border-red-500 bg-red-50/30'
                  : order.is_overdue
                  ? 'border-orange-500 bg-orange-50/30'
                  : 'border-transparent hover:border-primary-500'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                          order
                        )}`}
                      >
                        {order.review_failed && (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {getStatusText(order)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          priorityColors[order.priority]
                        }`}
                      >
                        {priorityLabels[order.priority]}优先级
                      </span>
                      <span className="text-xs text-gray-500">
                        {order.order_no}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      {order.title}
                    </h3>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {order.location}
                      </span>
                      <span className="flex items-center">
                        <span
                          className={`w-2 h-2 rounded-full mr-1.5 ${
                            categoryColors[order.category as WorkOrderCategory]
                          }`}
                        />
                        {categoryLabels[order.category as WorkOrderCategory]}
                      </span>
                      {order.assigned_worker_name && (
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {order.assigned_worker_name}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {dayjs(order.created_at).format('MM-DD HH:mm')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    {order.deadline && (
                      <div
                        className={`text-right ${
                          order.is_overdue ? 'text-red-600' : 'text-gray-500'
                        }`}
                      >
                        <div className="flex items-center text-sm">
                          {order.is_overdue && (
                            <AlertTriangle className="w-4 h-4 mr-1" />
                          )}
                          {order.is_overdue ? '已超时' : '截止时间'}
                        </div>
                        <div className="text-xs mt-0.5">
                          {dayjs(order.deadline).format('MM-DD HH:mm')}
                        </div>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateWorkOrderModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
