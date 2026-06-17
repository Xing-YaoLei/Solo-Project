import { useEffect, useState } from 'react';
import { Pill, WifiOff } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getMedicationRecords } from '@/services/api';
import type { MedicationRecord } from '@/types';

const statusConfig = {
  completed: { label: '已完成', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  delayed: { label: '延迟', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  missed: { label: '遗漏', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

export default function Medication() {
  const { medicationRecords, setMedicationRecords } = useStore();
  const [elderFilter, setElderFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMedicationRecords(elderFilter || undefined)
      .then((records) => {
        if (records && records.length > 0) {
          setMedicationRecords(records);
        } else {
          setMedicationRecords(mockRecords());
        }
      })
      .catch(() => setMedicationRecords(mockRecords()))
      .finally(() => setLoading(false));
  }, [elderFilter]);

  const elderNames = [...new Set(medicationRecords.map((r) => r.elderName))];

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 flex items-center gap-3 border-b border-white/[0.06]">
        <Pill size={18} className="text-amber-400" />
        <h2 className="text-base font-semibold text-white/90">用药清单</h2>
        <div className="flex-1" />
        <select
          value={elderFilter}
          onChange={(e) => setElderFilter(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none"
        >
          <option value="">全部老人</option>
          {elderNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">加载中...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs text-white/40">
                <th className="text-left px-5 py-3 font-medium">老人姓名</th>
                <th className="text-left px-5 py-3 font-medium">药品名称</th>
                <th className="text-left px-5 py-3 font-medium">计划时间</th>
                <th className="text-left px-5 py-3 font-medium">实际时间</th>
                <th className="text-left px-5 py-3 font-medium">状态</th>
                <th className="text-left px-5 py-3 font-medium">备注</th>
              </tr>
            </thead>
            <tbody>
              {medicationRecords.map((r) => {
                const cfg = statusConfig[r.status];
                return (
                  <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-sm text-white/80">{r.elderName}</td>
                    <td className="px-5 py-3 text-sm text-white/70">{r.medicationName}</td>
                    <td className="px-5 py-3 text-xs text-white/50 font-[JetBrains_Mono,monospace]">
                      {r.scheduledTime?.slice(11, 16) || '-'}
                    </td>
                    <td className="px-5 py-3 text-xs text-white/50 font-[JetBrains_Mono,monospace]">
                      {r.actualTime?.slice(11, 16) || '-'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-white/40">
                      {r.terminalDelay ? (
                        <span className="inline-flex items-center gap-1 text-amber-400">
                          <WifiOff size={11} /> 终端延迟{r.terminalDelay}分钟
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function mockRecords(): MedicationRecord[] {
  const elders = ['张奶奶', '李爷爷', '王奶奶', '赵大爷', '刘奶奶'];
  const meds = ['降压药', '降糖药', '钙片', '安眠药', '心脏药'];
  return elders.flatMap((elder, ei) =>
    meds.slice(ei, ei + 2).map((med, mi) => {
      const status = mi === 0 ? 'completed' : ei % 3 === 0 ? 'delayed' : ei % 5 === 0 ? 'missed' : 'completed';
      return {
        id: `med-${ei}-${mi}`,
        elderId: `e${ei + 1}`,
        elderName: elder,
        medicationName: med,
        scheduledTime: `2026-06-17T${8 + mi * 4}:00:00`,
        actualTime: status === 'missed' ? null : `2026-06-17T${8 + mi * 4 + (status === 'delayed' ? 1 : 0)}:15:00`,
        status,
        terminalDelay: status === 'delayed' ? 23 : null,
      };
    })
  );
}
