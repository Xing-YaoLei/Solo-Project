import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Play, Pause } from 'lucide-react';
import { mockTrajectory, mockCheckIns } from '@/data/mockData';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const driverOptions = [
  { id: 'U-003', label: '陈维修 U-003' },
  { id: 'U-004', label: '王维修 U-004' },
];

const checkInColorMap: Record<string, string> = {
  arrival: '#2ECC71',
  departure: '#3498DB',
  break: '#F1C40F',
};

const checkInTypeLabel: Record<string, string> = {
  arrival: '到达',
  departure: '离开',
  break: '休息',
};

const checkInTypeIcon: Record<string, string> = {
  arrival: '📍',
  departure: '🚀',
  break: '☕',
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function interpolatePoint(
  points: { lat: number; lng: number }[],
  idx: number
): [number, number] {
  const floor = Math.floor(idx);
  const ceil = Math.min(floor + 1, points.length - 1);
  const t = idx - floor;
  return [
    points[floor].lat + (points[ceil].lat - points[floor].lat) * t,
    points[floor].lng + (points[ceil].lng - points[floor].lng) * t,
  ];
}

function CurrentPositionMarker({ points, currentIndex }: { points: { lat: number; lng: number }[]; currentIndex: number }) {
  const position = interpolatePoint(points, currentIndex);
  return (
    <Marker position={position}>
      <Popup>
        <span className="text-xs">当前位置</span>
      </Popup>
    </Marker>
  );
}

function TrajectoryMap({
  selectedDriver,
  currentIndex,
}: {
  selectedDriver: string;
  currentIndex: number;
}) {
  const points = mockTrajectory[selectedDriver] ?? [];
  const polylinePositions: [number, number][] = points.map((p) => [p.lat, p.lng]);
  const driverCheckIns = mockCheckIns.filter((ci) => ci.driverId === selectedDriver);

  return (
    <MapContainer
      center={[31.23, 121.47]}
      zoom={14}
      className="h-full w-full"
      style={{ minHeight: '0' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {polylinePositions.length > 1 && (
        <Polyline positions={polylinePositions} color="#E8A838" weight={3} />
      )}
      {driverCheckIns.map((ci) => (
        <CircleMarker
          key={ci.id}
          center={[ci.lat, ci.lng]}
          radius={6}
          fillColor={checkInColorMap[ci.type] ?? '#F1C40F'}
          color={checkInColorMap[ci.type] ?? '#F1C40F'}
          weight={2}
          opacity={0.9}
          fillOpacity={0.7}
        >
          <Popup>
            <span className="text-xs">
              {checkInTypeLabel[ci.type]} · {formatTimestamp(ci.timestamp)}
            </span>
          </Popup>
        </CircleMarker>
      ))}
      {points.length > 0 && currentIndex < points.length && (
        <CurrentPositionMarker points={points} currentIndex={currentIndex} />
      )}
    </MapContainer>
  );
}

function CheckInPanel({ selectedDriver }: { selectedDriver: string }) {
  const driverCheckIns = mockCheckIns.filter((ci) => ci.driverId === selectedDriver);

  return (
    <div className="rounded-lg bg-navy-800 border border-navy-700/50 p-4 w-64 max-h-[70vh] overflow-y-auto scrollbar-thin">
      <h2 className="font-heading font-semibold text-white text-sm mb-3">签到节点</h2>
      <div className="space-y-2">
        {driverCheckIns.map((ci) => (
          <div
            key={ci.id}
            className={`rounded-lg bg-navy-900/60 border p-3 ${
              !ci.online ? 'border-red-500/60' : 'border-navy-700/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{checkInTypeIcon[ci.type]}</span>
              <span className="text-xs font-medium text-white">{checkInTypeLabel[ci.type]}</span>
              <span
                className={`ml-auto w-2 h-2 rounded-full flex-shrink-0 ${
                  ci.online ? 'bg-status-success animate-pulse-dot' : 'bg-red-500'
                }`}
              />
            </div>
            <div className="text-xs text-gray-400">
              {formatTimestamp(ci.timestamp)}
            </div>
            <div className="text-xs text-gray-400 truncate mt-0.5">
              {ci.orderId}
            </div>
          </div>
        ))}
        {driverCheckIns.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-4">暂无签到记录</p>
        )}
      </div>
    </div>
  );
}

export default function Trajectory() {
  const [mounted, setMounted] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState('U-003');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const points = mockTrajectory[selectedDriver] ?? [];
  const maxIndex = points.length > 0 ? points.length - 1 : 0;
  const currentTimestamp = points[currentIndex]?.timestamp ?? '';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
    setPlaying(false);
  }, [selectedDriver]);

  const tick = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= maxIndex) {
        setPlaying(false);
        return maxIndex;
      }
      return prev + 1;
    });
  }, [maxIndex]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (playing) {
      const ms = 1000 / speed;
      intervalRef.current = setInterval(tick, ms);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [playing, speed, tick]);

  const handlePlayPause = () => {
    if (!playing && currentIndex >= maxIndex) {
      setCurrentIndex(0);
    }
    setPlaying((p) => !p);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentIndex(val);
    if (playing) {
      setPlaying(false);
    }
  };

  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-gray-500 text-sm">加载地图中...</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative flex flex-col">
      <div className="flex-1 min-h-0 relative">
        <TrajectoryMap selectedDriver={selectedDriver} currentIndex={currentIndex} />
        <div className="absolute top-4 right-4 z-[1000]">
          <CheckInPanel selectedDriver={selectedDriver} />
        </div>
      </div>

      <div className="h-16 bg-navy-800 border-t border-navy-700/50 flex items-center gap-4 px-4 z-[1000] shrink-0">
        <select
          value={selectedDriver}
          onChange={(e) => setSelectedDriver(e.target.value)}
          className="bg-navy-900 text-white text-xs rounded-lg border border-navy-700/50 px-3 py-1.5 focus:outline-none focus:border-amber-500/50"
        >
          {driverOptions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>

        <button
          onClick={handlePlayPause}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-navy-900 transition-colors"
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <div className="flex items-center gap-1">
          {([1, 2, 4] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                speed === s
                  ? 'bg-amber-500 text-navy-900 font-bold'
                  : 'bg-navy-900 text-gray-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <div className="flex-1 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={maxIndex}
            value={currentIndex}
            onChange={handleSliderChange}
            className="flex-1 h-1.5 appearance-none rounded-full bg-navy-700 cursor-pointer accent-amber-500"
            style={{
              accentColor: '#E8A838',
            }}
          />
        </div>

        <span className="text-xs text-gray-300 font-mono-data min-w-[80px] text-right">
          {currentTimestamp ? formatTimestamp(currentTimestamp) : '--:--:--'}
        </span>
      </div>
    </div>
  );
}
