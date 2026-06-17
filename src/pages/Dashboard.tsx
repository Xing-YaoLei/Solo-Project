import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { mockRoutes, mockCheckIns } from '@/data/mockData';
import { useAppStore } from '@/store/useAppStore';
import type { RouteStatus } from '@/types';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const statusColorMap: Record<RouteStatus, string> = {
  planned: '#3498DB',
  in_progress: '#2ECC71',
  completed: '#7F8C8D',
  delayed: '#E74C3C',
};

const statusLabelMap: Record<RouteStatus, string> = {
  planned: '已计划',
  in_progress: '进行中',
  completed: '已完成',
  delayed: '已延误',
};

const statusTwMap: Record<RouteStatus, string> = {
  planned: 'bg-status-info/20 text-status-info',
  in_progress: 'bg-status-success/20 text-status-success',
  completed: 'bg-status-muted/20 text-status-muted',
  delayed: 'bg-status-danger/20 text-status-danger',
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}min`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

const checkInTypeLabel: Record<string, string> = {
  arrival: '到达',
  departure: '离开',
  break: '休息',
};

function RouteCard({ route }: { route: typeof mockRoutes[number] }) {
  const borderColor = statusColorMap[route.status];
  return (
    <div
      className="rounded-lg bg-navy-800 border border-navy-700/50 p-4 hover:border-l-4 transition-all duration-200 cursor-pointer"
      style={{ borderLeftColor: borderColor }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-heading font-semibold text-white text-sm">{route.name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusTwMap[route.status]}`}>
          {statusLabelMap[route.status]}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>司机: <span className="text-gray-200">{route.driverName}</span></span>
        <span>工单: <span className="font-mono-data text-gray-200">{route.workOrders.length}</span></span>
        <span>预计: <span className="font-mono-data text-gray-200">{formatDuration(route.estimatedDuration)}</span></span>
      </div>
    </div>
  );
}

function DriverCheckInPanel() {
  return (
    <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4 h-full">
      <h2 className="font-heading font-semibold text-white text-sm mb-3">司机签到面板</h2>
      <div className="space-y-2">
        {mockCheckIns.map((ci) => (
          <div key={ci.id} className="flex items-center gap-3 text-xs py-1.5">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${ci.online ? 'bg-status-success animate-pulse-dot' : 'bg-gray-500'}`}
            />
            <span className="text-gray-200 font-medium min-w-[56px]">{ci.driverName}</span>
            <span className="text-gray-400 flex-1 truncate">
              {checkInTypeLabel[ci.type]} · {formatTime(ci.timestamp)}
            </span>
            <span className={`font-mono-data ${ci.online ? 'text-status-success' : 'text-gray-500'}`}>
              {ci.online ? '在线' : '离线'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TodoPoolEntry() {
  const navigate = useNavigate();
  const todoItems = useAppStore((s) => s.todoItems);
  const pendingCount = todoItems.filter((t) => t.status === 'pending').length;

  return (
    <div
      onClick={() => navigate('/todo-pool')}
      className="rounded-lg bg-navy-800 border border-navy-700/50 p-4 cursor-pointer hover:border-amber-500/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-white text-sm">待办池</h2>
        {pendingCount > 0 && (
          <span className="font-mono-data text-xs font-bold bg-amber-500 text-navy-900 rounded-full w-6 h-6 flex items-center justify-center animate-count-bounce">
            {pendingCount}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1">
        待处理 <span className="font-mono-data text-amber-400">{pendingCount}</span> 项
      </p>
    </div>
  );
}

function MapView() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-lg bg-navy-800 border border-navy-700/50 h-full flex items-center justify-center">
        <span className="text-gray-500 text-sm">加载地图中...</span>
      </div>
    );
  }

  return (
    <MapContainer
      center={[31.23, 121.47]}
      zoom={13}
      className="rounded-lg h-full w-full"
      style={{ minHeight: '320px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mockRoutes.map((route) => (
        <div key={route.id}>
          {route.waypoints.map((wp) => (
            <Marker key={wp.orderId} position={[wp.lat, wp.lng]}>
              <Popup>
                <span className="text-xs">{wp.address}</span>
              </Popup>
            </Marker>
          ))}
          <Polyline
            positions={route.waypoints
              .slice()
              .sort((a, b) => a.sequence - b.sequence)
              .map((wp) => [wp.lat, wp.lng] as [number, number])}
            color={statusColorMap[route.status]}
            weight={3}
            opacity={0.8}
          />
        </div>
      ))}
    </MapContainer>
  );
}

export default function Dashboard() {
  return (
    <div className="p-4 h-full">
      <h1 className="font-heading font-bold text-white text-lg mb-4">排程调度台</h1>
      <div className="grid grid-cols-3 gap-4 h-[calc(100%-3rem)]">
        <div className="col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-white text-sm">路线计划看板</h2>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3">
            {mockRoutes.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        </div>

        <div className="col-span-1 flex flex-col gap-4">
          <TodoPoolEntry />
          <div className="flex-1 min-h-0">
            <DriverCheckInPanel />
          </div>
        </div>

        <div className="col-span-3 min-h-[320px]">
          <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4 h-full">
            <h2 className="font-heading font-semibold text-white text-sm mb-3">实时地图</h2>
            <div className="h-[calc(100%-2rem)]">
              <MapView />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
