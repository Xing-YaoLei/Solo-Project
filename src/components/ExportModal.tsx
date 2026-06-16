import { useState } from 'react';
import { X, FileDown, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { exportData, getComplianceRules } from '@/services/api';
import type { ComplianceRule, ExportRequest } from '@/types';

const viewTypes = [
  { value: 'schedule_trend', label: '排班趋势' },
  { value: 'medication', label: '用药清单' },
  { value: 'visits', label: '探访记录' },
  { value: 'activities', label: '活动签到' },
] as const;

const formats = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'XLSX' },
] as const;

export default function ExportModal() {
  const { exportModalOpen, setExportModalOpen, selectedDateRange } = useStore();
  const [startDate, setStartDate] = useState(selectedDateRange[0]);
  const [endDate, setEndDate] = useState(selectedDateRange[1]);
  const [viewType, setViewType] = useState<ExportRequest['viewType']>('schedule_trend');
  const [format, setFormat] = useState<ExportRequest['format']>('csv');
  const [includeRules, setIncludeRules] = useState(false);
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [exporting, setExporting] = useState(false);

  if (!exportModalOpen) return null;

  const handleIncludeRules = async (checked: boolean) => {
    setIncludeRules(checked);
    if (checked && rules.length === 0) {
      try {
        const r = await getComplianceRules();
        setRules(r);
      } catch {
        setRules(mockRules());
      }
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportData({
        startDate,
        endDate,
        viewType,
        format,
        includeComplianceRules: includeRules,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${viewType}_${startDate}_${endDate}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#1B2A4A] rounded-xl border border-white/[0.08] w-[480px] max-h-[80vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <h3 className="text-base font-semibold text-white/90">导出数据</h3>
          <button onClick={() => setExportModalOpen(false)} className="text-white/40 hover:text-white/80">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-white/50 mb-1 block">开始日期</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-amber-500/40"
              />
            </label>
            <label className="block">
              <span className="text-xs text-white/50 mb-1 block">结束日期</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-amber-500/40"
              />
            </label>
          </div>

          <div>
            <span className="text-xs text-white/50 mb-2 block">视图类型</span>
            <div className="flex gap-2">
              {viewTypes.map((vt) => (
                <button
                  key={vt.value}
                  onClick={() => setViewType(vt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    viewType === vt.value
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-white/[0.04] text-white/50 border border-transparent hover:text-white/70'
                  }`}
                >
                  {vt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-white/50 mb-2 block">导出格式</span>
            <div className="flex gap-2">
              {formats.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    format === f.value
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-white/[0.04] text-white/50 border border-transparent hover:text-white/70'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                includeRules
                  ? 'bg-amber-500/30 border-amber-500/50'
                  : 'bg-white/[0.04] border-white/[0.12]'
              }`}
              onClick={() => handleIncludeRules(!includeRules)}
            >
              {includeRules && <Check size={12} className="text-amber-400" />}
            </div>
            <span className="text-sm text-white/70">附带护理达标计算规则</span>
          </label>

          {includeRules && rules.length > 0 && (
            <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.06]">
              <p className="text-xs text-white/40 mb-2">达标规则预览</p>
              {rules.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-1 text-xs">
                  <span className="text-white/60">{r.name}</span>
                  <span className="text-amber-400/80 font-[JetBrains_Mono,monospace]">
                    ≥{r.threshold}{r.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/[0.08]">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-semibold hover:bg-amber-500/30 transition-colors disabled:opacity-40"
          >
            <FileDown size={16} />
            {exporting ? '导出中...' : '下载'}
          </button>
        </div>
      </div>
    </div>
  );
}

function mockRules(): ComplianceRule[] {
  return [
    { id: 'r1', name: '护理员配比', category: '人员', threshold: 1, unit: ':4床', description: '每名护理员最多照护4张床位' },
    { id: 'r2', name: '用药准时率', category: '用药', threshold: 95, unit: '%', description: '按时服药率不低于95%' },
    { id: 'r3', name: '探访记录完整率', category: '探访', threshold: 98, unit: '%', description: '门禁进出记录完整率不低于98%' },
    { id: 'r4', name: '活动签到率', category: '活动', threshold: 80, unit: '%', description: '日常活动签到率不低于80%' },
  ];
}
