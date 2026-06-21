import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Link2,
  AlertCircle,
  Clock,
  Shield,
  Lock,
  Eye,
  Download,
  Scale,
  LogIn,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { shareApi } from '@/api/endpoints/share';
import {
  formatCurrency,
  formatPercent,
  formatDate,
  formatDateTime,
  getInvoiceStatusLabel,
  getInvoiceStatusColor,
} from '@/utils/format';
import {
  generateReconciliationTrendData,
  generateInvoiceDetailData,
} from '@/utils/mockData';
import type { ShareAccessResponse, ShareAccessRequest, InvoiceStatus } from '@/types';

type AccessStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'unauthorized';

const ShareAccess: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<AccessStatus>('loading');
  const [shareData, setShareData] = useState<ShareAccessResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (token) {
      validateShareLink(token);
    }
  }, [token]);

  const validateShareLink = async (tokenValue: string) => {
    setStatus('loading');
    try {
      const request: ShareAccessRequest = { token: tokenValue };
      let response: ShareAccessResponse;

      try {
        response = await shareApi.accessShareLink(request);
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockResponses: Record<string, AccessStatus> = {
          'a1b2c3d4e5f6': 'valid',
          'g7h8i9j0k1l2': 'valid',
          'expired12345': 'expired',
          'invalid67890': 'invalid',
        };

        const mockStatus = mockResponses[tokenValue] || 'valid';

        if (mockStatus === 'expired') {
          setStatus('expired');
          setErrorMessage('该分享链接已过期');
          return;
        }

        if (mockStatus === 'invalid') {
          setStatus('invalid');
          setErrorMessage('无效的分享链接');
          return;
        }

        response = {
          valid: true,
          resource_type: 'dashboard',
          resource_id: 'dashboard-001',
          allow_export: false,
          hide_sensitive: true,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          data: {
            summary: {
              totalQuoted: 12580000,
              totalActual: 11986000,
              totalDifference: -594000,
              differenceRate: -0.0472,
            },
            trendData: generateReconciliationTrendData(6),
            invoiceData: generateInvoiceDetailData(10),
          },
        };
      }

      if (!response.valid) {
        setStatus('invalid');
        setErrorMessage('无效的分享链接');
        return;
      }

      const now = new Date();
      if (response.expires_at && new Date(response.expires_at) < now) {
        setStatus('expired');
        setErrorMessage('该分享链接已过期');
        return;
      }

      setShareData(response);
      setStatus('valid');
    } catch (error) {
      setStatus('invalid');
      setErrorMessage(error instanceof Error ? error.message : '验证失败，请稍后重试');
    }
  };

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return <Loading fullScreen />;

      case 'invalid':
        return (
          <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-6">
            <Card className="w-full max-w-md text-center animate-scale-in">
              <CardContent className="p-8">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-primary-900 mb-3">
                  无效的分享链接
                </h2>
                <p className="text-muted-foreground mb-6">
                  {errorMessage || '该分享链接不存在或已被撤销。'}
                </p>
                <div className="space-y-3">
                  <Button
                    className="w-full btn-primary"
                    onClick={() => navigate('/login')}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    返回登录
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'expired':
        return (
          <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-6">
            <Card className="w-full max-w-md text-center animate-scale-in">
              <CardContent className="p-8">
                <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-yellow-500" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-primary-900 mb-3">
                  分享链接已过期
                </h2>
                <p className="text-muted-foreground mb-6">
                  {errorMessage || '该分享链接已超过有效期，请联系分享者重新生成链接。'}
                </p>
                <div className="space-y-3">
                  <Button
                    className="w-full btn-primary"
                    onClick={() => navigate('/login')}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    返回登录
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'unauthorized':
        return (
          <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-6">
            <Card className="w-full max-w-md text-center animate-scale-in">
              <CardContent className="p-8">
                <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-10 h-10 text-orange-500" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-primary-900 mb-3">
                  无访问权限
                </h2>
                <p className="text-muted-foreground mb-6">
                  您没有权限访问此分享链接的内容。如需访问，请联系分享者调整权限设置。
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3 text-left">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium mb-1">权限说明</p>
                      <p>此分享链接仅对特定角色开放。如需访问，请确认您的账号权限。</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button
                    className="w-full btn-primary"
                    onClick={() => navigate('/login')}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    切换账号登录
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (status !== 'valid' || !shareData) {
    return getStatusContent();
  }

  const shareDataTyped = shareData.data as Record<string, unknown> | undefined;

  const summary = shareDataTyped?.summary as {
    totalQuoted: number;
    totalActual: number;
    totalDifference: number;
    differenceRate: number;
  } | undefined;

  const trendData = (shareDataTyped?.trendData as Array<{
    date: string;
    quoted_amount: number;
    actual_amount: number;
    difference: number;
    difference_rate: number;
  }>) || [];

  const invoiceData = (shareDataTyped?.invoiceData as Array<{
    invoice_no: string;
    case_name: string;
    invoice_date: string;
    amount: number;
    status: string;
    source: string;
  }>) || [];

  const trendChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' },
    },
    legend: {
      data: ['报价金额', '实际金额'],
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
      data: trendData.map((item) => item.date),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
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
        data: trendData.map((item) => item.quoted_amount),
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
        data: trendData.map((item) => item.actual_amount),
      },
    ],
  };

  const getResourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      dashboard: '报表看板',
      case: '案件详情',
      report: '特定报表',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-600 flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold text-primary">律智</h1>
              <p className="text-xs text-muted-foreground">数据分享</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-green-500" />
              <span>安全加密传输</span>
            </div>
            {shareData.allow_export && (
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                导出数据
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/login')}
            >
              <LogIn className="w-4 h-4 mr-2" />
              登录系统
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
        <Card className="mb-6 border-gold/30 shadow-gold animate-fade-in">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Link2 className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {getResourceTypeLabel(shareData.resource_type || '')}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      授权访问
                    </span>
                    {shareData.expires_at && (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        有效期至 {formatDateTime(shareData.expires_at)}
                      </span>
                    )}
                    {shareData.hide_sensitive && (
                      <Badge variant="outline" className="text-xs">
                        <Lock className="w-3 h-3 mr-1" />
                        敏感信息已脱敏
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="sm:ml-auto flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  链接有效
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {shareData.hide_sensitive && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">数据安全提示</p>
              <p>
                根据分享设置，部分敏感信息已做脱敏处理。如需查看完整数据，
                请联系数据分享方调整权限设置。
              </p>
            </div>
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总报价金额</p>
                    <p className="text-2xl font-bold mt-1 font-mono">
                      {formatCurrency(summary.totalQuoted)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总实际金额</p>
                    <p className="text-2xl font-bold mt-1 font-mono">
                      {formatCurrency(summary.totalActual)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-gold" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总差异金额</p>
                    <p className={`text-2xl font-bold mt-1 font-mono ${
                      summary.totalDifference >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(summary.totalDifference)}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    summary.totalDifference >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <TrendingUp className={`w-6 h-6 ${
                      summary.totalDifference >= 0 ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">差异率</p>
                    <p className={`text-2xl font-bold mt-1 font-mono ${
                      summary.differenceRate >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercent(summary.differenceRate)}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    summary.differenceRate >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Users className={`w-6 h-6 ${
                      summary.differenceRate >= 0 ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {trendData.length > 0 && (
          <Card className="mb-6 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <CardHeader>
              <CardTitle>对账差异趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <ReactECharts option={trendChartOption} style={{ height: '320px' }} />
            </CardContent>
          </Card>
        )}

        {invoiceData.length > 0 && (
          <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>单据明细</span>
                <Badge variant="outline">共 {invoiceData.length} 条记录</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>单据编号</TableHead>
                      <TableHead>案件名称</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead className="text-right">金额</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">
                          {shareData.hide_sensitive ? (
                            <span className="mask-sensitive">{item.invoice_no}</span>
                          ) : (
                            item.invoice_no
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {shareData.hide_sensitive ? (
                            <span className="mask-sensitive">{item.case_name}</span>
                          ) : (
                            item.case_name
                          )}
                        </TableCell>
                        <TableCell>{formatDate(item.invoice_date)}</TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getInvoiceStatusColor(item.status as InvoiceStatus)}>
                            {getInvoiceStatusLabel(item.status as InvoiceStatus)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <footer className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            本数据由律智 Legal Intelligence Platform 提供 ·
            数据更新时间 {formatDateTime(new Date().toISOString())}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            © 2024 律智 Legal Intelligence Platform. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default ShareAccess;
