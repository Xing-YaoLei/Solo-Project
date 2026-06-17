import { useState, useMemo } from 'react';
import { mockWorkOrders } from '@/data/mockData';
import { useAppStore } from '@/store/useAppStore';
import type { WorkOrder, WorkOrderStatus, WorkOrderPriority } from '@/types';

const statusLabelMap: Record<WorkOrderStatus, string> = {
  pending: '待处理',
  assigned: '已分配',
  in_progress: '进行中',
  completed: '已完成',
  delayed: '已延误',
  rejected: '已驳回',
};

const statusTwMap: Record<WorkOrderStatus, string> = {
  pending: 'bg-status-info/20 text-status-info',
  assigned: 'bg-amber-500/20 text-amber-400',
  in_progress: 'bg-status-success/20 text-status-success',
  completed: 'bg-status-muted/20 text-status-muted',
  delayed: 'bg-status-danger/20 text-status-danger',
  rejected: 'bg-status-danger/20 text-status-danger',
};

const priorityLabelMap: Record<WorkOrderPriority, string> = {
  urgent: '紧急',
  high: '高',
  normal: '普通',
  low: '低',
};

const priorityTwMap: Record<WorkOrderPriority, string> = {
  urgent: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  normal: 'bg-blue-500/20 text-blue-400',
  low: 'bg-gray-500/20 text-gray-400',
};

const statusOptions: { value: '' | WorkOrderStatus; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'assigned', label: '已分配' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'delayed', label: '已延误' },
  { value: 'rejected', label: '已驳回' },
];

const priorityOptions: { value: '' | WorkOrderPriority; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'urgent', label: '紧急' },
  { value: 'high', label: '高' },
  { value: 'normal', label: '普通' },
  { value: 'low', label: '低' },
];

const categoryOptions: { value: string; label: string }[] = [
  { value: '', label: '全部' },
  { value: '水管', label: '水管' },
  { value: '空调', label: '空调' },
  { value: '电路', label: '电路' },
  { value: '门窗', label: '门窗' },
  { value: '热水器', label: '热水器' },
  { value: '厨卫', label: '厨卫' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DetailPanel({
  order,
  onClose,
  maskPhone,
  hideCost,
}: {
  order: WorkOrder;
  onClose: () => void;
  maskPhone: boolean;
  hideCost: boolean;
}) {
  return (
    <div className="w-96 bg-navy-800 border-l border-navy-700/50 h-full flex flex-col animate-slide-in">
      <div className="flex items-center justify-between p-4 border-b border-navy-700/50">
        <h2 className="font-heading font-semibold text-white text-sm">工单详情</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md hover:bg-navy-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-mono-data text-xs text-gray-500">{order.id}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priorityTwMap[order.priority]}`}>
              {priorityLabelMap[order.priority]}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusTwMap[order.status]}`}>
              {statusLabelMap[order.status]}
            </span>
          </div>
          <h3 className="font-heading font-semibold text-white text-base">{order.title}</h3>
          <p className="text-sm text-gray-400 leading-relaxed">{order.description}</p>
        </div>

        <div className="rounded-lg bg-navy-700/40 border border-navy-700/50 p-3 space-y-2">
          <h4 className="font-heading text-xs font-semibold text-gray-400 uppercase tracking-wider">基本信息</h4>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
            <div>
              <span className="text-gray-500">租户</span>
              <p className="text-gray-200">{order.tenantName}</p>
            </div>
            <div>
              <span className="text-gray-500">联系电话</span>
              <p className="text-gray-200">{maskPhone ? '***' : order.tenantPhone}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">房间地址</span>
              <p className="text-gray-200">{order.roomAddress}</p>
            </div>
            <div>
              <span className="text-gray-500">类别</span>
              <p className="text-gray-200">{order.category}</p>
            </div>
            <div>
              <span className="text-gray-500">负责人</span>
              <p className="text-gray-200">{order.assignedTo || '—'}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">计划时间</span>
              <p className="font-mono-data text-gray-200">{formatDate(order.scheduledAt)}</p>
            </div>
          </div>
        </div>

        {order.delayReason && (
          <div className="rounded-lg bg-status-danger/10 border border-status-danger/30 p-3">
            <h4 className="font-heading text-xs font-semibold text-status-danger uppercase tracking-wider mb-1">延误原因</h4>
            <p className="text-sm text-status-danger/80">{order.delayReason}</p>
          </div>
        )}

        <div>
          <h4 className="font-heading text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">维修照片</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="aspect-square rounded-md bg-navy-700/60 border border-navy-600/40" />
            <div className="aspect-square rounded-md bg-navy-700/60 border border-navy-600/40" />
            <div className="aspect-square rounded-md bg-navy-700/60 border border-navy-600/40" />
          </div>
        </div>

        {order.status === 'completed' && (
          <>
            <div>
              <h4 className="font-heading text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">签收凭证</h4>
              <div className="rounded-lg bg-navy-700/40 border border-navy-700/50 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">签名</span>
                  <div className="w-20 h-8 rounded bg-navy-700/60 border border-navy-600/40 flex items-center justify-center text-gray-600 text-[10px]">签名区</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="aspect-video rounded-md bg-navy-700/60 border border-navy-600/40" />
                  <div className="aspect-video rounded-md bg-navy-700/60 border border-navy-600/40" />
                </div>
                <div className="text-xs text-gray-500">
                  完成时间: <span className="font-mono-data text-gray-300">{order.completedAt ? formatDate(order.completedAt) : '—'}</span>
                </div>
              </div>
            </div>

            {order.cost !== null && !hideCost && (
              <div>
                <h4 className="font-heading text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">费用明细</h4>
                <div className="rounded-lg bg-navy-700/40 border border-navy-700/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">维修费用</span>
                    <span className="font-mono-data text-lg text-amber-400 font-semibold">¥{order.cost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function WorkOrders() {
  const currentUser = useAppStore((s) => s.currentUser);
  const maskPhone = currentUser.role === 'maintenance' || currentUser.role === 'tenant';
  const hideCost = currentUser.role === 'tenant';

  const [statusFilter, setStatusFilter] = useState<'' | WorkOrderStatus>('');
  const [priorityFilter, setPriorityFilter] = useState<'' | WorkOrderPriority>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    return mockWorkOrders.filter((wo) => {
      if (statusFilter && wo.status !== statusFilter) return false;
      if (priorityFilter && wo.priority !== priorityFilter) return false;
      if (categoryFilter && wo.category !== categoryFilter) return false;
      if (dateStart && wo.scheduledAt < dateStart) return false;
      if (dateEnd && wo.scheduledAt > dateEnd + 'T23:59:59') return false;
      return true;
    });
  }, [statusFilter, priorityFilter, categoryFilter, dateStart, dateEnd]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paged = filtered.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const handleReset = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setDateStart('');
    setDateEnd('');
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const selectStyles = 'rounded-md bg-navy-700 border border-navy-600/50 text-gray-300 text-xs px-3 py-1.5 focus:outline-none focus:border-amber-500/50';
  const dateInputStyles = 'rounded-md bg-navy-700 border border-navy-600/50 text-gray-300 text-xs px-3 py-1.5 focus:outline-none focus:border-amber-500/50 [color-scheme:dark]';

  return (
    <div className="p-4 h-full flex flex-col">
      <h1 className="font-heading font-bold text-white text-lg mb-4">工单管理</h1>

      <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">状态</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as '' | WorkOrderStatus)} className={selectStyles}>
              {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">优先级</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as '' | WorkOrderPriority)} className={selectStyles}>
              {priorityOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">类别</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectStyles}>
              {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">开始日期</label>
            <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className={dateInputStyles} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">结束日期</label>
            <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className={dateInputStyles} />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-1.5 rounded-md bg-amber-500 text-navy-900 text-xs font-semibold hover:bg-amber-400 transition-colors"
          >
            搜索
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-1.5 rounded-md border border-amber-500/50 text-amber-400 text-xs font-semibold hover:bg-amber-500/10 transition-colors"
          >
            重置
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="rounded-lg bg-navy-800 border border-navy-700/50 flex-1 flex flex-col min-h-0">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-navy-700/50">
                    <th className="text-left py-3 px-3 text-gray-500 font-medium whitespace-nowrap">ID</th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium whitespace-nowrap">标题</th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium whitespace-nowrap">房间地址</th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium whitespace-nowrap">类别</th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium whitespace-nowrap">优先级</th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium whitespace-nowrap">状态</th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium whitespace-nowrap">负责人</th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium whitespace-nowrap">计划时间</th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((wo) => (
                    <tr
                      key={wo.id}
                      onClick={() => setSelectedOrder(wo)}
                      className={`border-b border-navy-700/30 hover:bg-navy-700/30 cursor-pointer transition-colors ${
                        selectedOrder?.id === wo.id ? 'bg-navy-700/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono-data text-gray-400">{wo.id}</td>
                      <td className="py-2.5 px-3 text-gray-200 max-w-[160px] truncate">{wo.title}</td>
                      <td className="py-2.5 px-3 text-gray-300 whitespace-nowrap">{wo.roomAddress}</td>
                      <td className="py-2.5 px-3 text-gray-300">{wo.category}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityTwMap[wo.priority]}`}>
                          {priorityLabelMap[wo.priority]}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusTwMap[wo.status]}`}>
                          {statusLabelMap[wo.status]}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-300">{wo.assignedTo || '—'}</td>
                      <td className="py-2.5 px-3 font-mono-data text-gray-400 whitespace-nowrap">{formatDate(wo.scheduledAt)}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(wo); }}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-status-info/15 text-status-info hover:bg-status-info/25 transition-colors"
                          >
                            查看
                          </button>
                          {wo.status === 'completed' && (
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors"
                            >
                              签收
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-navy-700/50">
              <span className="text-xs text-gray-500">
                共 <span className="font-mono-data text-gray-300">{filtered.length}</span> 条
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="px-3 py-1 rounded-md text-xs border border-navy-600/50 text-gray-400 hover:bg-navy-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                <span className="text-xs text-gray-400">
                  <span className="font-mono-data text-gray-200">{safeCurrentPage}</span> / <span className="font-mono-data">{totalPages}</span>
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="px-3 py-1 rounded-md text-xs border border-navy-600/50 text-gray-400 hover:bg-navy-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>

        {selectedOrder && (
          <DetailPanel
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            maskPhone={maskPhone}
            hideCost={hideCost}
          />
        )}
      </div>
    </div>
  );
}
