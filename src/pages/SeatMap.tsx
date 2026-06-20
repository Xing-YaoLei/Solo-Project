import { useState, useEffect, useMemo, useCallback } from 'react';
import { ZoomIn, ZoomOut, X, Loader2, AlertCircle, MapPin, Users, DollarSign, Ticket } from 'lucide-react';
import { getSeatLayout, getAreas, getSeatDetail } from '@/api';
import type { SeatData, AreaData } from '@/types';
import Chart from '@/components/Chart';

const STATUS_COLORS: Record<SeatData['status'], string> = {
  available: '#334155',
  sold: '#06B6D4',
  used: '#22C55E',
  reserved: '#F97316',
};

const STATUS_LABELS: Record<SeatData['status'], string> = {
  available: '可用',
  sold: '已售',
  used: '已核销',
  reserved: '预留',
};

interface SeatDetailResponse {
  seat: SeatData;
  order: {
    orderId: string;
    orderNo: string;
    buyerName: string;
    amount: number;
    status: string;
    createTime: string;
  } | null;
}

export default function SeatMap() {
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [seatDetail, setSeatDetail] = useState<SeatDetailResponse | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<SeatData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [loadingLayout, setLoadingLayout] = useState(true);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingLayout(true);
    getSeatLayout()
      .then((res) => {
        if (!cancelled) setSeats(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingLayout(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingAreas(true);
    getAreas()
      .then((res) => {
        if (!cancelled) setAreas(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingAreas(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedSeatId) {
      setSeatDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    getSeatDetail(selectedSeatId)
      .then((res) => {
        if (!cancelled) setSeatDetail(res.data as unknown as SeatDetailResponse);
      })
      .catch(() => {
        if (!cancelled) setSeatDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => { cancelled = true; };
  }, [selectedSeatId]);

  const filteredSeats = useMemo(() => {
    if (!selectedArea) return seats;
    return seats.filter((s) => s.area === selectedArea);
  }, [seats, selectedArea]);

  const seatsByArea = useMemo(() => {
    const map = new Map<string, SeatData[]>();
    for (const seat of filteredSeats) {
      const list = map.get(seat.area) ?? [];
      list.push(seat);
      map.set(seat.area, list);
    }
    return map;
  }, [filteredSeats]);

  const areaGrids = useMemo(() => {
    const result: { areaName: string; rows: string[]; maxCol: number; grid: Map<string, SeatData> }[] = [];
    for (const [areaName, areaSeats] of seatsByArea) {
      const rowSet = new Set<string>();
      let maxCol = 0;
      const grid = new Map<string, SeatData>();
      for (const seat of areaSeats) {
        rowSet.add(seat.row);
        if (seat.col > maxCol) maxCol = seat.col;
        grid.set(`${seat.row}-${seat.col}`, seat);
      }
      const rows = Array.from(rowSet).sort();
      result.push({ areaName, rows, maxCol, grid });
    }
    return result;
  }, [seatsByArea]);

  const stats = useMemo(() => {
    const total = filteredSeats.length;
    const available = filteredSeats.filter((s) => s.status === 'available').length;
    const sold = filteredSeats.filter((s) => s.status === 'sold').length;
    const used = filteredSeats.filter((s) => s.status === 'used').length;
    const reserved = filteredSeats.filter((s) => s.status === 'reserved').length;
    const revenue = filteredSeats
      .filter((s) => s.status === 'sold' || s.status === 'used')
      .reduce((sum, s) => sum + s.price, 0);
    const avgPrice = sold + used > 0
      ? filteredSeats.filter((s) => s.status === 'sold' || s.status === 'used').reduce((sum, s) => sum + s.price, 0) / (sold + used)
      : 0;
    return { total, available, sold, used, reserved, revenue, avgPrice };
  }, [filteredSeats]);

  const handleSeatClick = useCallback((seat: SeatData) => {
    setSelectedSeatId(seat.seatId);
  }, []);

  const handleSeatHover = useCallback((seat: SeatData, e: React.MouseEvent) => {
    setHoveredSeat(seat);
    const rect = (e.currentTarget as HTMLElement).closest('.seat-map-container')?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  const handleSeatLeave = useCallback(() => {
    setHoveredSeat(null);
    setTooltipPos(null);
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedSeatId(null);
    setSeatDetail(null);
  }, []);

  const heatmapOption = useMemo(() => {
    if (areas.length === 0) return {};

    const sortedAreas = [...areas].sort((a, b) => (a.soldSeats / a.totalSeats) - (b.soldSeats / b.totalSeats));
    const areaNames = sortedAreas.map((a) => a.areaName);
    const occupancyRates = sortedAreas.map((a) => a.soldSeats / a.totalSeats);
    const colors = occupancyRates.map((rate) => {
      const alpha = 0.3 + rate * 0.7;
      return `rgba(6, 182, 212, ${alpha})`;
    });

    return {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        formatter: (params: unknown) => {
          const p = (params as { name: string; value: number }[])[0];
          const area = sortedAreas.find((a) => a.areaName === p.name);
          if (!area) return '';
          const rate = ((area.soldSeats / area.totalSeats) * 100).toFixed(1);
          return `<div style="font-size:12px">
            <strong>${area.areaName}</strong><br/>
            总座位: ${area.totalSeats}<br/>
            已售: ${area.soldSeats}<br/>
            上座率: ${rate}%<br/>
            均价: ¥${area.avgPrice}<br/>
            收入: ¥${area.revenue.toLocaleString()}
          </div>`;
        },
      },
      grid: { left: 80, right: 30, top: 10, bottom: 30 },
      xAxis: { type: 'value' as const, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } }, axisLabel: { color: '#94A3B8' } },
      yAxis: { type: 'category' as const, data: areaNames, axisLabel: { color: '#94A3B8' }, axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } } },
      series: [
        {
          type: 'bar' as const,
          data: sortedAreas.map((a, i) => ({
            value: a.soldSeats,
            itemStyle: { color: colors[i] },
          })),
          barWidth: 20,
          label: {
            show: true,
            position: 'right' as const,
            color: '#94A3B8',
            fontSize: 11,
            formatter: (params: unknown) => {
              const idx = (params as { dataIndex: number }).dataIndex;
              const area = sortedAreas[idx];
              const rate = ((area.soldSeats / area.totalSeats) * 100).toFixed(0);
              return `${area.soldSeats} (${rate}%)`;
            },
          },
        },
      ],
    };
  }, [areas]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="glass-card rounded-lg p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-accent-orange" />
          <p className="text-slate-300">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-accent-cyan/20 px-4 py-2 text-sm text-accent-cyan hover:bg-accent-cyan/30 transition-colors">
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedArea(null)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedArea === null
              ? 'bg-accent-cyan text-white'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
          }`}
        >
          全部区域
        </button>
        {areas.map((area) => (
          <button
            key={area.areaId}
            onClick={() => setSelectedArea(area.areaName === selectedArea ? null : area.areaName)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedArea === area.areaName
                ? 'bg-accent-cyan text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            {area.areaName}
          </button>
        ))}
      </div>

      <div className="glass-card relative flex-1 overflow-hidden rounded-lg border border-white/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-100">座位图</h2>
          <div className="flex items-center gap-2">
            <div className="mr-3 flex items-center gap-3 text-xs text-slate-400">
              {(['available', 'sold', 'used', 'reserved'] as const).map((status) => (
                <span key={status} className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS[status] }} />
                  {STATUS_LABELS[status]}
                </span>
              ))}
            </div>
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="rounded-lg bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-[3rem] text-center text-xs text-slate-400">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="rounded-lg bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loadingLayout ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent-cyan" />
          </div>
        ) : (
          <div className="seat-map-container relative overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100% - 3rem)' }}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              {areaGrids.map(({ areaName, rows, maxCol, grid }) => (
                <div key={areaName} className="mb-6">
                  <div className="mb-2 text-sm font-semibold text-accent-cyan">{areaName}</div>
                  <div className="flex">
                    <div className="mr-1 flex flex-col">
                      <div className="h-5" />
                      {rows.map((row) => (
                        <div key={row} className="flex h-4 items-center justify-end pr-1 text-[9px] text-slate-500" style={{ width: '1.5rem' }}>
                          {row}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex" style={{ gap: '1px' }}>
                        {Array.from({ length: maxCol }, (_, i) => (
                          <div key={i} className="flex h-4 w-4 items-center justify-center text-[7px] text-slate-600">
                            {(i + 1) % 10 === 0 ? `${i + 1}` : (i + 1) % 5 === 0 ? `${i + 1}` : ''}
                          </div>
                        ))}
                      </div>
                      {rows.map((row) => (
                        <div key={row} className="flex" style={{ gap: '1px' }}>
                          {Array.from({ length: maxCol }, (_, i) => {
                            const seat = grid.get(`${row}-${i + 1}`);
                            if (!seat) return <div key={i} className="h-4 w-4" />;
                            return (
                              <div
                                key={i}
                                className="h-4 w-4 cursor-pointer rounded-sm transition-transform hover:scale-150 hover:z-10 hover:ring-1 hover:ring-white/50"
                                style={{ backgroundColor: STATUS_COLORS[seat.status] }}
                                onClick={() => handleSeatClick(seat)}
                                onMouseEnter={(e) => handleSeatHover(seat, e)}
                                onMouseLeave={handleSeatLeave}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hoveredSeat && tooltipPos && (
              <div
                className="pointer-events-none absolute z-20 rounded-lg border border-white/10 bg-slate-900/95 px-3 py-2 text-xs shadow-xl"
                style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 10 }}
              >
                <div className="mb-1 font-semibold text-slate-200">{hoveredSeat.row}{hoveredSeat.col}</div>
                <div className="text-slate-400">区域: {hoveredSeat.area}</div>
                <div className="text-slate-400">状态: {STATUS_LABELS[hoveredSeat.status]}</div>
                <div className="text-slate-400">价格: ¥{hoveredSeat.price}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card rounded-lg border border-white/5 p-4">
          <h3 className="mb-3 font-display text-sm font-semibold text-slate-100">区域热力图</h3>
          {loadingAreas ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-accent-cyan" />
            </div>
          ) : (
            <Chart option={heatmapOption} style={{ height: 220 }} />
          )}
        </div>

        <div className="glass-card rounded-lg border border-white/5 p-4">
          <h3 className="mb-3 font-display text-sm font-semibold text-slate-100">座位统计</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/5 p-3">
              <div className="mb-1 flex items-center gap-2 text-slate-400">
                <MapPin className="h-4 w-4" />
                <span className="text-xs">总座位</span>
              </div>
              <div className="font-display text-2xl font-bold text-slate-100">{stats.total.toLocaleString()}</div>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <div className="mb-1 flex items-center gap-2 text-slate-400">
                <Users className="h-4 w-4" />
                <span className="text-xs">已售</span>
              </div>
              <div className="font-display text-2xl font-bold text-accent-cyan">{stats.sold.toLocaleString()}</div>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <div className="mb-1 flex items-center gap-2 text-slate-400">
                <Ticket className="h-4 w-4" />
                <span className="text-xs">已核销</span>
              </div>
              <div className="font-display text-2xl font-bold text-green-400">{stats.used.toLocaleString()}</div>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <div className="mb-1 flex items-center gap-2 text-slate-400">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">收入</span>
              </div>
              <div className="font-display text-2xl font-bold text-accent-orange">¥{stats.revenue.toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {(['available', 'sold', 'used', 'reserved'] as const).map((status) => {
              const count = status === 'available' ? stats.available
                : status === 'sold' ? stats.sold
                : status === 'used' ? stats.used
                : stats.reserved;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-2">
                  <span className="w-12 text-xs text-slate-400">{STATUS_LABELS[status]}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-white/5">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[status] }} />
                  </div>
                  <span className="min-w-[3rem] text-right text-xs text-slate-400">{count} ({pct.toFixed(1)}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedSeatId && (
        <>
          <div className="fixed inset-0 z-30 bg-black/50" onClick={closeDrawer} />
          <div className="fixed right-0 top-0 z-40 flex h-full w-80 flex-col glass-card border-l border-white/5">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <h3 className="font-display font-semibold text-slate-100">座位详情</h3>
              <button onClick={closeDrawer} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingDetail ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-accent-cyan" />
                </div>
              ) : seatDetail ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">座位号</span>
                      <span className="font-display font-semibold text-slate-100">{seatDetail.seat.row}{seatDetail.seat.col}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">区域</span>
                      <span className="text-sm text-slate-200">{seatDetail.seat.area}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">行/列</span>
                      <span className="text-sm text-slate-200">{seatDetail.seat.row} 行 / {seatDetail.seat.col} 列</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">价格</span>
                      <span className="text-sm text-accent-cyan">¥{seatDetail.seat.price}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">状态</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${STATUS_COLORS[seatDetail.seat.status]}20`, color: STATUS_COLORS[seatDetail.seat.status] }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[seatDetail.seat.status] }} />
                        {STATUS_LABELS[seatDetail.seat.status]}
                      </span>
                    </div>
                  </div>

                  {seatDetail.order && (
                    <div className="rounded-lg border border-white/5 bg-white/5 p-3">
                      <div className="mb-2 text-xs font-medium text-accent-cyan">关联订单</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">订单号</span>
                          <span className="text-xs text-slate-200">{seatDetail.order.orderNo}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">买家</span>
                          <span className="text-sm text-slate-200">{seatDetail.order.buyerName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">订单状态</span>
                          <span className="text-xs text-slate-200">{seatDetail.order.status}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">下单时间</span>
                          <span className="text-xs text-slate-300">{new Date(seatDetail.order.createTime).toLocaleString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-sm text-slate-400">无法加载座位详情</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
