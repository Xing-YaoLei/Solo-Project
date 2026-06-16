import { useEffect, useState } from 'react';
import { DoorOpen, Clock, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getVisitRecords } from '@/services/api';
import type { VisitRecord } from '@/types';

const accessConfig = {
  recorded: { label: '记录完整', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  missing_entry: { label: '缺少进入', color: 'text-red-400', dot: 'bg-red-400' },
  missing_exit: { label: '缺少离开', color: 'text-amber-400', dot: 'bg-amber-400' },
};

export default function Visits() {
  const { visitRecords, setVisitRecords, selectedDateRange } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getVisitRecords(selectedDateRange[0], selectedDateRange[1])
      .then(setVisitRecords)
      .catch(() => setVisitRecords(mockVisits()))
      .finally(() => setLoading(false));
  }, [selectedDateRange]);

  const grouped = visitRecords.reduce<Record<string, VisitRecord[]>>((acc, v) => {
    const day = v.visitTime.slice(0, 10);
    acc[day] = acc[day] || [];
    acc[day].push(v);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 flex items-center gap-3 border-b border-white/[0.06]">
        <DoorOpen size={18} className="text-amber-400" />
        <h2 className="text-base font-semibold text-white/90">探访记录</h2>
        <span className="text-xs text-white/40 ml-2">
          {selectedDateRange[0]} ~ {selectedDateRange[1]}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">加载中...</div>
        ) : (
          Object.entries(grouped).map(([day, visits]) => (
            <div key={day} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-sm font-semibold text-white/70">{day}</span>
                <span className="text-xs text-white/30">{visits.length} 条记录</span>
              </div>

              <div className="ml-1 border-l-2 border-white/[0.06] pl-5 space-y-3">
                {visits.map((v) => {
                  const cfg = accessConfig[v.accessStatus];
                  return (
                    <div key={v.id} className="bg-[#1B2A4A] rounded-lg p-4 border border-white/[0.06]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white/80">{v.visitorName}</span>
                          <span className="text-xs text-white/40">({v.visitorRelation})</span>
                          <span className="text-xs text-white/30">→</span>
                          <span className="text-sm text-white/60">{v.elderName}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {v.visitTime?.slice(11, 16)}
                          {v.leaveTime ? ` - ${v.leaveTime.slice(11, 16)}` : ' - 至今'}
                        </span>
                      </div>

                      {v.missingPeriod && (
                        <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                          <AlertTriangle size={11} />
                          记录缺失: {v.missingPeriod.start.slice(11, 16)} - {v.missingPeriod.end.slice(11, 16)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function mockVisits(): VisitRecord[] {
  return [
    {
      id: 'v1', elderId: 'e1', elderName: '张奶奶', visitorName: '张明', visitorRelation: '儿子',
      visitTime: '2026-06-17T09:00:00', leaveTime: '2026-06-17T11:30:00', accessStatus: 'recorded',
    },
    {
      id: 'v2', elderId: 'e2', elderName: '李爷爷', visitorName: '李芳', visitorRelation: '女儿',
      visitTime: '2026-06-17T14:00:00', leaveTime: null, accessStatus: 'missing_exit',
      missingPeriod: { start: '2026-06-17T16:00:00', end: '2026-06-17T17:00:00' },
    },
    {
      id: 'v3', elderId: 'e3', elderName: '王奶奶', visitorName: '王强', visitorRelation: '孙子',
      visitTime: '2026-06-16T10:00:00', leaveTime: '2026-06-16T12:00:00', accessStatus: 'recorded',
    },
    {
      id: 'v4', elderId: 'e4', elderName: '赵大爷', visitorName: '赵丽', visitorRelation: '女儿',
      visitTime: '2026-06-16T15:30:00', leaveTime: '2026-06-16T17:00:00', accessStatus: 'missing_entry',
      missingPeriod: { start: '2026-06-16T15:00:00', end: '2026-06-16T15:30:00' },
    },
  ];
}
