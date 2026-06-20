'use client';

import { useEffect, useState } from 'react';
import { Map, Lock, Unlock, AlertCircle, Info, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '@/lib/api';
import { useActivityId } from '@/components/ActivitySelector';
import { STATUS_STYLES, LABELS, cn } from '@/lib/utils';

const SEAT_BG: Record<string, string> = {
  AVAILABLE: 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100',
  LOCKED: 'bg-amber-50 border-amber-400 text-amber-700',
  OCCUPIED: 'bg-rose-100 border-rose-400 text-rose-700',
  RESERVED: 'bg-purple-50 border-purple-300 text-purple-700',
  MAINTAINED: 'bg-slate-200 border-slate-400 text-slate-600',
};

export default function SeatsPage() {
  const activityId = useActivityId();
  const [maps, setMaps] = useState<any[]>([]);
  const [selectedMap, setSelectedMap] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [selectedSeat, setSelectedSeat] = useState<any>(null);
  const [filterSection, setFilterSection] = useState('ALL');

  const refreshMaps = () => {
    api.get('/seats/maps', { activityId }).then((ms: any[]) => {
      setMaps(ms);
      if (ms.length > 0) pickMap(ms[0].id);
    });
  };

  const pickMap = (id: string) => {
    api.get(`/seats/maps/${id}`).then((m) => {
      setSelectedMap(m);
      const sections = Array.from(new Set((m.seats || []).map((s: any) => s.section).filter(Boolean)));
      (sections as any).ALL = true;
    });
    api.get(`/seats/maps/${id}/stats`).then(setStats);
  };

  useEffect(() => { refreshMaps(); }, [activityId]);

  const lockSeat = () => {
    if (!selectedSeat) return;
    if (!confirm(`锁定座位 ${selectedSeat.label}？`)) return;
    api.put(`/seats/${selectedSeat.id}/lock`, { lockedBy: 'admin' }).then(() => pickMap(selectedMap.id));
  };
  const releaseSeat = () => {
    if (!selectedSeat) return;
    if (!confirm(`释放座位 ${selectedSeat.label}？`)) return;
    api.put(`/seats/${selectedSeat.id}/release`).then(() => pickMap(selectedMap.id));
  };

  const seats = selectedMap?.seats || [];
  const sections = Array.from(new Set(seats.map((s: any) => s.section).filter(Boolean)));
  const rows = Array.from(new Set(seats.map((s: any) => s.row))).sort();
  const cols = Array.from(new Set(seats.map((s: any) => s.col))).sort();

  const filteredSeats = filterSection === 'ALL' ? seats : seats.filter((s: any) => s.section === filterSection);

  const seatMap = new Map(seats.map((s: any) => [`${s.row}-${s.col}`, s]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">座位图管理</h1>
          <p className="text-sm text-slate-500 mt-1">可视化管理座位状态，支持锁定、释放和分区筛选</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '总座位', value: stats?.total || 0, icon: Map, color: 'from-brand-500 to-brand-700' },
          { label: '可用', value: stats?.available || 0, icon: ArrowUp, color: 'from-emerald-500 to-teal-600' },
          { label: '已售', value: stats?.occupied || 0, icon: Lock, color: 'from-rose-500 to-rose-600' },
          { label: '锁定/预留', value: (stats?.locked || 0) + (stats?.reserved || 0), icon: ArrowDown, color: 'from-amber-500 to-orange-600' },
        ].map((k) => (
          <div key={k.label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-500">{k.label}</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{k.value}</div>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.color} text-white flex items-center justify-center`}>
                <k.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 flex items-center gap-4 flex-wrap">
        <span className="text-sm text-slate-600">座位图：</span>
        <div className="flex items-center gap-2">
          {maps.map((m) => (
            <button
              key={m.id}
              className={`px-4 py-2 rounded-lg text-sm ${selectedMap?.id === m.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              onClick={() => pickMap(m.id)}
            >
              {m.name}
            </button>
          ))}
        </div>
        {sections.length > 0 && (
          <>
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <span className="text-sm text-slate-600">分区：</span>
            <select className="input !w-auto" value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
              <option value="ALL">全部</option>
              {sections.map((s) => <option key={s} value={s}>{s} 区</option>)}
            </select>
          </>
        )}
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="card p-6 col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title !mb-0">{selectedMap?.name || '座位图'}</div>
            <div className="flex items-center gap-4 text-xs">
              {Object.entries(LABELS.SeatStatus).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded border ${SEAT_BG[k]}`} />
                  <span className="text-slate-600">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {!selectedMap && <div className="py-20 text-center text-slate-400">请选择座位图</div>}

          {selectedMap && (
            <div className="space-y-2 overflow-x-auto pb-2">
              <div className="text-center py-2 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 text-sm font-medium text-amber-800 rounded-lg mb-6 border border-amber-200">
                舞台 · STAGE
              </div>
              {rows.map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <div className="w-6 text-center text-xs text-slate-500 font-medium">{r}</div>
                  <div className="flex gap-1.5">
                    {cols.map((c) => {
                      const seat = seatMap.get(`${r}-${c}`);
                      if (!seat) return <div key={c} className="w-10 h-10" />;
                      if (filterSection !== 'ALL' && seat.section !== filterSection) return <div key={c} className="w-10 h-10 opacity-20" />;
                      const selected = selectedSeat?.id === seat.id;
                      return (
                        <button
                          key={c}
                          className={`w-10 h-10 rounded text-xs font-medium border transition-all
                            ${SEAT_BG[seat.status] || SEAT_BG.AVAILABLE}
                            ${selected ? 'ring-2 ring-brand-500 ring-offset-1' : ''}
                          `}
                          onClick={() => setSelectedSeat(seat)}
                          title={`${seat.label} · ${LABELS.SeatStatus[seat.status]} · ${seat.section || ''}区`}
                        >
                          {seat.col}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="mt-6 text-center text-xs text-slate-400">
                共 {filteredSeats.length} 个座位 · {rows.length} 排 × {cols.length} 列
              </div>
            </div>
          )}
        </div>

        <div className="card p-5 h-fit sticky top-24">
          <div className="section-title !mb-3 text-base">座位详情</div>
          {!selectedSeat ? (
            <div className="py-10 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
              <Info className="w-8 h-8" />
              点击座位查看详情
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-slate-500 text-xs mb-0.5">座位标识</div>
                <div className="text-lg font-bold text-slate-900">{selectedSeat.label}</div>
              </div>
              <div className="flex justify-between"><span className="text-slate-500">分区</span><span>{selectedSeat.section || '-'} 区</span></div>
              <div className="flex justify-between"><span className="text-slate-500">行/列</span><span>{selectedSeat.row} 排 {selectedSeat.col} 号</span></div>
              <div className="flex justify-between"><span className="text-slate-500">价格等级</span><span>{selectedSeat.priceTier || '-'}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">状态</span>
                <span className={STATUS_STYLES[selectedSeat.status]}>{LABELS.SeatStatus[selectedSeat.status] || selectedSeat.status}</span>
              </div>
              {selectedSeat.lockedAt && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                  锁定于 {selectedSeat.lockedAt} · by {selectedSeat.lockedBy || '未知'}
                </div>
              )}
              <div className="pt-3 space-y-2 border-t border-slate-100">
                {['AVAILABLE'].includes(selectedSeat.status) && (
                  <button className="btn-primary w-full" onClick={lockSeat}>
                    <Lock className="w-4 h-4" /> 锁定座位
                  </button>
                )}
                {['LOCKED', 'RESERVED'].includes(selectedSeat.status) && (
                  <button className="btn-secondary w-full" onClick={releaseSeat}>
                    <Unlock className="w-4 h-4" /> 释放座位
                  </button>
                )}
                {['MAINTAINED'].includes(selectedSeat.status) && (
                  <button className="btn-secondary w-full" onClick={releaseSeat}>
                    <Unlock className="w-4 h-4" /> 解除维护
                  </button>
                )}
                {['AVAILABLE', 'LOCKED', 'RESERVED'].includes(selectedSeat.status) && (
                  <button className="btn-outline w-full !border-amber-300 !text-amber-700 hover:!bg-amber-50"
                    onClick={async () => {
                      await api.put(`/seats/${selectedSeat.id}/status`, { status: 'MAINTAINED' });
                      pickMap(selectedMap.id);
                    }}>
                    <AlertCircle className="w-4 h-4" /> 设为维护
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
