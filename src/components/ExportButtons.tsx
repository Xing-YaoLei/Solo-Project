'use client';

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Download, FileText, FileSpreadsheet, Image as ImageIcon, Share2, Check, Copy } from 'lucide-react';
import { useFilterStore } from '@/store/useFilterStore';
import { exportToPDF, exportToExcel, generateShareLink, getFilterDescription } from '@/services/exportService';
import type { Hearing } from '@/types';
import { cn } from '@/lib/utils';

interface ExportButtonsProps {
  data: Hearing[];
  title?: string;
  showShare?: boolean;
  className?: string;
  targetRef?: React.RefObject<HTMLElement>;
}

export function ExportButtons({
  data,
  title = '开庭日历报表',
  showShare = true,
  className,
  targetRef,
}: ExportButtonsProps) {
  const { filters } = useFilterStore();
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const internalRef = useRef<HTMLDivElement>(null);

  const getExportElement = (): HTMLElement | null => {
    if (targetRef?.current) {
      return targetRef.current;
    }
    return internalRef.current;
  };

  const handleExportPDF = async () => {
    const element = getExportElement();
    if (!element) return;
    setIsExporting('pdf');
    try {
      await exportToPDF(element, filters, title);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting('excel');
    try {
      await exportToExcel(data, filters, title);
    } catch (error) {
      console.error('Excel export failed:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportImage = async () => {
    const element = getExportElement();
    if (!element) return;
    setIsExporting('image');
    try {
      const { captureScreenshot } = await import('@/services/exportService');
      const dataUrl = await captureScreenshot(element, filters, title);
      const link = document.createElement('a');
      link.download = `${title}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Image export failed:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleShare = async () => {
    const link = generateShareLink(filters);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('复制以下链接分享:', link);
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div ref={internalRef} className="hidden" />
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          loading={isExporting === 'pdf'}
          disabled={data.length === 0}
        >
          <FileText className="h-4 w-4" />
          导出 PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          loading={isExporting === 'excel'}
          disabled={data.length === 0}
        >
          <FileSpreadsheet className="h-4 w-4" />
          导出 Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportImage}
          loading={isExporting === 'image'}
          disabled={data.length === 0}
        >
          <ImageIcon className="h-4 w-4" />
          截图导出
        </Button>
        {showShare && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={data.length === 0}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {copied ? '已复制' : '分享链接'}
          </Button>
        )}
      </div>
      {data.length > 0 && (
        <div className="text-xs text-slate-500">
          <span className="font-medium">筛选条件:</span> {getFilterDescription(filters)}
        </div>
      )}
    </div>
  );
}
