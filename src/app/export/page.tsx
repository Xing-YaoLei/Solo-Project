'use client';

import { useMemo, useState, useRef } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Image,
  Share2,
  Clock,
  Calendar,
  Filter,
  Copy,
  Check,
  Link2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/filters/FilterBar';
import { FunnelChart } from '@/components/charts/FunnelChart';
import { AttendancePieChart } from '@/components/charts/AttendancePieChart';
import { useFilterStore } from '@/store/useFilterStore';
import {
  getFilteredHearings,
  getAttendanceStats,
} from '@/services/hearingsService';
import {
  exportToPDF,
  exportToExcel,
  captureScreenshot,
  generateShareLink,
  getFilterDescription,
} from '@/services/exportService';
import { getFunnelData, mockCapacityRules } from '@/data/mockData';
import { generateFilterHash } from '@/lib/utils';

export default function ExportPage() {
  const { filters } = useFilterStore();
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [exportHistory, setExportHistory] = useState<Array<{
    id: string;
    type: string;
    title: string;
    timestamp: Date;
    filterHash: string;
  }>>([]);

  const dashboardRef = useRef<HTMLDivElement>(null);

  const filteredHearings = useMemo(
    () => getFilteredHearings(filters),
    [filters]
  );

  const attendanceStats = useMemo(
    () => getAttendanceStats(filteredHearings),
    [filteredHearings]
  );

  const funnelData = getFunnelData();

  const filterHash = useMemo(
    () => generateFilterHash(filters as unknown as Record<string, unknown>),
    [filters]
  );

  const shareLink = generateShareLink(filters);

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting('pdf');
    try {
      await exportToPDF(dashboardRef.current, filters, '开庭日历报表');
      setExportHistory((prev) => [
        {
          id: Date.now().toString(),
          type: 'PDF',
          title: '开庭日历报表',
          timestamp: new Date(),
          filterHash,
        },
        ...prev,
      ]);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting('excel');
    try {
      await exportToExcel(filteredHearings, filters, '开庭日历报表');
      setExportHistory((prev) => [
        {
          id: Date.now().toString(),
          type: 'Excel',
          title: '开庭日历报表',
          timestamp: new Date(),
          filterHash,
        },
        ...prev,
      ]);
    } catch (error) {
      console.error('Excel export failed:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportImage = async () => {
    if (!dashboardRef.current) return;
    setIsExporting('image');
    try {
      const dataUrl = await captureScreenshot(
        dashboardRef.current,
        filters,
        '开庭日历报表'
      );
      const link = document.createElement('a');
      link.download = `开庭日历报表_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      setExportHistory((prev) => [
        {
          id: Date.now().toString(),
          type: 'Image',
          title: '开庭日历报表',
          timestamp: new Date(),
          filterHash,
        },
        ...prev,
      ]);
    } catch (error) {
      console.error('Image export failed:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('复制以下链接分享:', shareLink);
    }
  };

  const exportOptions = [
    {
      id: 'pdf',
      title: '导出 PDF',
      description: '适合打印和存档，包含图表和表格',
      icon: FileText,
      color: 'from-red-500 to-red-600',
      onClick: handleExportPDF,
    },
    {
      id: 'excel',
      title: '导出 Excel',
      description: '适合数据分析，包含完整明细',
      icon: FileSpreadsheet,
      color: 'from-green-500 to-green-600',
      onClick: handleExportExcel,
    },
    {
      id: 'image',
      title: '截图导出',
      description: '适合快速分享，自动添加筛选条件水印',
      icon: Image,
      color: 'from-blue-500 to-blue-600',
      onClick: handleExportImage,
    },
    {
      id: 'link',
      title: '分享链接',
      description: '生成包含筛选条件的可分享链接',
      icon: Share2,
      color: 'from-purple-500 to-purple-600',
      onClick: handleCopyLink,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">
          导出中心
        </h1>
        <p className="mt-1 text-slate-500">
          导出报表数据，生成带筛选条件的分享链接
        </p>
      </div>

      <FilterBar />

      <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50/50 p-4">
        <div className="flex items-center gap-2 text-sm text-primary-700">
          <Filter className="h-4 w-4" />
          <span className="font-medium">当前筛选条件:</span>
          <span>{getFilterDescription(filters)}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-primary-600">
          <Link2 className="h-3 w-3" />
          <span className="font-mono">取数标识: {filterHash.slice(0, 32)}...</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {exportOptions.map((option) => (
          <Card
            key={option.id}
            className="cursor-pointer transition-all hover:shadow-lg"
            onClick={option.onClick}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${option.color} text-white shadow-lg`}
                >
                  <option.icon className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <p className="font-display font-semibold text-slate-900">
                    {option.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {option.description}
                  </p>
                  {option.id === 'link' && copied && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                      <Check className="h-3 w-3" />
                      链接已复制
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div ref={dashboardRef} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-500" />
              预览报表
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 font-medium text-slate-700">流程转化漏斗</h3>
                <FunnelChart data={funnelData} />
              </div>
              <div>
                <h3 className="mb-2 font-medium text-slate-700">到场状态分布</h3>
                <AttendancePieChart data={attendanceStats} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-500" />
            容量规则说明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mockCapacityRules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{rule.name}</p>
                    <p className="text-sm text-slate-500">{rule.description}</p>
                  </div>
                  <Badge variant="info">{rule.id}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">日最大开庭数</p>
                    <p className="font-semibold text-slate-900">
                      {rule.maxDailyHearings} 场
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">周最大开庭数</p>
                    <p className="font-semibold text-slate-900">
                      {rule.maxWeeklyHearings} 场
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">工作时段</p>
                    <p className="font-semibold text-slate-900">
                      {rule.timeSlotStart} - {rule.timeSlotEnd}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {exportHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary-500" />
              导出历史
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exportHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        record.type === 'PDF'
                          ? 'danger'
                          : record.type === 'Excel'
                          ? 'success'
                          : 'info'
                      }
                    >
                      {record.type}
                    </Badge>
                    <div>
                      <p className="font-medium text-slate-900">{record.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(record.timestamp).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">取数标识</p>
                    <p className="font-mono text-xs text-slate-700">
                      {record.filterHash.slice(0, 16)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
