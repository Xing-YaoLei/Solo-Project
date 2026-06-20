'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi, buildQuery } from '@/lib/api';

interface Seat {
  id: string;
  rowLabel: string;
  colLabel: string;
  seatNo: string;
  status: string;
}

interface SeatZone {
  id: string;
  name: string;
  area: string;
  rowCount: number;
  colCount: number;
  price: string;
  seats?: Seat[];
}

interface SeatMapDetail {
  id: string;
  name: string;
  eventId: string;
  totalSeats: number;
  thresholdWarn: number;
  thresholdFull: number;
  layoutData?: any;
  zones: SeatZone[];
}

interface AvailabilityInfo {
  seatMapId: string;
  totalSeats: number;
  soldCount: number;
  availableCount: number;
  soldPercent: number;
  thresholdWarn: number;
  thresholdFull: number;
  isWarning: boolean;
  isFull: boolean;
  zones: SeatZone[];
}

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'available', label: '可用' },
  { value: 'sold', label: '已售' },
  { value: 'locked', label: '锁定' },
  { value: 'disabled', label: '禁用' },
];

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  sold: 'bg-red-100 text-red-700',
  locked: 'bg-yellow-100 text-yellow-700',
  disabled: 'bg-gray-100 text-gray-400',
};

export default function SeatMapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [seatMap, setSeatMap] = useState<SeatMapDetail | null>(null);
  const [availability, setAvailability] = useState<AvailabilityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterZoneId, setFilterZoneId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [showSeats, setShowSeats] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi<SeatMapDetail>(`/seat-maps/${id}`);
      setSeatMap(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadAvailability = useCallback(async () => {
    try {
      const qs = buildQuery({
        zoneId: filterZoneId || undefined,
        status: filterStatus || undefined,
        area: filterArea || undefined,
      });
      const data = await fetchApi<AvailabilityInfo>(`/seat-maps/${id}/availability${qs}`);
      setAvailability(data);
    } catch (e) {
      console.error(e);
    }
  }, [id, filterZoneId, filterStatus, filterArea]);

  useEffect(() => {
    loadDetail();
    loadAvailability();
  }, [loadDetail, loadAvailability]);

  if (loading || !seatMap) {
    return (
      <div>
        <button onClick={() => router.back()} className="text-gray-500 text-sm mb-4">&larr; 返回列表</button>
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">加载中...</div>
      </div>
    );
  }

  const statusLabel = availability?.isFull ? '满座' : availability?.isWarning ? '预警' : '正常';
  const statusColor = availability?.isFull ? 'text-red-600' : availability?.isWarning ? 'text-yellow-600' : 'text-green-600';

  return (
    <div>
      <button onClick={() => router.back()} className="text-gray-500 text-sm mb-4 hover:underline">&larr; 返回列表</button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{seatMap.name}</h1>
        <span className={`text-sm font-medium ${statusColor}`}>
          状态：{statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500 mb-1">总座位数</div>
          <div className="text-2xl font-bold">{availability?.totalSeats || seatMap.totalSeats}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500 mb-1">已售座位</div>
          <div className="text-2xl font-bold text-red-600">{availability?.soldCount || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500 mb-1">可用座位</div>
          <div className="text-2xl font-bold text-green-600">{availability?.availableCount || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500 mb-1">上座率</div>
          <div className="text-2xl font-bold">{availability?.soldPercent || 0}%</div>
          <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${availability?.isFull ? 'bg-red-500' : availability?.isWarning ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${availability?.soldPercent || 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">预警阈值</div>
            <div className="text-lg font-semibold">{seatMap.thresholdWarn}%</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">满座阈值</div>
            <div className="text-lg font-semibold">{seatMap.thresholdFull}%</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">分区数量</div>
            <div className="text-lg font-semibold">{seatMap.zones.length} 个</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">活动ID</div>
            <div className="text-sm font-medium truncate">{seatMap.eventId}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs text-gray-500 mb-1">分区</label>
          <select
            value={filterZoneId}
            onChange={(e) => setFilterZoneId(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value="">全部分区</option>
            {seatMap.zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">座位状态</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">区域</label>
          <input
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            placeholder="输入区域名称"
            className="border rounded px-3 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={() => setShowSeats(!showSeats)}
          className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          {showSeats ? '隐藏座位明细' : '查看座位明细'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">分区名称</th>
              <th className="px-4 py-3 text-left">区域</th>
              <th className="px-4 py-3 text-left">排数</th>
              <th className="px-4 py-3 text-left">列数</th>
              <th className="px-4 py-3 text-left">座位总数</th>
              <th className="px-4 py-3 text-left">票价</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {seatMap.zones.map((zone) => {
              const zoneTotal = zone.rowCount * zone.colCount;
              return (
                <tr key={zone.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{zone.name}</td>
                  <td className="px-4 py-3 text-gray-600">{zone.area}</td>
                  <td className="px-4 py-3">{zone.rowCount}</td>
                  <td className="px-4 py-3">{zone.colCount}</td>
                  <td className="px-4 py-3">{zoneTotal}</td>
                  <td className="px-4 py-3">¥{Number(zone.price).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showSeats && availability && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-4">座位明细</h2>
          <div className="space-y-6">
            {availability.zones.map((zone) => {
              const seats = zone.seats || [];
              if (seats.length === 0) return null;
              return (
                <div key={zone.id}>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {zone.name} ({zone.area})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {seats.map((seat) => (
                      <span
                        key={seat.id}
                        className={`inline-block px-2 py-1 text-xs rounded ${STATUS_COLORS[seat.status] || 'bg-gray-100'}`}
                        title={seat.status}
                      >
                        {seat.seatNo}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
