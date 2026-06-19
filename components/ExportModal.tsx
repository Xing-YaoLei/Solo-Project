'use client';

import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileImage, FileText, CheckCircle2 } from 'lucide-react';
import { cn, CLEANING_PUNCTUALITY_RULE } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  punctualityRate: number;
}

type ExportType = 'checkin' | 'deposit' | 'complaint' | 'review' | 'dashboard';
type ExportFormat = 'xlsx' | 'csv' | 'pdf' | 'png';

const EXPORT_OPTIONS: Array<{
  type: ExportType;
  label: string;
  description: string;
  formats: ExportFormat[];
}> = [
  {
    type: 'dashboard',
    label: '监测仪表盘',
    description: '导出完整仪表盘数据，包含所有指标和图表',
    formats: ['xlsx', 'pdf'],
  },
  {
    type: 'checkin',
    label: '入住证件趋势',
    description: '导出入住证件办理数量与异常率趋势数据',
    formats: ['xlsx', 'csv', 'png'],
  },
  {
    type: 'deposit',
    label: '押金明细构成',
    description: '导出押金收取、退还、扣除的明细记录',
    formats: ['xlsx', 'csv', 'png'],
  },
  {
    type: 'complaint',
    label: '客诉证据明细',
    description: '导出客服消息追溯和客诉证据链',
    formats: ['xlsx', 'csv'],
  },
  {
    type: 'review',
    label: '点评标签异常',
    description: '导出OTA点评标签和异常标注数据',
    formats: ['xlsx', 'csv'],
  },
];

export function ExportModal({ isOpen, onClose, punctualityRate }: ExportModalProps) {
  const [selectedType, setSelectedType] = useState<ExportType | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!selectedType) return;

    setIsExporting(true);

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, format: selectedFormat }),
      });

      const result = await res.json();

      if (result.success) {
        const { data, fileName, calculationRule } = result.data;

        if (selectedFormat === 'xlsx' || selectedFormat === 'csv') {
          const exportData = Array.isArray(data) ? data : [data];
          const wb = XLSX.utils.book_new();
          const jsonSheet = XLSX.utils.json_to_sheet(exportData as any[]);
          const jsonData = XLSX.utils.sheet_to_json(jsonSheet, { header: 1 }) as any[][];
          const wsData = [
            ['保洁准时率口径说明'],
            [calculationRule],
            [`保洁准时率: ${(punctualityRate * 100).toFixed(1)}%`],
            [],
            ['数据导出时间', new Date().toLocaleString('zh-CN')],
            [],
            ...jsonData,
          ];
          const ws = XLSX.utils.aoa_to_sheet(wsData);
          XLSX.utils.book_append_sheet(wb, ws, '数据');
          XLSX.writeFile(wb, `${fileName}.${selectedFormat}`);
        }

        setExportSuccess(true);
        setTimeout(() => {
          setExportSuccess(false);
          onClose();
          setSelectedType(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'png':
        return <FileImage className="w-4 h-4" />;
    }
  };

  const getFormatLabel = (format: ExportFormat) => {
    switch (format) {
      case 'xlsx': return 'Excel';
      case 'csv': return 'CSV';
      case 'pdf': return 'PDF';
      case 'png': return '图片';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl mx-4 glass-card p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">导出数据</h2>
            <p className="text-sm text-slate-400 mt-1">
              所有导出文件将包含保洁准时率口径说明
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <p className="text-sm text-blue-300">
            <span className="font-semibold">保洁准时率:</span> {(punctualityRate * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-blue-400/80 mt-1">{CLEANING_PUNCTUALITY_RULE}</p>
        </div>

        {exportSuccess ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <p className="text-xl font-semibold text-white">导出成功</p>
            <p className="text-slate-400 mt-2">文件已开始下载</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {EXPORT_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  onClick={() => {
                    setSelectedType(option.type);
                    setSelectedFormat(option.formats[0]);
                  }}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    selectedType === option.type
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-white">{option.label}</p>
                      <p className="text-sm text-slate-400 mt-1">{option.description}</p>
                    </div>
                    <div className="flex gap-2">
                      {option.formats.map((f) => (
                        <span
                          key={f}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded text-xs",
                            selectedType === option.type && selectedFormat === f
                              ? "bg-blue-500 text-white"
                              : "bg-slate-700 text-slate-300"
                          )}
                        >
                          {getFormatIcon(f)}
                          {getFormatLabel(f)}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedType && (
              <div className="mb-6">
                <p className="text-sm text-slate-400 mb-3">选择导出格式</p>
                <div className="flex gap-3">
                  {EXPORT_OPTIONS.find(o => o.type === selectedType)?.formats.map((format) => (
                    <button
                      key={format}
                      onClick={() => setSelectedFormat(format)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all",
                        selectedFormat === format
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600"
                      )}
                    >
                      {getFormatIcon(format)}
                      {getFormatLabel(format)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-lg border border-slate-600 text-slate-300 font-medium hover:bg-slate-700/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleExport}
                disabled={!selectedType || isExporting}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
                  !selectedType || isExporting
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/25"
                )}
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    导出
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
