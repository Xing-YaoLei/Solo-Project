import * as React from 'react';
import { Download, FileSpreadsheet, FileText, Check, AlertCircle, Loader2, Info } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { exportApi } from '@/api/endpoints/export';
import { useAuthStore } from '@/store/authStore';
import type { ExportRequest, ExportResponse, ExportFormat, ExportType, ExportProgress } from '@/types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultExportType?: ExportType;
}

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
];

const REPORT_TYPE_OPTIONS = [
  { value: 'reconciliation_diff', label: '对账差异' },
  { value: 'contract_composition', label: '合同构成' },
  { value: 'invoice_detail', label: '单据明细' },
  { value: 'full_report', label: '全部' },
];

const EXPORT_TYPE_MAP: Record<string, ExportType> = {
  reconciliation_diff: 'cases',
  contract_composition: 'cases',
  invoice_detail: 'invoices',
  full_report: 'full_report',
};

const PAYMENT_CYCLE_DESCRIPTION = `
回款周期口径说明：

1. 月度回款（Monthly）：
   - 按自然月统计回款金额
   - 统计周期：每月1日至当月最后一天
   - 适用场景：常规月度对账

2. 季度回款（Quarterly）：
   - 按自然季度统计回款金额
   - 统计周期：每季度首月1日至季度末最后一天
   - 适用场景：季度业绩考核

3. 半年度回款（Half-yearly）：
   - 按半年统计回款金额
   - 统计周期：1月1日-6月30日，7月1日-12月31日
   - 适用场景：半年度总结报告

4. 年度回款（Yearly）：
   - 按自然年统计回款金额
   - 统计周期：每年1月1日至12月31日
   - 适用场景：年度财务审计

5. 里程碑回款（Milestone）：
   - 按项目里程碑节点统计
   - 统计周期：根据合同约定的里程碑日期
   - 适用场景：大型项目阶段性回款

注意事项：
- 实际回款日期以款项到账日期为准
- 逾期款项按实际回款日期计入对应周期
- 预收款按合同约定的服务期间分摊
`;

const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  defaultExportType = 'full_report',
}) => {
  const user = useAuthStore((state) => state.user);
  const [format, setFormat] = React.useState<ExportFormat>('excel');
  const [reportType, setReportType] = React.useState<string>('full_report');
  const [showCycleInfo, setShowCycleInfo] = React.useState<boolean>(false);
  const [exportResult, setExportResult] = React.useState<ExportResponse | null>(null);
  const [progress, setProgress] = React.useState<ExportProgress | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [downloading, setDownloading] = React.useState<boolean>(false);
  const progressIntervalRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setExportResult(null);
      setProgress(null);
      setError(null);
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isOpen]);

  const pollProgress = React.useCallback(async (exportId: string) => {
    try {
      const prog = await exportApi.getExportProgress(exportId);
      setProgress(prog);

      if (prog.status === 'completed' || prog.status === 'failed') {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        const result = await exportApi.getExportStatus(exportId);
        setExportResult(result);
        setLoading(false);

        if (prog.status === 'failed' && result.error_message) {
          setError(result.error_message);
        }
      }
    } catch {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setLoading(false);
      setError('获取导出进度失败');
    }
  }, []);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setExportResult(null);
    setProgress(null);

    try {
      const exportType = EXPORT_TYPE_MAP[reportType] || defaultExportType;

      const exportData: ExportRequest = {
        export_type: exportType,
        format: format,
        include_attachments: false,
        hide_sensitive: user?.role === 'client',
      };

      const result = await exportApi.requestExport(exportData);
      setExportResult(result);

      setProgress({
        export_id: result.export_id,
        status: 'processing',
        progress: 0,
        message: '正在准备导出数据...',
      });

      progressIntervalRef.current = window.setInterval(() => {
        pollProgress(result.export_id);
      }, 1000);

      pollProgress(result.export_id);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '导出请求失败');
    }
  };

  const handleDownload = async () => {
    if (!exportResult?.download_url) return;

    setDownloading(true);
    try {
      const blob = await exportApi.downloadExport(exportResult.export_id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportResult.file_name || `export_${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setError('下载失败，请稍后重试');
    } finally {
      setDownloading(false);
    }
  };

  const handleClose = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setExportResult(null);
    setProgress(null);
    setError(null);
    onClose();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'processing':
        return 'text-blue-500';
      case 'failed':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'processing':
        return '处理中';
      case 'failed':
        return '失败';
      default:
        return status;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="导出数据"
      description="选择导出格式和报表类型，系统将自动添加回款周期口径说明"
      className="max-w-xl"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            {format === 'pdf' ? (
              <FileText className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            )}
            导出格式
          </label>
          <div className="flex gap-2">
            {FORMAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormat(option.value as ExportFormat)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors border flex items-center justify-center gap-2 ${
                  format === option.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                {option.value === 'pdf' ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            报表类型
          </label>
          <Select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            options={REPORT_TYPE_OPTIONS}
          />
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowCycleInfo(!showCycleInfo)}
            className="w-full flex items-center justify-between p-3 rounded-md border border-border hover:bg-accent transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">回款周期口径说明预览</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {showCycleInfo ? '收起' : '展开'}
            </span>
          </button>
          {showCycleInfo && (
            <div className="p-4 rounded-md border border-border bg-muted/30 max-h-60 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground font-mono">
                {PAYMENT_CYCLE_DESCRIPTION}
              </pre>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            * 导出文件将自动包含此说明
            {format === 'excel' && '（Excel 会添加专门的说明 Sheet）'}
            {format === 'pdf' && '（PDF 会添加水印和说明页）'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {(loading || exportResult) && (
          <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            {progress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={getStatusColor(progress.status)}>
                    {getStatusText(progress.status)}
                  </span>
                  <span className="text-muted-foreground">{progress.progress}%</span>
                </div>
                <div className="w-full h-2 bg-input rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      progress.status === 'failed' ? 'bg-destructive' : 'bg-primary'
                    }`}
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                {progress.message && (
                  <p className="text-xs text-muted-foreground">{progress.message}</p>
                )}
              </div>
            )}

            {exportResult && exportResult.status === 'completed' && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <Check className="h-4 w-4" />
                  导出完成
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">文件名：</span>
                    {exportResult.file_name}
                  </div>
                  <div>
                    <span className="font-medium">文件大小：</span>
                    {formatFileSize(exportResult.file_size)}
                  </div>
                  <div>
                    <span className="font-medium">创建时间：</span>
                    {exportResult.created_at && formatDateTime(exportResult.created_at)}
                  </div>
                  <div>
                    <span className="font-medium">完成时间：</span>
                    {exportResult.completed_at && formatDateTime(exportResult.completed_at)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={handleClose}>
          关闭
        </Button>
        {!exportResult || exportResult.status === 'failed' ? (
          <Button onClick={handleExport} loading={loading}>
            <Download className="h-4 w-4" />
            开始导出
          </Button>
        ) : exportResult.status === 'completed' ? (
          <Button onClick={handleDownload} loading={downloading}>
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                下载中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                下载文件
              </>
            )}
          </Button>
        ) : null}
      </ModalFooter>
    </Modal>
  );
};

export { ExportModal };
export default ExportModal;
