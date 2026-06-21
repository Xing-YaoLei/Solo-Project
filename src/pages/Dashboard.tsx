import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  FileText,
  ChevronRight,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Loading } from '@/components/ui/Loading';
import {
  PageHeader,
  StatsGrid,
  StatCard,
  ContentCard,
} from '@/components/layout/Layout';
import useChartData from '@/hooks/useChartData';
import { usePermission } from '@/hooks/usePermission';
import {
  formatCurrency,
  formatPercent,
  formatDate,
  formatDateTime,
  getInvoiceStatusLabel,
  getInvoiceStatusColor,
  getApprovalStatusLabel,
  getApprovalStatusColor,
  getInvoiceSourceLabel,
} from '@/utils/format';
import type { FilterParams, InvoiceDetailItem, ApprovalNodeExceptionItem } from '@/types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    reconciliationTrend,
    contractAttachment,
    invoiceDetails,
    approvalNodeExceptions,
    isAllLoading,
    refetchAll,
    fetchReconciliationTrend,
    fetchContractAttachment,
    fetchInvoiceDetails,
    fetchApprovalNodeExceptions,
  } = useChartData();

  const { canViewAllCases, canViewAnalytics, canExportData, canShareReports } = usePermission();

  const [filters, setFilters] = useState<FilterParams>({});
  const [dateRange, setDateRange] = useState<string>('12m');

  const summaryStats = useMemo(() => {
    const data = reconciliationTrend.data;
    if (!data.length) {
      return {
        totalQuoted: 0,
        totalActual: 0,
        totalDifference: 0,
        differenceRate: 0,
        change: 0,
      };
    }

    const totalQuoted = data.reduce((sum, item) => sum + item.quoted_amount, 0);
    const totalActual = data.reduce((sum, item) => sum + item.actual_amount, 0);
    const totalDifference = totalActual - totalQuoted;
    const differenceRate = totalQuoted > 0 ? totalDifference / totalQuoted : 0;

    const lastPeriod = data.slice(0, Math.floor(data.length / 2));
    const currentPeriod = data.slice(Math.floor(data.length / 2));
    const lastRate =
      lastPeriod.reduce((sum, item) => sum + item.quoted_amount, 0) > 0
        ? lastPeriod.reduce((sum, item) => sum + item.actual_amount - item.quoted_amount, 0) /
          lastPeriod.reduce((sum, item) => sum + item.quoted_amount, 0)
        : 0;
    const currentRate =
      currentPeriod.reduce((sum, item) => sum + item.quoted_amount, 0) > 0
        ? currentPeriod.reduce((sum, item) => sum + item.actual_amount - item.quoted_amount, 0) /
          currentPeriod.reduce((sum, item) => sum + item.quoted_amount, 0)
        : 0;
    const change = lastRate !== 0 ? ((currentRate - lastRate) / Math.abs(lastRate)) * 100 : 0;

    return {
      totalQuoted,
      totalActual,
      totalDifference,
      differenceRate,
      change,
    };
  }, [reconciliationTrend.data]);

  const trendChartOption = useMemo(() => {
    const data = reconciliationTrend.data;
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b' },
        formatter: (params: Array<{ seriesName: string; value: number; axisValue: string }>) => {
          let html = `<div class="font-medium mb-2">${params[0].axisValue}</div>`;
          params.forEach((param) => {
            const value =
              param.seriesName === '差异率'
                ? formatPercent(param.value / 100)
                : formatCurrency(param.value);
            html += `<div class="flex items-center gap-2 text-sm">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${
                param.seriesName === '报价金额'
                  ? '#1e3a5f'
                  : param.seriesName === '实际金额'
                  ? '#d4af37'
                  : '#ef4444'
              }"></span>
              <span class="text-muted-foreground">${param.seriesName}:</span>
              <span class="font-medium">${value}</span>
            </div>`;
          });
          return html;
        },
      },
      legend: {
        data: ['报价金额', '实际金额', '差异率'],
        top: 0,
        right: 0,
        textStyle: { fontSize: 12, color: '#64748b' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map((item) => item.date),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: [
        {
          type: 'value',
          name: '金额(元)',
          position: 'left',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
          axisLabel: {
            color: '#64748b',
            fontSize: 11,
            formatter: (value: number) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
              return value.toString();
            },
          },
        },
        {
          type: 'value',
          name: '差异率(%)',
          position: 'right',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: {
            color: '#64748b',
            fontSize: 11,
            formatter: (value: number) => `${value.toFixed(1)}%`,
          },
        },
      ],
      series: [
        {
          name: '报价金额',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#1e3a5f', width: 2 },
          itemStyle: { color: '#1e3a5f' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(30, 58, 95, 0.15)' },
                { offset: 1, color: 'rgba(30, 58, 95, 0)' },
              ],
            },
          },
          data: data.map((item) => item.quoted_amount),
        },
        {
          name: '实际金额',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#d4af37', width: 2 },
          itemStyle: { color: '#d4af37' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(212, 175, 55, 0.15)' },
                { offset: 1, color: 'rgba(212, 175, 55, 0)' },
              ],
            },
          },
          data: data.map((item) => item.actual_amount),
        },
        {
          name: '差异率',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#ef4444', width: 2, type: 'dashed' },
          itemStyle: { color: '#ef4444' },
          data: data.map((item) => item.difference_rate * 100),
        },
      ],
    };
  }, [reconciliationTrend.data]);

  const pieChartOption = useMemo(() => {
    const data = contractAttachment.data;
    const colors = ['#1e3a5f', '#d4af37', '#3b82f6', '#10b981', '#8b5cf6'];
    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b' },
        formatter: (params: { name: string; value: number; percent: number }) => {
          return `<div class="font-medium">${params.name}</div>
            <div class="text-sm text-muted-foreground mt-1">
              金额: ${formatCurrency(params.value)}<br/>
              占比: ${params.percent}%
            </div>`;
        },
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { fontSize: 12, color: '#64748b' },
        formatter: (name: string) => {
          const item = data.find((d) => d.type === name);
          return `${name}  ${item?.count || 0}份`;
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              formatter: (params: { name: string; percent: number }) =>
                `{name|${params.name}}\n{value|${params.percent}%}`,
              rich: {
                name: { fontSize: 12, color: '#64748b', padding: [0, 0, 4, 0] },
                value: { fontSize: 20, fontWeight: 'bold', color: '#1e3a5f' },
              },
            },
          },
          labelLine: { show: false },
          data: data.map((item, index) => ({
            value: item.amount,
            name: item.type,
            itemStyle: { color: colors[index % colors.length] },
          })),
        },
      ],
    };
  }, [contractAttachment.data]);

  useEffect(() => {
    const params: FilterParams = { ...filters };
    fetchReconciliationTrend(params);
    fetchContractAttachment(params);
    fetchInvoiceDetails(params);
    fetchApprovalNodeExceptions(params);
  }, [filters, fetchReconciliationTrend, fetchContractAttachment, fetchInvoiceDetails, fetchApprovalNodeExceptions]);

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const now = new Date();
    let startDate: string;
    switch (range) {
      case '3m':
        startDate = new Date(now.setMonth(now.getMonth() - 3)).toISOString().split('T')[0];
        break;
      case '6m':
        startDate = new Date(now.setMonth(now.getMonth() - 6)).toISOString().split('T')[0];
        break;
      case '12m':
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 12)).toISOString().split('T')[0];
        break;
    }
    setFilters({ ...filters, date_range: { start_date: startDate } });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'escalated':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (isAllLoading && !reconciliationTrend.data.length) {
    return <Loading fullScreen />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="报表看板"
        description="案件费用对账数据总览与分析"
        action={
          <div className="flex items-center gap-3">
            {canExportData && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/export-center')}
              >
                <FileText className="w-4 h-4 mr-2" />
                导出报表
              </Button>
            )}
            {canShareReports && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/share-manage')}
              >
                <Filter className="w-4 h-4 mr-2" />
                分享管理
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refetchAll}
              loading={isAllLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isAllLoading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {['3m', '6m', '12m'].map((range) => (
          <Button
            key={range}
            variant={dateRange === range ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleDateRangeChange(range)}
            className={dateRange === range ? 'bg-primary text-white' : ''}
          >
            {range === '3m' ? '近3个月' : range === '6m' ? '近6个月' : '近12个月'}
          </Button>
        ))}
      </div>

      <StatsGrid>
        <StatCard
          title="总报价金额"
          value={formatCurrency(summaryStats.totalQuoted)}
          icon={<DollarSign className="w-6 h-6 text-primary" />}
          change={5.2}
        />
        <StatCard
          title="总实际金额"
          value={formatCurrency(summaryStats.totalActual)}
          icon={<TrendingUp className="w-6 h-6 text-gold" />}
          change={3.8}
        />
        <StatCard
          title="总差异金额"
          value={formatCurrency(summaryStats.totalDifference)}
          icon={
            summaryStats.totalDifference >= 0 ? (
              <TrendingUp className="w-6 h-6 text-green-500" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-500" />
            )
          }
          change={summaryStats.change}
          className={summaryStats.totalDifference >= 0 ? 'border-green-200' : 'border-red-200'}
        />
        <StatCard
          title="差异率"
          value={formatPercent(summaryStats.differenceRate)}
          icon={<AlertTriangle className="w-6 h-6 text-orange-500" />}
          change={-2.1}
        />
      </StatsGrid>

      {canViewAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 card-hover animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>对账差异趋势</span>
                <Badge variant="outline">近{reconciliationTrend.data.length}个月</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reconciliationTrend.loading ? (
                <div className="h-80 flex items-center justify-center">
                  <Loading />
                </div>
              ) : (
                <ReactECharts option={trendChartOption} style={{ height: '320px' }} />
              )}
            </CardContent>
          </Card>

          <Card className="card-hover animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle>合同附件构成</CardTitle>
            </CardHeader>
            <CardContent>
              {contractAttachment.loading ? (
                <div className="h-80 flex items-center justify-center">
                  <Loading />
                </div>
              ) : (
                <ReactECharts option={pieChartOption} style={{ height: '320px' }} />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentCard
          title="单据明细"
          description="最近的发票单据记录"
          className="animate-fade-in"
          style={{ animationDelay: '0.3s' }}
          footer={
            <div className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
              >
                查看全部 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          }
        >
          {invoiceDetails.loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loading />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>单据编号</TableHead>
                    <TableHead>案件名称</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>来源</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceDetails.data.slice(0, 5).map((item: InvoiceDetailItem, index: number) => (
                    <TableRow key={index} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{item.invoice_no}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{item.case_name}</TableCell>
                      <TableCell>{formatDate(item.invoice_date)}</TableCell>
                      <TableCell className="font-mono font-medium">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getInvoiceSourceLabel(item.source)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getInvoiceStatusColor(item.status)}>
                          {getInvoiceStatusLabel(item.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ContentCard>

        {canViewAllCases && (
          <ContentCard
            title="审批节点异常"
            description="需要关注的审批节点"
            className="animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            {approvalNodeExceptions.loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loading />
              </div>
            ) : (
              <div className="space-y-4">
                {approvalNodeExceptions.data.slice(0, 5).map((item: ApprovalNodeExceptionItem, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="mt-1">{getStatusIcon(item.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-medium text-foreground truncate">{item.node_name}</h4>
                        <Badge className={getApprovalStatusColor(item.status)}>
                          {getApprovalStatusLabel(item.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 truncate">
                        {item.case_name}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>审批人: {item.approver_name}</span>
                        <span className="text-red-500 font-medium">
                          已延迟 {item.delay_days} 天
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        提交时间: {formatDateTime(item.submit_time)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ContentCard>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
