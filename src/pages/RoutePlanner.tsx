import { useState } from 'react';
import { mockRoutes, mockWorkOrders } from '@/data/mockData';
import type { RouteInfo, Waypoint, WorkOrder, LoadingItem } from '@/types';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function getWaypointStatus(wp: Waypoint, orders: WorkOrder[]): 'arrived' | 'pending' | 'delayed' {
  const order = orders.find((o) => o.id === wp.orderId);
  if (order?.status === 'delayed') return 'delayed';
  if (wp.actualArrival) return 'arrived';
  return 'pending';
}

const statusDotColor: Record<string, string> = {
  arrived: 'bg-status-success',
  pending: 'bg-amber-500',
  delayed: 'bg-status-danger',
};

const statusLabel: Record<string, string> = {
  arrived: '已到达',
  pending: '待到达',
  delayed: '已延误',
};

const routeStatusLabel: Record<string, string> = {
  planned: '已计划',
  in_progress: '进行中',
  completed: '已完成',
  delayed: '已延误',
};

const routeStatusTw: Record<string, string> = {
  planned: 'bg-status-info/20 text-status-info',
  in_progress: 'bg-status-success/20 text-status-success',
  completed: 'bg-status-muted/20 text-status-muted',
  delayed: 'bg-status-danger/20 text-status-danger',
};

const categoryLabel: Record<string, string> = {
  material: '物料',
  tool: '工具',
};

function WaypointTimeline({ waypoints, orders }: { waypoints: Waypoint[]; orders: WorkOrder[] }) {
  const sorted = [...waypoints].sort((a, b) => a.sequence - b.sequence);
  return (
    <div className="relative pl-6">
      <div className="absolute left-[11px] top-3 bottom-3 w-px bg-navy-600" />
      <div className="space-y-0">
        {sorted.map((wp) => {
          const status = getWaypointStatus(wp, orders);
          return (
            <div key={wp.orderId} className="relative flex items-start gap-4 pb-6">
              <div className="absolute left-[-14px] top-1 flex flex-col items-center">
                <div className={`w-[11px] h-[11px] rounded-full border-2 border-navy-900 ${statusDotColor[status]} z-10`} />
              </div>
              <div className="flex-1 rounded-lg bg-navy-800/60 border border-navy-700/40 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-gray-500">#{wp.sequence}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    status === 'arrived' ? 'bg-status-success/15 text-status-success' :
                    status === 'delayed' ? 'bg-status-danger/15 text-status-danger' :
                    'bg-amber-500/15 text-amber-400'
                  }`}>
                    {statusLabel[status]}
                  </span>
                </div>
                <p className="text-sm text-gray-200 mb-1">{wp.address}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>预计: <span className="font-mono text-gray-300">{formatTime(wp.estimatedArrival)}</span></span>
                  {wp.actualArrival && (
                    <span>实际: <span className="font-mono text-gray-300">{formatTime(wp.actualArrival)}</span></span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UnassignedPool({
  orders,
  onAdd,
}: {
  orders: WorkOrder[];
  onAdd: (order: WorkOrder) => void;
}) {
  if (orders.length === 0) return null;
  return (
    <div className="mb-4 rounded-lg bg-navy-800 border border-navy-700/50 p-3">
      <h3 className="font-heading text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
        未分配工单池
      </h3>
      <div className="flex flex-wrap gap-2">
        {orders.map((wo) => (
          <div
            key={wo.id}
            className="flex items-center gap-2 rounded-md bg-navy-700/60 border border-navy-600/50 px-2.5 py-1.5 text-xs"
          >
            <span className="text-gray-300 truncate max-w-[140px]">{wo.title}</span>
            <span className="font-mono text-[10px] text-gray-500">{wo.id}</span>
            <button
              onClick={() => onAdd(wo)}
              className="ml-1 w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 flex items-center justify-center text-xs font-bold transition-colors"
            >
              +
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingListTab({
  items,
  onToggle,
}: {
  items: LoadingItem[];
  onToggle: (id: string) => void;
}) {
  const [template, setTemplate] = useState('');
  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="w-full rounded-md bg-navy-700 border border-navy-600/50 text-gray-300 text-xs px-3 py-2 focus:outline-none focus:border-amber-500/50"
        >
          <option value="">选择装载模板...</option>
          <option value="plumbing">水管维修模板</option>
          <option value="electrical">电路维修模板</option>
          <option value="hvac">空调维修模板</option>
        </select>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-navy-700/50">
              <th className="text-left py-2 px-1 w-8"></th>
              <th className="text-left py-2 px-1 text-gray-500 font-medium">名称</th>
              <th className="text-right py-2 px-1 text-gray-500 font-medium">数量</th>
              <th className="text-left py-2 px-1 text-gray-500 font-medium">单位</th>
              <th className="text-left py-2 px-1 text-gray-500 font-medium">类别</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-navy-700/30 hover:bg-navy-700/30">
                <td className="py-2 px-1">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => onToggle(item.id)}
                    className="rounded border-navy-600 bg-navy-700 text-amber-500 focus:ring-amber-500/30 focus:ring-offset-0 cursor-pointer"
                  />
                </td>
                <td className="py-2 px-1 text-gray-200">{item.name}</td>
                <td className="py-2 px-1 text-right font-mono text-gray-300">{item.quantity}</td>
                <td className="py-2 px-1 text-gray-400">{item.unit}</td>
                <td className="py-2 px-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    item.category === 'material'
                      ? 'bg-blue-500/15 text-blue-400'
                      : 'bg-orange-500/15 text-orange-400'
                  }`}>
                    {categoryLabel[item.category]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="mt-3 w-full py-2 rounded-md border border-dashed border-navy-600 text-gray-400 text-xs hover:border-amber-500/50 hover:text-amber-400 transition-colors">
        + 添加物料/工具
      </button>
    </div>
  );
}

function DispatchTab({ route }: { route: RouteInfo }) {
  const [dispatched, setDispatched] = useState(false);
  return (
    <div className="flex flex-col h-full">
      <div className="rounded-lg bg-navy-700/40 border border-navy-700/50 p-3 mb-4">
        <h3 className="font-heading text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
          路线信息
        </h3>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">路线名称</span>
            <span className="text-gray-200">{route.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">工单数量</span>
            <span className="font-mono text-gray-200">{route.workOrders.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">预计时长</span>
            <span className="font-mono text-gray-200">{route.estimatedDuration}min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">状态</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${routeStatusTw[route.status]}`}>
              {routeStatusLabel[route.status]}
            </span>
          </div>
        </div>
      </div>
      <div className="rounded-lg bg-navy-700/40 border border-navy-700/50 p-3 mb-4">
        <h3 className="font-heading text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
          司机分配
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-navy-600 flex items-center justify-center text-xs font-bold text-gray-300">
            {route.driverName[0]}
          </div>
          <div>
            <p className="text-sm text-gray-200">{route.driverName}</p>
            <p className="text-[10px] text-gray-500 font-mono">{route.driverId}</p>
          </div>
        </div>
      </div>
      <div className="mt-auto space-y-2">
        {dispatched && (
          <div className="rounded-md bg-status-success/10 border border-status-success/30 px-3 py-2 text-xs text-status-success text-center font-medium">
            已派单
          </div>
        )}
        <button
          onClick={() => setDispatched(true)}
          disabled={dispatched}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            dispatched
              ? 'bg-navy-700 text-gray-500 cursor-not-allowed'
              : 'bg-amber-500 text-navy-900 hover:bg-amber-400'
          }`}
        >
          派单
        </button>
        <button className="w-full py-2.5 rounded-lg border border-amber-500/50 text-amber-400 text-sm font-semibold hover:bg-amber-500/10 transition-colors">
          批量派单
        </button>
      </div>
    </div>
  );
}

export default function RoutePlanner() {
  const [selectedRouteId, setSelectedRouteId] = useState(mockRoutes[0].id);
  const [activeTab, setActiveTab] = useState<'loading' | 'dispatch'>('loading');
  const [addedOrderIds, setAddedOrderIds] = useState<Set<string>>(new Set());

  const selectedRoute = mockRoutes.find((r) => r.id === selectedRouteId) ?? mockRoutes[0];
  const [loadingItems, setLoadingItems] = useState(selectedRoute.loadingList);

  const unassignedOrders = mockWorkOrders.filter(
    (wo) => wo.status === 'pending' && !addedOrderIds.has(wo.id)
  );

  const displayWaypoints = selectedRoute.waypoints;

  const handleAddOrder = (order: WorkOrder) => {
    setAddedOrderIds((prev) => new Set(prev).add(order.id));
  };

  const handleRouteChange = (routeId: string) => {
    setSelectedRouteId(routeId);
    const route = mockRoutes.find((r) => r.id === routeId);
    if (route) {
      setLoadingItems(route.loadingList);
    }
    setAddedOrderIds(new Set());
  };

  const handleToggleItem = (id: string) => {
    setLoadingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const tabs = [
    { key: 'loading' as const, label: '装载清单' },
    { key: 'dispatch' as const, label: '派单操作' },
  ];

  return (
    <div className="p-4 h-full flex flex-col">
      <h1 className="font-heading font-bold text-white text-lg mb-4">路线计划</h1>
      <div className="flex-1 flex gap-4 min-h-0">
        <div className="w-[60%] flex flex-col min-h-0">
          <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-white text-sm">路线编排器</h2>
              <select
                value={selectedRouteId}
                onChange={(e) => handleRouteChange(e.target.value)}
                className="rounded-md bg-navy-700 border border-navy-600/50 text-gray-200 text-xs px-3 py-1.5 focus:outline-none focus:border-amber-500/50 min-w-[160px]"
              >
                {mockRoutes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <UnassignedPool orders={unassignedOrders} onAdd={handleAddOrder} />
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <WaypointTimeline waypoints={displayWaypoints} orders={mockWorkOrders} />
            </div>
          </div>
        </div>
        <div className="w-[40%] flex flex-col min-h-0">
          <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-1 mb-4 border-b border-navy-700/50 pb-3">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-navy-700/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-0">
              {activeTab === 'loading' ? (
                <LoadingListTab items={loadingItems} onToggle={handleToggleItem} />
              ) : (
                <DispatchTab route={selectedRoute} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
