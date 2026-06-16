import { useState } from 'react';
import StatusBar from '@/components/StatusBar';
import ScheduleTrendChart from '@/components/ScheduleTrendChart';
import RiskAnnotationLayer from '@/components/RiskAnnotationLayer';
import ReviewNotePanel from '@/components/ReviewNotePanel';
import ExportModal from '@/components/ExportModal';
import { useStore } from '@/store/useStore';
import { CalendarDays } from 'lucide-react';

export default function Dashboard() {
  const { selectedDateRange, setSelectedDateRange, selectedAnnotation } = useStore();

  return (
    <div className="flex flex-col h-full">
      <StatusBar />

      <div className="px-5 py-3 flex items-center gap-3">
        <CalendarDays size={16} className="text-white/40" />
        <span className="text-xs text-white/40">日期范围</span>
        <input
          type="date"
          value={selectedDateRange[0]}
          onChange={(e) => setSelectedDateRange([e.target.value, selectedDateRange[1]])}
          className="bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-xs text-white/70 focus:outline-none focus:border-amber-500/40"
        />
        <span className="text-xs text-white/30">至</span>
        <input
          type="date"
          value={selectedDateRange[1]}
          onChange={(e) => setSelectedDateRange([selectedDateRange[0], e.target.value])}
          className="bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-xs text-white/70 focus:outline-none focus:border-amber-500/40"
        />
      </div>

      <div className="flex-1 px-5 pb-5 relative overflow-hidden">
        <div className="h-full flex flex-col gap-3">
          <RiskAnnotationLayer />
          <div className={`flex-1 relative ${selectedAnnotation ? 'mr-[360px]' : ''} transition-all duration-300`}>
            <ScheduleTrendChart />
          </div>
        </div>

        <ReviewNotePanel />
      </div>

      <ExportModal />
    </div>
  );
}
