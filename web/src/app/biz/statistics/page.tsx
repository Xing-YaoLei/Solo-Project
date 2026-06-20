'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApi, buildQuery } from '@/lib/api';

interface Event {
  id: string;
  name: string;
  status?: string;
  managerId?: string;
  eventDate?: string;
}

interface EventsListResponse {
  data: Event[];
  total: number;
  page: number;
  limit: number;
}

interface ZoneOccupancy {
  zoneName: string;
  area: string;
  totalSeats: number;
  soldSeats: number;
  occupancyRate: number;
}

interface OccupancyData {
  totalSeats: number;
  soldSeats: number;
  availableSeats: number;
  occupancyRate: number;
  status: string;
  zones: ZoneOccupancy[];
}

interface RevenueBreakdown {
  ticketTypeName: string;
  amount: number;
  count: number;
}

interface RevenueData {
  totalRevenue: number;
  breakdown: RevenueBreakdown[];
}

interface OccupancySummaryItem {
  eventId: string;
  eventName: string;
  totalSeats: number;
  soldSeats: number;
  occupancyRate: number;
  status: string;
}

const STATUS_INDICATOR: Record<string, { color: string; label: string }> = {
  normal: { color: 'bg-green-500', label: '正常' },
  warning: { color: 'bg-yellow-500', label: '预警' },
  full: { color: 'bg-red-500', label: '已满' },
};

export default function StatisticsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(false);
  const [occupancy, setOccupancy] = useState<OccupancyData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [summary, setSummary] = useState<OccupancySummaryItem[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterManagerId, setFilterManagerId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const loadEvents = useCallback(async () => {
    try {
      const qs = buildQuery({ limit: 100 });
      const res = await fetchApi<EventsListResponse>(`/events${qs}`);
      setEvents(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const loadEventData = useCallback(async () => {
    setLoading(true);
    try {
      if (selectedEventId) {
        const [occRes, revRes] = await Promise.all([
          fetchApi<OccupancyData>(`/statistics/events/${selectedEventId}/occupancy`),
          fetchApi<RevenueData>(`/statistics/events/${selectedEventId}/revenue`),
        ]);
        setOccupancy(occRes);
        setRevenue(revRes);
        setSummary([]);
      } else {
        const qs = buildQuery({
          status: filterStatus || undefined,
          managerId: filterManagerId || undefined,
          dateFrom: filterDateFrom || undefined,
          dateTo: filterDateTo || undefined,
        });
        const res = await fetchApi<OccupancySummaryItem[]>(`/statistics/events/occupancy-summary${qs}`);
        setSummary(res);
        setOccupancy(null);
        setRevenue(null);
      }
    } catch (e) {
      console.error(e);
      setOccupancy(null);
      setRevenue(null);
      setSummary([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, filterStatus, filterManagerId, filterDateFrom, filterDateTo]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  const statusInfo = (status: string) => STATUS_INDICATOR[status] || { color: 'bg-gray-500', label: status || '未知' };

  const occupancyBarColor = (rate: number) => {
    if (rate >= 95) return 'bg-red-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">上座率复盘</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs text-gray-500 mb-1">选择活动</label>
          <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="border rounded px-3 py-1.5 text-sm min-w-[200px]">
            <option value="">全部活动（汇总）</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        </div>
        {!selectedEventId && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">活动状态</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
                <option value="">全部</option>
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="ongoing">进行中</option>
                <option value="ended">已结束</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">负责人ID</label>
              <input value={filterManagerId} onChange={(e) => setFilterManagerId(e.target.value)} placeholder="输入负责人ID" className="border rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">开始日期</label>
              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="border rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">结束日期</label>
              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="border rounded px-3 py-1.5 text-sm" />
            </div>
          </>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">加载中...</div>
      ) : selectedEventId && occupancy ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 mb-1">总座位</div>
              <div className="text-3xl font-bold">{occupancy.totalSeats.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 mb-1">已售座位</div>
              <div className="text-3xl font-bold text-green-600">{occupancy.soldSeats.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 mb-1">可用座位</div>
              <div className="text-3xl font-bold text-blue-600">{occupancy.availableSeats.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">上座率</h2>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${statusInfo(occupancy.status).color}`} />
                <span className="text-sm text-gray-600">{statusInfo(occupancy.status).label}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-200 rounded-full h-6">
                <div className={`h-6 rounded-full ${occupancyBarColor(occupancy.occupancyRate)} transition-all`} style={{ width: `${occupancy.occupancyRate}%` }} />
              </div>
              <span className="text-2xl font-bold">{occupancy.occupancyRate.toFixed(1)}%</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-bold">分区上座率</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">分区名称</th>
                  <th className="px-4 py-3 text-left">区域</th>
                  <th className="px-4 py-3 text-left">总座位</th>
                  <th className="px-4 py-3 text-left">已售座位</th>
                  <th className="px-4 py-3 text-left min-w-[200px]">上座率</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {occupancy.zones.map((zone, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{zone.zoneName}</td>
                    <td className="px-4 py-3">{zone.area}</td>
                    <td className="px-4 py-3">{zone.totalSeats.toLocaleString()}</td>
                    <td className="px-4 py-3">{zone.soldSeats.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full ${occupancyBarColor(zone.occupancyRate)}`} style={{ width: `${zone.occupancyRate}%` }} />
                        </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap">{zone.occupancyRate.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {occupancy.zones.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无分区数据</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {revenue && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4">收入汇总</h2>
              <div className="text-3xl font-bold mb-4">¥{Number(revenue.totalRevenue).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              {revenue.breakdown.length > 0 && (
                <table className="w-full text-sm">
                  <thead className="text-gray-600 border-b">
                    <tr>
                      <th className="text-left py-2">票种</th>
                      <th className="text-left py-2">数量</th>
                      <th className="text-left py-2">金额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {revenue.breakdown.map((b, idx) => (
                      <tr key={idx}>
                        <td className="py-2">{b.ticketTypeName}</td>
                        <td className="py-2">{b.count}</td>
                        <td className="py-2">¥{Number(b.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      ) : !selectedEventId && summary.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-bold">跨活动上座率汇总</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">活动名称</th>
                <th className="px-4 py-3 text-left">总座位</th>
                <th className="px-4 py-3 text-left">已售座位</th>
                <th className="px-4 py-3 text-left min-w-[200px]">上座率</th>
                <th className="px-4 py-3 text-left">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {summary.map((item) => {
                const si = statusInfo(item.status);
                return (
                  <tr key={item.eventId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.eventName}</td>
                    <td className="px-4 py-3">{item.totalSeats.toLocaleString()}</td>
                    <td className="px-4 py-3">{item.soldSeats.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full ${occupancyBarColor(item.occupancyRate)}`} style={{ width: `${item.occupancyRate}%` }} />
                        </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap">{item.occupancyRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${si.color}`} />
                        <span className="text-xs">{si.label}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">暂无数据</div>
      )}
    </div>
  );
}
