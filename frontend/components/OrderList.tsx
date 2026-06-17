import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { statusLabels, statusColors, formatDateTime, priorityLabels, priorityColors } from '../lib/utils';
import { Search, Filter, Plus } from 'lucide-react';
import { OrderStatus, OrderSource, sourceLabels } from '../types';

export default function OrderList() {
  const { orders, totalOrders, selectedOrder, selectOrder, filters, setFilters, loading } = useAppStore();
  const [showFilters, setShowFilters] = useState(false);

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: OrderStatus.CREATED, label: statusLabels[OrderStatus.CREATED] },
    { value: OrderStatus.ASSIGNED, label: statusLabels[OrderStatus.ASSIGNED] },
    { value: OrderStatus.IN_PROGRESS, label: statusLabels[OrderStatus.IN_PROGRESS] },
    { value: OrderStatus.COMPLETED, label: statusLabels[OrderStatus.COMPLETED] },
    { value: OrderStatus.PENDING_SUPPLEMENT, label: statusLabels[OrderStatus.PENDING_SUPPLEMENT] },
    { value: OrderStatus.UNDER_REVIEW, label: statusLabels[OrderStatus.UNDER_REVIEW] },
    { value: OrderStatus.CLOSED, label: statusLabels[OrderStatus.CLOSED] },
  ];

  const sourceOptions = [
    { value: '', label: '全部来源' },
    { value: OrderSource.PHONE, label: sourceLabels[OrderSource.PHONE] },
    { value: OrderSource.APP, label: sourceLabels[OrderSource.APP] },
    { value: OrderSource.WECHAT, label: sourceLabels[OrderSource.WECHAT] },
    { value: OrderSource.WALK_IN, label: sourceLabels[OrderSource.WALK_IN] },
    { value: OrderSource.MAINTENANCE_TEAM, label: sourceLabels[OrderSource.MAINTENANCE_TEAM] },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            派单列表
            <span className="ml-2 text-sm font-normal text-gray-500">共 {totalOrders} 条</span>
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索单号、房号、租客..."
            value={filters.keyword || ''}
            onChange={(e) => setFilters({ keyword: e.target.value, page: 1 })}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ status: e.target.value as OrderStatus || undefined, page: 1 })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={filters.source || ''}
              onChange={(e) => setFilters({ source: e.target.value as OrderSource || undefined, page: 1 })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {sourceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-400">加载中...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <ClipboardList className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">暂无派单</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => selectOrder(order)}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedOrder?.id === order.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{order.orderNo}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-700">{order.apartmentNo}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-sm text-gray-600">{order.faultType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 text-xs rounded ${priorityColors[order.priority]}`}>
                      {priorityLabels[order.priority]}
                    </span>
                    {order.delayRecords && order.delayRecords.length > 0 && (
                      <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded">
                        延误
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>
                {order.assignPerson && (
                  <div className="mt-2 text-xs text-gray-500">
                    负责人：{order.assignPerson.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            第 {filters.page} 页
          </span>
          <div className="flex gap-1">
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilters({ page: filters.page - 1 })}
              className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <button
              disabled={filters.page * filters.pageSize >= totalOrders}
              onClick={() => setFilters({ page: filters.page + 1 })}
              className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClipboardList(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>;
}
