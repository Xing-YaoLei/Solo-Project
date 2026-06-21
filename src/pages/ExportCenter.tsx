import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Calendar,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  XCircle,
  Eye,
  Shield,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Empty } from '@/components/ui/Empty';
import {
  PageHeader,
  ContentCard,
} from '@/components/layout/Layout';
import { usePermission } from '@/hooks/usePermission';
import { exportApi } from '@/api/endpoints/export';
import {
  formatDate,
  formatDateTime,
  formatFileSize,
} from '@/utils/format';
import { mockLawyers, caseTypes } from '@/utils/mockData';
import type {
  ExportResponse,
  ExportRequest,
  ExportFormat,
  ExportType,
  FilterParams,
} from '@/types';

const mockExportHistory: ExportResponse[] = [
  {
    export_id: 'export-001',
    export_type: 'full_report',
    format: 'excel',
    status: 'completed',
    created_at: '2024-06-20T14:30:00',
    started_at: '2024-06-20T14:30:05',
    completed_at: '2024-06-20T14:30:45',
    file_name: '案件费用完整报表_20240620.xlsx',
    file_size: 2456789,
    download_url: '/exports/export-001/download',
  },
  {
    export_id: 'export-002',
    export_type: 'invoices',
    format: 'pdf',
    status: 'completed',
    created_at: '2024-06-18T10:15:00',
    started_at: '2024-06-18T10:15:02',
    completed_at: '2024-06-18T10:15:30',
    file_name: '发票明细报表_20240618.pdf',
    file_size: 1234567,
    download_url: '/exports/export-002/download',
  },
  {
    export_id: 'export-003',
    export_type: 'cases',
    format: 'excel',
    status: 'processing',
    created_at: '2024-06-22T09:00:00',
    started_at: '2024-06-22T09:00:05',
    file_name: '案件列表报表_20240622.xlsx',
  },
  {
    export_id: 'export-004',
    export_type: 'approvals',
    format: 'csv',
    status: 'failed',
    created_at: '2024-06-15T16:45:00',
    started_at: '2024-06-15T16:45:02',
    completed_at: '2024-06-15T16:45:10',
    error_message: '数据处理超时，请稍后重试',
  },
];

const formatOptions = [
  { value: 'excel', label: 'Excel', icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-100' },
  { value: 'pdf', label: 'PDF', icon: FileText, color: 'text-red-600', bg: 'bg-red-100' },
];

const reportTypeOptions = [
  { value: 'full_report', label: '完整报表', description: '包含所有案件、发票、回款、审批数据' },
  { value: 'cases', label: '案件列表', description: '案件基本信息及费用汇总' },
  { value: 'invoices', label: '发票明细', description: '所有发票单据及明细' },
  { value: 'payments', label: '回款记录', description: '回款计划及实际回款记录' },
  { value: 'approvals', label: '审批记录', description: '所有审批节点及处理结果' },
];

const paymentCycleDescription = `
回款周期计算口径说明：

1. **合同签订日起算**：从委托合同签订日期开始计算
2. **阶段划分**：按合同约定的里程碑节点划分回款阶段
3. **逾期计算**：超过约定付款日期即视为逾期
4. **平均周期**：所有已完成回款的实际周期平均值
5. **预测周期**：基于历史数据对未来回款的预测

计算公式：
- 单个案件回款周期 = 实际回款日期 - 合同签订日期
- 平均回款周期 = Σ(各案件回款周期) / 已完成案件数
- 逾期天数 = 实际回款日期 - 约定付款日期（逾期时）
`;

const ExportCenter: React.FC = () => {
  const { canExportData, isPartner, isLawyer } = usePermission();
  const [loading, setLoading] = useState(true);
  const [exportHistory, setExportHistory] = useState<ExportResponse[]>([]);
  const [showCycleInfo, setShowCycleInfo] = useState(false);

  const [formData, setFormData] = useState<ExportRequest>({
    export_type: 'full_report',
    format: 'excel',
    include_attachments: false,
    hide_sensitive: true,
  });
  const [filters, setFilters] = useState<FilterParams>({});
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'history'>('export');

  useEffect(() => {
    loadExportHistory();
  }, []);

  const loadExportHistory = async () => {
    setLoading(true);
    try {
      try {
        const data = await exportApi.getExports();
        setExportHistory(data);
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setExportHistory(mockExportHistory);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!canExportData) {
      alert('您没有导出数据的权限');
      return;
    }

    setExporting(true);
    try {
      const requestData: ExportRequest = {
        ...formData,
        start_date: dateRange.start || undefined,
        end_date: dateRange.end || undefined,
        ...filters,
      };

      let result: ExportResponse;
      try {
        result = await exportApi.requestExport(requestData);
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        result = {
          export_id: `export-${Date.now()}`,
          export_type: requestData.export_type,
          format: requestData.format,
          status: 'processing',
          created_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
        };
      }

      setExportHistory((prev) => [result, ...prev]);
      setActiveTab('history');
    } catch {
      alert('导出请求失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = async (exportId: string) => {
    try {
      const blob = await exportApi.downloadExport(exportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const exportItem = exportHistory.find((e) => e.export_id === exportId);
      a.download = exportItem?.file_name || `export_${exportId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('下载失败，请稍后重试');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'processing':
        return '处理中';
      case 'failed':
        return '失败';
      default:
        return '等待中';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormatIcon = (format: string) => {
    const option = formatOptions.find((o) => o.value === format);
    if (option) {
      return <option.icon className={`w-5 h-5 ${option.color}`} />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const getExportTypeLabel = (type: string) => {
    const option = reportTypeOptions.find((o) => o.value === type);
    return option?.label || type;
  };

  if (loading && activeTab === 'history') {
    return <Loading fullScreen />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="导出中心"
        description="导出报表数据，支持多种格式"
      />

      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'export' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('export')}
          className={activeTab === 'export' ? 'bg-primary text-white' : ''}
        >
          <FileText className="w-4 h-4 mr-2" />
          新建导出
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('history')}
          className={activeTab === 'history' ? 'bg-primary text-white' : ''}
        >
          <Clock className="w-4 h-4 mr-2" />
          导出历史
          {exportHistory.filter((e) => e.status === 'processing').length > 0 && (
            <Badge className="ml-2 bg-blue-500">
              {exportHistory.filter((e) => e.status === 'processing').length}
            </Badge>
          )}
        </Button>
      </div>

      {activeTab === 'export' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ContentCard
              title="导出格式"
              description="选择导出文件格式"
              className="animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="grid grid-cols-2 gap-4">
                {formatOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        format: option.value as ExportFormat,
                      }))
                    }
                    className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                      formData.format === option.value
                        ? 'border-gold bg-gold-50'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${option.bg} flex items-center justify-center`}>
                        <option.icon className={`w-6 h-6 ${option.color}`} />
                      </div>
                      <div>
                        <h4 className={`font-semibold ${
                          formData.format === option.value ? 'text-gold-700' : 'text-foreground'
                        }`}>
                          {option.label}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {option.value === 'excel' ? '适合数据处理和分析' : '适合打印和存档'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ContentCard>

            <ContentCard
              title="报表类型"
              description="选择需要导出的报表内容"
              className="animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="space-y-3">
                {reportTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        export_type: option.value as ExportType,
                      }))
                    }
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      formData.export_type === option.value
                        ? 'border-primary bg-primary-50'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={`font-semibold ${
                          formData.export_type === option.value ? 'text-primary-800' : 'text-foreground'
                        }`}>
                          {option.label}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        formData.export_type === option.value
                          ? 'border-primary bg-primary'
                          : 'border-gray-300'
                      }`}>
                        {formData.export_type === option.value && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ContentCard>

            <ContentCard
              title="筛选条件"
              description="设置导出数据的时间范围和筛选条件"
              className="animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Calendar className="w-4 h-4 inline mr-1.5" />
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, start: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Calendar className="w-4 h-4 inline mr-1.5" />
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, end: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>

                {(isPartner || isLawyer) && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Filter className="w-4 h-4 inline mr-1.5" />
                      负责律师
                    </label>
                    <select
                      value={filters.lawyer_id || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          lawyer_id: e.target.value || undefined,
                        }))
                      }
                      className="input-field"
                    >
                      <option value="">全部律师</option>
                      {mockLawyers.map((lawyer) => (
                        <option key={lawyer.id} value={lawyer.id}>
                          {lawyer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Filter className="w-4 h-4 inline mr-1.5" />
                    案件类型
                  </label>
                  <select
                    value={filters.case_type || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        case_type: e.target.value || undefined,
                      }))
                    }
                    className="input-field"
                  >
                    <option value="">全部类型</option>
                    {caseTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4 mt-6 pt-4 border-t border-border">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">隐藏敏感信息</p>
                      <p className="text-sm text-muted-foreground">
                        导出时脱敏处理客户联系方式等敏感数据
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.hide_sensitive}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, hide_sensitive: e.target.checked }))
                    }
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>
              </div>
            </ContentCard>

            <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between cursor-pointer" onClick={() => setShowCycleInfo(!showCycleInfo)}>
                  <span className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    回款周期口径说明
                  </span>
                  {showCycleInfo ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              {showCycleInfo && (
                <CardContent>
                  <div className="bg-primary-50 rounded-xl p-5">
                    <pre className="whitespace-pre-wrap text-sm text-primary-900 font-sans leading-relaxed">
                      {paymentCycleDescription}
                    </pre>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24 gold-border animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <CardHeader>
                <CardTitle>导出预览</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">文件格式</span>
                    <Badge variant="outline" className="font-medium">
                      {formatOptions.find((o) => o.value === formData.format)?.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">报表类型</span>
                    <span className="font-medium text-foreground">
                      {getExportTypeLabel(formData.export_type)}
                    </span>
                  </div>
                  {dateRange.start && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">开始日期</span>
                      <span className="font-medium">{formatDate(dateRange.start)}</span>
                    </div>
                  )}
                  {dateRange.end && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">结束日期</span>
                      <span className="font-medium">{formatDate(dateRange.end)}</span>
                    </div>
                  )}
                  {filters.lawyer_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">负责律师</span>
                      <span className="font-medium">
                        {mockLawyers.find((l) => l.id === filters.lawyer_id)?.name}
                      </span>
                    </div>
                  )}
                  {filters.case_type && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">案件类型</span>
                      <span className="font-medium">{filters.case_type}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">敏感信息</span>
                    <span className={formData.hide_sensitive ? 'text-green-600' : 'text-orange-600'}>
                      {formData.hide_sensitive ? '已脱敏' : '不脱敏'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="bg-muted/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Eye className="w-4 h-4" />
                      预计包含内容
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 案件基本信息及费用汇总</li>
                      <li>• 发票明细及对账差异</li>
                      <li>• 回款计划及实际回款记录</li>
                      <li>• 审批流程及处理结果</li>
                    </ul>
                  </div>

                  <Button
                    className="w-full btn-gold h-11"
                    onClick={handleExport}
                    loading={exporting}
                    disabled={!canExportData}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exporting ? '正在生成...' : '开始导出'}
                  </Button>

                  {!canExportData && (
                    <p className="text-xs text-red-500 text-center mt-2">
                      您没有导出数据的权限
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <ContentCard className="animate-fade-in">
          {exportHistory.length === 0 ? (
            <Empty
              icon={<Download className="w-12 h-12 text-muted-foreground" />}
              title="暂无导出记录"
              description="切换到'新建导出'标签页开始导出数据"
            />
          ) : (
            <div className="space-y-4">
              {exportHistory.map((item, index) => (
                <Card
                  key={item.export_id}
                  className={`card-hover transition-all duration-300 animate-fade-in ${
                    item.status === 'failed' ? 'border-red-200' : ''
                  }`}
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          item.status === 'failed' ? 'bg-red-100' : 'bg-muted'
                        }`}>
                          {getFormatIcon(item.format)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {item.file_name || getExportTypeLabel(item.export_type)}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                            <span className="text-muted-foreground">
                              {getExportTypeLabel(item.export_type)}
                            </span>
                            <span className="text-muted-foreground">
                              {formatDateTime(item.created_at)}
                            </span>
                            {item.file_size && (
                              <span className="text-muted-foreground">
                                {formatFileSize(item.file_size)}
                              </span>
                            )}
                          </div>
                          {item.error_message && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                              <AlertCircle className="w-4 h-4" />
                              {item.error_message}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(item.status)}>
                          <span className="flex items-center gap-1.5">
                            {getStatusIcon(item.status)}
                            {getStatusLabel(item.status)}
                          </span>
                        </Badge>
                        {item.status === 'completed' && item.download_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(item.export_id)}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            下载
                          </Button>
                        )}
                        {item.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            className="gap-2"
                          >
                            <Loader2 className="w-4 h-4" />
                            重试
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ContentCard>
      )}
    </div>
  );
};

export default ExportCenter;
