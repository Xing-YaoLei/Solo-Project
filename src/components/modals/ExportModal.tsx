'use client';

import { useState } from 'react';
import { X, Download, FileSpreadsheet, Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  const [includeOccupancySpec, setIncludeOccupancySpec] = useState(true);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const sections = [
    { id: 'overview', label: '概览数据', desc: '核心指标和统计摘要' },
    { id: 'seatTrend', label: '座位销售趋势', desc: '每日销售和锁座数据' },
    { id: 'orders', label: '订单构成分析', desc: '来源、支付方式、票种分布' },
    { id: 'ticketTypes', label: '票种明细', desc: '各票种销售进度和规则' },
    { id: 'lockRecords', label: '锁座记录', desc: '锁座明细和异常记录' },
  ];

  const formatOptions = [
    { value: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
    { value: 'csv', label: 'CSV (.csv)', icon: FileSpreadsheet },
    { value: 'pdf', label: 'PDF (.pdf)', icon: FileSpreadsheet },
  ];

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const selectAll = () => {
    setSelectedSections(sections.map(s => s.id));
  };

  const clearAll = () => {
    setSelectedSections([]);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/export/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          includeOccupancySpec,
          sections: selectedSections,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const contentDisposition = res.headers.get('Content-Disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'dashboard_export.xlsx'
          : `dashboard_export_${Date.now()}.xlsx`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        setExportSuccess(true);
        setTimeout(() => {
          setExportSuccess(false);
          handleClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setSelectedSections([]);
    setIncludeOccupancySpec(true);
    setExportSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg animate-fade-in">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold text-white">导出数据</h2>
            <button onClick={handleClose} className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {exportSuccess ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="h-8 w-8 text-success" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">导出成功</h3>
              <p className="text-neutral-400">文件已开始下载</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-sm font-medium text-neutral-300">导出格式</label>
                <div className="grid grid-cols-3 gap-2">
                  {formatOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setFormat(opt.value as any)}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-lg border p-3 transition-all',
                          format === opt.value
                            ? 'border-primary bg-primary/10 text-white'
                            : 'border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{opt.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-neutral-300">导出内容</label>
                  <div className="flex gap-2 text-xs">
                    <button onClick={selectAll} className="text-primary hover:text-primary-light">
                      全选
                    </button>
                    <span className="text-neutral-600">|</span>
                    <button onClick={clearAll} className="text-neutral-400 hover:text-neutral-300">
                      清空
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => toggleSection(section.id)}
                      className={cn(
                        'w-full rounded-lg border p-3 text-left transition-all',
                        selectedSections.includes(section.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'h-5 w-5 rounded border flex items-center justify-center transition-colors',
                            selectedSections.includes(section.id)
                              ? 'border-primary bg-primary'
                              : 'border-neutral-600'
                          )}
                        >
                          {selectedSections.includes(section.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div>
                          <div className={cn(
                            'font-medium',
                            selectedSections.includes(section.id) ? 'text-white' : 'text-neutral-300'
                          )}>
                            {section.label}
                          </div>
                          <div className="text-xs text-neutral-500">{section.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-neutral-800/50 border border-neutral-700 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeOccupancySpec}
                    onChange={(e) => setIncludeOccupancySpec(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-200">
                      <Info className="h-4 w-4 text-primary" />
                      包含上座率口径说明
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      在导出文件中附加上座率计算方法、公式、排除座位和数据来源说明
                    </div>
                  </div>
                </label>
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting || selectedSections.length === 0}
                className="btn-primary w-full gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                {isExporting ? '正在导出...' : `导出 ${selectedSections.length} 个模块`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
