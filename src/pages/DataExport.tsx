import { useState, useEffect, useCallback } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { PageHeader, Card, StatusBadge } from '@/components/UI';
import { exportApi, caliberApi } from '@/api';
import type { ExportStatusResponse } from '@/api/types';
import { caliberNotes as mockCaliberNotes } from '@/mock/data';
import {
  Download,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Check,
  Info,
  Loader2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

const DIMENSIONS = [
  { key: 'store', label: '门店维度' },
  { key: 'date', label: '日期维度' },
  { key: 'status', label: '状态维度' },
  { key: 'type', label: '处方类型维度' },
];

const FORMAT_OPTIONS = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' },
  { value: 'pdf', label: 'PDF (.pdf)' },
];

const STEPS = ['选择导出维度', '配置参数', '预览与导出'];

const POLL_INTERVAL = 2000;

export default function DataExport() {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['store']);
  const [dateStart, setDateStart] = useState('2025-06-01');
  const [dateEnd, setDateEnd] = useState('2025-06-12');
  const [format, setFormat] = useState('xlsx');
  const [includeCaliber, setIncludeCaliber] = useState(true);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(true);

  const { data: caliberNotes = mockCaliberNotes } = useQuery({
    queryKey: ['caliberNotes'],
    queryFn: async () => {
      try {
        const res = await caliberApi.list();
        setApiAvailable(true);
        return res.data;
      } catch (e) {
        console.warn('API unavailable, using mock caliber notes');
        setApiAvailable(false);
        return mockCaliberNotes;
      }
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: taskStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['exportStatus', currentTaskId],
    queryFn: async () => {
      if (!currentTaskId) return null;
      try {
        const res = await exportApi.getStatus(currentTaskId);
        return res.data;
      } catch (e) {
        console.warn('Failed to fetch export status');
        return null;
      }
    },
    enabled: !!currentTaskId && apiAvailable,
    refetchInterval: (query) => {
      const data = query.state.data as ExportStatusResponse | null | undefined;
      if (!data || data.status === 'completed' || data.status === 'failed') {
        return false;
      }
      return POLL_INTERVAL;
    },
  });

  const triggerMutation = useMutation({
    mutationFn: async () => {
      const res = await exportApi.trigger({
        export_type: 'prescriptions',
        filters: {
          date_range: { start: dateStart, end: dateEnd },
        },
        include_caliber: includeCaliber,
        dimensions: selectedDimensions,
        date_range: { start: dateStart, end: dateEnd },
        format,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setCurrentTaskId(data.task_id);
    },
    onError: () => {
      setApiAvailable(false);
      runMockExport();
    },
  });

  const [mockProgress, setMockProgress] = useState(0);
  const [mockDone, setMockDone] = useState(false);
  const [mockStatus, setMockStatus] = useState<ExportStatusResponse | null>(null);

  const runMockExport = useCallback(() => {
    setMockProgress(0);
    setMockDone(false);
    const task_id = `mock-${Date.now()}`;
    setCurrentTaskId(task_id);
    setMockStatus({
      task_id,
      status: 'processing',
    });
  }, []);

  useEffect(() => {
    if (!apiAvailable && currentTaskId?.startsWith('mock-') && !mockDone) {
      const interval = setInterval(() => {
        setMockProgress((prev) => {
          const next = prev + 10;
          if (next >= 100) {
            clearInterval(interval);
            setMockDone(true);
            setMockStatus({
              task_id: currentTaskId,
              status: 'completed',
              row_count: 20,
              file_path: `/mock/exports/${currentTaskId}.xlsx`,
            });
            return 100;
          }
          return next;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [apiAvailable, currentTaskId, mockDone]);

  const displayStatus: ExportStatusResponse | null =
    !apiAvailable && mockStatus ? mockStatus : (taskStatus ?? null);

  const isExporting =
    (currentTaskId &&
      displayStatus &&
      displayStatus.status !== 'completed' &&
      displayStatus.status !== 'failed') ||
    (!apiAvailable && !mockDone && currentTaskId?.startsWith('mock-'));

  const exportCompleted = displayStatus?.status === 'completed';
  const exportFailed = displayStatus?.status === 'failed';

  const toggleDimension = (key: string) => {
    setSelectedDimensions((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const canNext = () => {
    if (currentStep === 1) return selectedDimensions.length > 0;
    if (currentStep === 2) return dateStart && dateEnd;
    return true;
  };

  const handleExport = () => {
    if (apiAvailable) {
      triggerMutation.mutate();
    } else {
      runMockExport();
    }
  };

  const handleDownload = () => {
    if (displayStatus?.status === 'completed' && currentTaskId) {
      if (apiAvailable) {
        const token = localStorage.getItem('auth_token');
        const url = exportApi.download(currentTaskId);
        const link = document.createElement('a');
        link.href = url;
        if (token) {
          link.href += `?token=${token}`;
        }
        link.download = `处方审核数据_${dateStart}_${dateEnd}.xlsx`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('演示模式：真实导出文件需连接后端服务');
      }
    }
  };

  const handleReset = () => {
    setCurrentTaskId(null);
    setMockProgress(0);
    setMockDone(false);
    setMockStatus(null);
    setCurrentStep(1);
    setSelectedDimensions(['store']);
    setDateStart('2025-06-01');
    setDateEnd('2025-06-12');
    setFormat('xlsx');
    setIncludeCaliber(true);
    queryClient.invalidateQueries({ queryKey: ['exportStatus'] });
  };

  const getDisplayProgress = () => {
    if (!apiAvailable && currentTaskId?.startsWith('mock-')) {
      return mockProgress;
    }
    if (displayStatus?.status === 'completed') return 100;
    if (displayStatus?.status === 'processing') return 50;
    if (displayStatus?.status === 'pending') return 10;
    return 0;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="数据导出"
        description="导出处方审核数据，附带口径说明便于回访解释"
      />

      <Card>
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((label, idx) => {
            const step = idx + 1;
            const isActive = step === currentStep;
            const stepCompleted = step < currentStep || exportCompleted;
            return (
              <div
                key={label}
                className="flex items-center flex-1 last:flex-none"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      stepCompleted
                        ? 'bg-mint-400 text-white'
                        : isActive
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {stepCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      step
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? 'text-brand-500'
                        : stepCompleted
                        ? 'text-mint-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      stepCompleted ? 'bg-mint-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {!apiAvailable && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-amber-700 font-medium">
                演示模式：后端服务未连接
              </p>
              <p className="text-2xs text-amber-600 mt-0.5">
                启动后端服务 (uvicorn api.main:app --port 8000) 后可使用真实导出功能
              </p>
            </div>
          </div>
        )}

        {currentStep === 1 && !currentTaskId && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              选择导出维度
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {DIMENSIONS.map((dim) => (
                <label
                  key={dim.key}
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedDimensions.includes(dim.key)
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDimensions.includes(dim.key)}
                    onChange={() => toggleDimension(dim.key)}
                    className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-700">{dim.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && !currentTaskId && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                日期范围
              </h3>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <span className="text-slate-400">至</span>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                导出格式
              </h3>
              <div className="flex gap-3">
                {FORMAT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      format === opt.value
                        ? 'border-brand-500 bg-brand-50 text-brand-500'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={opt.value}
                      checked={format === opt.value}
                      onChange={() => setFormat(opt.value)}
                      className="sr-only"
                    />
                    {opt.value === 'xlsx' && (
                      <FileSpreadsheet className="w-4 h-4" />
                    )}
                    {opt.value === 'csv' && <Download className="w-4 h-4" />}
                    {opt.value === 'pdf' && (
                      <FileSpreadsheet className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                是否附带口径说明
              </h3>
              <button
                type="button"
                onClick={() => setIncludeCaliber(!includeCaliber)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  includeCaliber ? 'bg-brand-500' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    includeCaliber ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="ml-2 text-sm text-slate-600">
                {includeCaliber ? '已开启' : '已关闭'}
              </span>
              <p className="text-2xs text-slate-400 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                附带口径说明可在回访时帮助解释数据统计口径，Excel 将包含单独的口径说明工作表
              </p>
            </div>
          </div>
        )}

        {currentStep === 3 && !currentTaskId && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              导出预览
            </h3>
            <div className="bg-slate-25 rounded-lg border border-slate-100 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">导出维度</span>
                <span className="text-slate-700">
                  {selectedDimensions
                    .map((d) => DIMENSIONS.find((dim) => dim.key === d)?.label)
                    .join('、')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">日期范围</span>
                <span className="text-slate-700">
                  {dateStart} 至 {dateEnd}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">导出格式</span>
                <span className="text-slate-700">
                  {FORMAT_OPTIONS.find((o) => o.value === format)?.label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">口径说明</span>
                <span
                  className={
                    includeCaliber ? 'text-mint-400' : 'text-slate-400'
                  }
                >
                  {includeCaliber ? '已附带' : '未附带'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">数据来源</span>
                <span className={apiAvailable ? 'text-mint-400' : 'text-amber-500'}>
                  {apiAvailable ? '后端 API' : '演示模式 (模拟导出)'}
                </span>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={triggerMutation.isPending}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {triggerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  正在发起导出...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  开始导出
                </>
              )}
            </button>
          </div>
        )}

        {isExporting && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
            <p className="text-sm text-slate-600 mb-2">正在生成导出文件...</p>
            {displayStatus && (
              <StatusBadge
                status={displayStatus.status}
                size="sm"
              />
            )}
            <div className="w-64 mx-auto h-2 bg-slate-100 rounded-full overflow-hidden mt-4">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-300"
                style={{ width: `${getDisplayProgress()}%` }}
              />
            </div>
            <p className="text-2xs text-slate-400 mt-2">
              {getDisplayProgress()}%
            </p>
            {currentTaskId && (
              <p className="text-2xs text-slate-300 mt-3 font-mono">
                任务ID: {currentTaskId}
              </p>
            )}
          </div>
        )}

        {exportCompleted && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-mint-50 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-mint-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">
              导出完成
            </p>
            <p className="text-2xs text-slate-400 mb-2">
              {displayStatus?.row_count
                ? `共 ${displayStatus.row_count} 条处方数据`
                : '文件已生成'}
              ，可点击下载
            </p>
            {currentTaskId && (
              <p className="text-2xs text-slate-300 mb-4 font-mono">
                任务ID: {currentTaskId}
              </p>
            )}
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              下载文件
            </button>
            <button
              onClick={handleReset}
              className="ml-3 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              重新导出
            </button>
          </div>
        )}

        {exportFailed && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">
              导出失败
            </p>
            <p className="text-2xs text-red-500 mb-4">
              {displayStatus?.error_message || '未知错误'}
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              重新导出
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
          <button
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1 || isExporting || !!currentTaskId}
            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            上一步
          </button>
          {currentStep < 3 && !currentTaskId && (
            <button
              onClick={() => setCurrentStep((s) => Math.min(3, s + 1))}
              disabled={!canNext()}
              className="flex items-center gap-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              下一步
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </Card>

      <Card title="口径说明">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">
                  指标
                </th>
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">
                  定义
                </th>
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">
                  排除项
                </th>
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">
                  备注
                </th>
              </tr>
            </thead>
            <tbody>
              {caliberNotes.map((note) => (
                <tr key={note.id} className="border-b border-slate-50 hover:bg-slate-25">
                  <td className="py-3 px-3 font-medium text-slate-700">
                    {note.metric}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{note.definition}</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {note.exclusions.map((ex, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium bg-amber-50 text-amber-600"
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-xs">
                    {note.remarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
