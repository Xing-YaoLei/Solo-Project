import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User as UserIcon,
  Building2,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Paperclip,
  Download,
  Eye,
  EyeOff,
  Copy,
  Check,
  CreditCard,
  Timer,
} from 'lucide-react';
import {
  Card,
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
  ContentCard,
} from '@/components/layout/Layout';
import { usePermission } from '@/hooks/usePermission';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPercent,
  getCaseStatusLabel,
  getCaseStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getApprovalStatusLabel,
  getApprovalStatusColor,
  maskEmail,
} from '@/utils/format';
import { mockLawyers } from '@/utils/mockData';
import type {
  Case,
  InvoiceItem,
  PaymentSchedule,
  ApprovalNode,
  Invoice,
  PaymentStatus,
  ApprovalStatus,
  CaseStatus,
} from '@/types';

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded_at: string;
}

const mockCase: Case = {
  id: 'case-001',
  case_no: 'LAW-2024-0892',
  name: '北京某科技公司股权纠纷案',
  lawyer_id: 'lawyer-001',
  client_id: 'client-001',
  case_type: '公司法务',
  quoted_amount: 580000,
  actual_amount: 556800,
  status: 'active',
  created_at: '2024-03-15T10:30:00',
  updated_at: '2024-06-20T14:20:00',
  lawyer: mockLawyers[0],
  client: {
    id: 'client-001',
    name: '北京科技创新有限公司',
    email: 'contact@techcompany.com',
    role: 'client',
    is_active: true,
    created_at: '2024-01-10T00:00:00',
    updated_at: '2024-01-10T00:00:00',
  },
};

const mockInvoiceItems: InvoiceItem[] = [
  { id: '1', invoice_id: 'inv-001', item_name: '案件受理费', description: '一审案件立案费用', quantity: 1, unit_price: 50000, amount: 50000, fee_type: '诉讼费' },
  { id: '2', invoice_id: 'inv-001', item_name: '律师代理费', description: '一审阶段代理服务', quantity: 1, unit_price: 200000, amount: 200000, fee_type: '代理费' },
  { id: '3', invoice_id: 'inv-001', item_name: '证据保全费', description: '证据公证及保全', quantity: 1, unit_price: 30000, amount: 30000, fee_type: '其他费用' },
  { id: '4', invoice_id: 'inv-002', item_name: '律师代理费', description: '二审阶段代理服务', quantity: 1, unit_price: 180000, amount: 180000, fee_type: '代理费' },
  { id: '5', invoice_id: 'inv-002', item_name: '差旅费', description: '异地出差费用', quantity: 1, unit_price: 25000, amount: 25000, fee_type: '差旅费' },
  { id: '6', invoice_id: 'inv-003', item_name: '律师代理费', description: '执行阶段代理服务', quantity: 1, unit_price: 71800, amount: 71800, fee_type: '代理费' },
];

const mockPaymentSchedules: PaymentSchedule[] = [
  { id: 'ps-001', case_id: 'case-001', phase: 1, phase_name: '签订委托合同', amount: 150000, due_date: '2024-03-20', actual_payment_date: '2024-03-18', status: 'paid', payment_cycle_type: 'milestone', case: mockCase },
  { id: 'ps-002', case_id: 'case-001', phase: 2, phase_name: '一审开庭', amount: 200000, due_date: '2024-05-15', actual_payment_date: '2024-05-12', status: 'paid', payment_cycle_type: 'milestone', case: mockCase },
  { id: 'ps-003', case_id: 'case-001', phase: 3, phase_name: '二审开庭', amount: 150000, due_date: '2024-08-01', status: 'pending', payment_cycle_type: 'milestone', case: mockCase },
  { id: 'ps-004', case_id: 'case-001', phase: 4, phase_name: '执行完成', amount: 56800, due_date: '2024-12-31', status: 'pending', payment_cycle_type: 'milestone', case: mockCase },
];

const mockApprovals: ApprovalNode[] = [
  { id: 'ap-001', case_id: 'case-001', node_name: '案件受理审批', approver_id: 'partner-001', order_index: 1, submit_time: '2024-03-15T11:00:00', expected_complete_time: '2024-03-16T18:00:00', actual_complete_time: '2024-03-15T16:30:00', status: 'approved', reason: '同意受理', case: mockCase, approver: { id: 'partner-001', name: '张明', email: 'zhangming@lawfirm.com', role: 'partner', is_active: true, created_at: '2023-01-01T00:00:00', updated_at: '2023-01-01T00:00:00' } },
  { id: 'ap-002', case_id: 'case-001', node_name: '费用标准审批', approver_id: 'partner-001', order_index: 2, submit_time: '2024-03-16T09:00:00', expected_complete_time: '2024-03-17T18:00:00', actual_complete_time: '2024-03-16T14:20:00', status: 'approved', reason: '费用标准符合规定', case: mockCase, approver: { id: 'partner-001', name: '张明', email: 'zhangming@lawfirm.com', role: 'partner', is_active: true, created_at: '2023-01-01T00:00:00', updated_at: '2023-01-01T00:00:00' } },
  { id: 'ap-003', case_id: 'case-001', node_name: '合同条款审批', approver_id: 'partner-002', order_index: 3, submit_time: '2024-03-17T10:00:00', expected_complete_time: '2024-03-18T18:00:00', actual_complete_time: '2024-03-18T11:45:00', status: 'approved', case: mockCase, approver: { id: 'partner-002', name: '李华', email: 'lihua@lawfirm.com', role: 'partner', is_active: true, created_at: '2023-01-01T00:00:00', updated_at: '2023-01-01T00:00:00' } },
  { id: 'ap-004', case_id: 'case-001', node_name: '二审费用调整审批', approver_id: 'partner-001', order_index: 4, submit_time: '2024-06-10T14:00:00', expected_complete_time: '2024-06-11T18:00:00', status: 'pending', case: mockCase, approver: { id: 'partner-001', name: '张明', email: 'zhangming@lawfirm.com', role: 'partner', is_active: true, created_at: '2023-01-01T00:00:00', updated_at: '2023-01-01T00:00:00' } },
];

const mockInvoices: Invoice[] = [
  { id: 'inv-001', invoice_no: 'INV-202403-0082', case_id: 'case-001', amount: 280000, status: 'paid', invoice_date: '2024-03-20', source: 'manual', created_at: '2024-03-20T10:00:00', updated_at: '2024-03-20T10:00:00', items: mockInvoiceItems.filter(i => i.invoice_id === 'inv-001'), case: mockCase },
  { id: 'inv-002', invoice_no: 'INV-202405-0156', case_id: 'case-001', amount: 205000, status: 'paid', invoice_date: '2024-05-10', source: 'manual', created_at: '2024-05-10T10:00:00', updated_at: '2024-05-10T10:00:00', items: mockInvoiceItems.filter(i => i.invoice_id === 'inv-002'), case: mockCase },
  { id: 'inv-003', invoice_no: 'INV-202406-0203', case_id: 'case-001', amount: 71800, status: 'pending', invoice_date: '2024-06-15', source: 'manual', created_at: '2024-06-15T10:00:00', updated_at: '2024-06-15T10:00:00', items: mockInvoiceItems.filter(i => i.invoice_id === 'inv-003'), case: mockCase },
];

const mockAttachments: Attachment[] = [
  { id: 'att-001', name: '委托代理合同.pdf', type: 'pdf', size: '2.4 MB', uploaded_at: '2024-03-15T11:30:00' },
  { id: 'att-002', name: '起诉状.docx', type: 'docx', size: '856 KB', uploaded_at: '2024-03-16T09:20:00' },
  { id: 'att-003', name: '证据清单.xlsx', type: 'xlsx', size: '1.2 MB', uploaded_at: '2024-03-18T14:45:00' },
  { id: 'att-004', name: '一审判决书.pdf', type: 'pdf', size: '3.8 MB', uploaded_at: '2024-04-25T16:10:00' },
  { id: 'att-005', name: '上诉状.docx', type: 'docx', size: '724 KB', uploaded_at: '2024-05-05T10:30:00' },
];

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isClient } = usePermission();
  const [loading, setLoading] = useState(true);
  const [showSensitive, setShowSensitive] = useState(!isClient);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [id]);

  const feeGroups = mockInvoiceItems.reduce((acc, item) => {
    if (!acc[item.fee_type]) {
      acc[item.fee_type] = { items: [], total: 0 };
    }
    acc[item.fee_type].items.push(item);
    acc[item.fee_type].total += item.amount;
    return acc;
  }, {} as Record<string, { items: InvoiceItem[]; total: number }>);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderSensitiveContent = (content: string, maskedContent: string, field: string) => {
    if (isClient && !showSensitive) {
      return (
        <span className="mask-sensitive" title="敏感信息已脱敏">
          {maskedContent}
        </span>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <span>{content}</span>
        <button
          onClick={() => copyToClipboard(content, field)}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          {copiedField === field ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    );
  };

  const getTimelineIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'overdue':
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Timer className="w-5 h-5 text-gray-400" />;
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'xlsx':
        return <FileText className="w-5 h-5 text-green-500" />;
      default:
        return <Paperclip className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={mockCase.name}
        description={`案件编号: ${mockCase.case_no}`}
        action={
          <div className="flex items-center gap-3">
            {isClient && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSensitive(!showSensitive)}
              >
                {showSensitive ? (
                  <><EyeOff className="w-4 h-4 mr-2" /> 隐藏敏感信息</>
                ) : (
                  <><Eye className="w-4 h-4 mr-2" /> 显示敏感信息</>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          </div>
        }
      />

      <Card className="mb-6 card-hover animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">客户名称</p>
                <p className="font-semibold text-foreground">
                  {renderSensitiveContent(
                    mockCase.client?.name || '',
                    '******有限公司',
                    'clientName'
                  )}
                </p>
                {mockCase.client?.email && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {renderSensitiveContent(
                      mockCase.client.email,
                      maskEmail(mockCase.client.email),
                      'clientEmail'
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">负责律师</p>
                <p className="font-semibold text-foreground">{mockCase.lawyer?.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {renderSensitiveContent(
                    mockCase.lawyer?.email || '',
                    maskEmail(mockCase.lawyer?.email || ''),
                    'lawyerEmail'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">案件状态</p>
                <Badge className={getCaseStatusColor(mockCase.status as CaseStatus)}>
                  {getCaseStatusLabel(mockCase.status as CaseStatus)}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  创建: {formatDate(mockCase.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">费用情况</p>
                <p className="font-semibold text-foreground font-mono">
                  {formatCurrency(mockCase.actual_amount)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    报价: {formatCurrency(mockCase.quoted_amount)}
                  </span>
                  <span className={`text-xs font-medium ${
                    mockCase.actual_amount < mockCase.quoted_amount
                      ? 'text-green-600'
                      : mockCase.actual_amount > mockCase.quoted_amount
                      ? 'text-red-600'
                      : 'text-muted-foreground'
                  }`}>
                    {mockCase.actual_amount < mockCase.quoted_amount ? '↓' : mockCase.actual_amount > mockCase.quoted_amount ? '↑' : '='}
                    {formatPercent(Math.abs(mockCase.actual_amount - mockCase.quoted_amount) / mockCase.quoted_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <ContentCard
            title="费用明细"
            description="按费用类型分组展示"
            className="animate-fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="space-y-6">
              {Object.entries(feeGroups).map(([feeType, group], groupIndex) => (
                <div key={feeType} className="border-b border-border last:border-0 pb-6 last:pb-0">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      {feeType}
                    </h4>
                    <span className="font-mono font-bold text-primary">
                      {formatCurrency(group.total)}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>项目名称</TableHead>
                          <TableHead>描述</TableHead>
                          <TableHead className="text-right">单价</TableHead>
                          <TableHead className="text-right">数量</TableHead>
                          <TableHead className="text-right">金额</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((item, itemIndex) => (
                          <TableRow key={itemIndex} style={{ animationDelay: `${groupIndex * 0.1 + itemIndex * 0.05}s` }}>
                            <TableCell className="font-medium">{item.item_name}</TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px]">
                              {item.description || '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(item.unit_price)}
                            </TableCell>
                            <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          </ContentCard>

          <ContentCard
            title="回款周期追踪"
            description="按里程碑节点追踪回款进度"
            className="animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="relative">
              <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-border" />
              <div className="space-y-6">
                {mockPaymentSchedules.map((schedule, index) => (
                  <div key={index} className="relative flex items-start gap-4 pl-12">
                    <div className="absolute left-0 top-0 w-11 h-11 rounded-full bg-white border-4 border-background flex items-center justify-center z-10">
                      {getTimelineIcon(schedule.status)}
                    </div>
                    <div className="flex-1 bg-muted/30 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            第{schedule.phase}阶段 - {schedule.phase_name}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            应付款日期: {formatDate(schedule.due_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-foreground">
                            {formatCurrency(schedule.amount)}
                          </p>
                          <Badge className={getPaymentStatusColor(schedule.status as PaymentStatus)}>
                            {getPaymentStatusLabel(schedule.status as PaymentStatus)}
                          </Badge>
                        </div>
                      </div>
                      {schedule.actual_payment_date && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          实际付款日期: {formatDate(schedule.actual_payment_date)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ContentCard>
        </div>

        <div className="space-y-6">
          <ContentCard
            title="关联单据"
            description="相关发票记录"
            className="animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="space-y-3">
              {mockInvoices.map((invoice, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-primary">{invoice.invoice_no}</span>
                    <Badge className={getCaseStatusColor(invoice.status as unknown as CaseStatus)}>
                      {getCaseStatusLabel(invoice.status as unknown as CaseStatus)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(invoice.invoice_date)}
                    </span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(invoice.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ContentCard>

          <ContentCard
            title="审批流程"
            description="案件审批历史记录"
            className="animate-fade-in"
            style={{ animationDelay: '0.5s' }}
          >
            <div className="relative">
              <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-border" />
              <div className="space-y-4">
                {mockApprovals.map((approval, index) => (
                  <div key={index} className="relative flex items-start gap-3 pl-10">
                    <div className="absolute left-0 top-0.5 w-9 h-9 rounded-full bg-white border-4 border-background flex items-center justify-center z-10">
                      {getTimelineIcon(approval.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h5 className="font-medium text-foreground text-sm">
                          {approval.node_name}
                        </h5>
                        <Badge
                          className={getApprovalStatusColor(approval.status as ApprovalStatus)}
                          variant="outline"
                        >
                          {getApprovalStatusLabel(approval.status as ApprovalStatus)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        审批人: {approval.approver?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        提交: {formatDateTime(approval.submit_time)}
                      </p>
                      {approval.actual_complete_time && (
                        <p className="text-xs text-green-600">
                          完成: {formatDateTime(approval.actual_complete_time)}
                        </p>
                      )}
                      {approval.reason && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{approval.reason}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ContentCard>

          <ContentCard
            title="附件列表"
            description="案件相关文档"
            className="animate-fade-in"
            style={{ animationDelay: '0.6s' }}
          >
            <div className="space-y-2">
              {mockAttachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  {getFileIcon(attachment.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attachment.size} · {formatDate(attachment.uploaded_at)}
                    </p>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </ContentCard>
        </div>
      </div>
    </div>
  );
};

export default CaseDetail;
