'use client';

import { useState } from 'react';
import { X, FileSpreadsheet, FileText, CheckCircle2, Info } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard';
import { REWORK_RATE_CALCULATION } from '@/types';

export function ExportModal() {
  const { isExportModalOpen, setExportModalOpen } = useDashboardStore();
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [scope, setScope] = useState<string[]>(['trend', 'inventory', 'quotes']);
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  if (!isExportModalOpen) return null;

  const toggleScope = (s: string) => {
    setScope((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, scope }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `risk-report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setExporting(false);
        setExportModalOpen(false);
      }, 1500);
    } catch {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-industrial-700 bg-industrial-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-industrial-700 px-5 py-4">
          <h3 className="font-display text-base font-bold text-white">导出数据</h3>
          <button
            onClick={() => setExportModalOpen(false)}
            className="rounded p-1 text-industrial-400 transition hover:bg-industrial-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-xs font-semibold text-industrial-200">导出格式</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat('xlsx')}
                className={`flex items-center gap-2 rounded-lg border p-3 text-left transition ${
                  format === 'xlsx'
                    ? 'border-risk-info bg-risk-info/10 text-risk-info'
                    : 'border-industrial-700 bg-industrial-900 text-industrial-300 hover:border-industrial-500'
                }`}
              >
                <FileSpreadsheet className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">Excel (.xlsx)</p>
                  <p className="text-[10px] opacity-70">多 Sheet 完整导出</p>
                </div>
              </button>
              <button
                onClick={() => setFormat('csv')}
                className={`flex items-center gap-2 rounded-lg border p-3 text-left transition ${
                  format === 'csv'
                    ? 'border-risk-info bg-risk-info/10 text-risk-info'
                    : 'border-industrial-700 bg-industrial-900 text-industrial-300 hover:border-industrial-500'
                }`}
              >
                <FileText className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">CSV</p>
                  <p className="text-[10px] opacity-70">工单趋势数据</p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-industrial-200">导出范围</label>
            <div className="space-y-1.5">
              {[
                { key: 'trend', label: '工单项目趋势数据' },
                { key: 'inventory', label: '配件库存构成数据' },
                { key: 'quotes', label: '报价单明细（含配件追溯）' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => toggleScope(item.key)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition ${
                    scope.includes(item.key)
                      ? 'border-risk-info/50 bg-industrial-900 text-white'
                      : 'border-industrial-700 bg-industrial-900/50 text-industrial-400'
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      scope.includes(item.key)
                        ? 'border-risk-info bg-risk-info'
                        : 'border-industrial-600'
                    }`}
                  >
                    {scope.includes(item.key) && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-risk-warning/30 bg-risk-warning/5 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-risk-warning">
              <Info className="h-3.5 w-3.5" />
              返修率计算口径（自动随导出附带）
            </div>
            <pre className="whitespace-pre-wrap text-[10px] leading-relaxed text-industrial-300">
              {REWORK_RATE_CALCULATION}
            </pre>
          </div>
        </div>

        <div className="flex gap-2 border-t border-industrial-700 px-5 py-4">
          <button
            onClick={() => setExportModalOpen(false)}
            disabled={exporting}
            className="flex-1 rounded-lg border border-industrial-600 bg-industrial-800 px-4 py-2.5 text-xs font-semibold text-industrial-200 transition hover:bg-industrial-700 disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || scope.length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-risk-info px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
          >
            {done ? (
              <><CheckCircle2 className="h-4 w-4" /> 导出成功</>
            ) : exporting ? (
              '导出中...'
            ) : (
              `开始导出 (${scope.length} 项)`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
