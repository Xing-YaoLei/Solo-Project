import { addMonths, subMonths, format, parseISO } from 'date-fns';
import type {
  ReconciliationTrendItem,
  ContractAttachmentItem,
  InvoiceDetailItem,
  ApprovalNodeExceptionItem,
  User,
  UserRole,
  InvoiceStatus,
  InvoiceSource,
  ApprovalStatus,
} from '@/types';

const generateRandomId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const generateRandomAmount = (min: number, max: number): number => {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
};

const generateRandomDate = (startDate: Date, endDate: Date): string => {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  return format(new Date(randomTime), 'yyyy-MM-dd');
};

const generateRandomDateTime = (startDate: Date, endDate: Date): string => {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  return format(new Date(randomTime), "yyyy-MM-dd'T'HH:mm:ss");
};

export const generateReconciliationTrendData = (
  months: number = 12
): ReconciliationTrendItem[] => {
  const data: ReconciliationTrendItem[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const dateStr = format(date, 'yyyy-MM');
    const quotedAmount = generateRandomAmount(800000, 1500000);
    const actualAmount = quotedAmount * (0.85 + Math.random() * 0.1);
    const difference = actualAmount - quotedAmount;
    const differenceRate = difference / quotedAmount;

    data.push({
      date: dateStr,
      quoted_amount: quotedAmount,
      actual_amount: actualAmount,
      difference: difference,
      difference_rate: differenceRate,
    });
  }

  return data;
};

export const generateContractAttachmentData = (): ContractAttachmentItem[] => {
  const types = ['委托合同', '证据材料', '判决书', '调解书', '其他文书'];
  const data: ContractAttachmentItem[] = [];
  let totalAmount = 0;

  types.forEach((type) => {
    const count = Math.floor(Math.random() * 50) + 10;
    const amount = generateRandomAmount(100000, 800000);
    totalAmount += amount;

    data.push({
      type,
      count,
      amount,
      percentage: 0,
    });
  });

  return data.map((item) => ({
    ...item,
    percentage: item.amount / totalAmount,
  }));
};

export const generateInvoiceDetailData = (
  count: number = 20
): InvoiceDetailItem[] => {
  const statuses: InvoiceStatus[] = ['pending', 'paid', 'overdue', 'cancelled'];
  const sources: InvoiceSource[] = ['manual', 'email', 'import', 'api'];
  const caseNames = [
    '张三诉李四合同纠纷案',
    '王五与赵六离婚纠纷案',
    '北京某科技公司股权纠纷案',
    '上海某房地产公司买卖合同纠纷案',
    '广州某餐饮公司加盟合同纠纷案',
    '深圳某电子公司知识产权案',
    '杭州某互联网公司劳动争议案',
    '成都某建筑工程施工合同案',
    '武汉某医疗损害赔偿案',
    '西安某金融借款合同案',
  ];

  const data: InvoiceDetailItem[] = [];
  const now = new Date();
  const startDate = subMonths(now, 6);
  const endDate = now;

  for (let i = 0; i < count; i++) {
    const invoiceNo = `INV-${format(new Date(), 'yyyyMM')}-${String(i + 1).padStart(4, '0')}`;
    const caseName = caseNames[Math.floor(Math.random() * caseNames.length)];
    const invoiceDate = generateRandomDate(startDate, endDate);
    const amount = generateRandomAmount(5000, 200000);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];

    data.push({
      invoice_no: invoiceNo,
      case_name: caseName,
      invoice_date: invoiceDate,
      amount,
      status,
      source,
    });
  }

  return data.sort((a, b) => parseISO(b.invoice_date).getTime() - parseISO(a.invoice_date).getTime());
};

export const generateApprovalNodeExceptionData = (
  count: number = 10
): ApprovalNodeExceptionItem[] => {
  const statuses: ApprovalStatus[] = ['pending', 'rejected', 'escalated'];
  const nodeNames = [
    '案件受理审批',
    '费用标准审批',
    '合同条款审批',
    '结案审批',
    '退款审批',
    '特殊事项审批',
    '延期审批',
    '律师变更审批',
  ];
  const caseNames = [
    '张三诉李四合同纠纷案',
    '王五与赵六离婚纠纷案',
    '北京某科技公司股权纠纷案',
    '上海某房地产公司买卖合同纠纷案',
    '广州某餐饮公司加盟合同纠纷案',
    '深圳某电子公司知识产权案',
  ];
  const approverNames = ['张明', '李华', '王芳', '刘强', '陈静'];

  const data: ApprovalNodeExceptionItem[] = [];
  const now = new Date();
  const startDate = subMonths(now, 3);
  const endDate = subMonths(now, 1);

  for (let i = 0; i < count; i++) {
    const submitTime = generateRandomDateTime(startDate, endDate);
    const expectedCompleteTime = format(
      addMonths(parseISO(submitTime), 1),
      "yyyy-MM-dd'T'HH:mm:ss"
    );
    const delayDays = Math.floor(Math.random() * 30) + 1;
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    data.push({
      node_name: nodeNames[Math.floor(Math.random() * nodeNames.length)],
      case_name: caseNames[Math.floor(Math.random() * caseNames.length)],
      approver_name: approverNames[Math.floor(Math.random() * approverNames.length)],
      submit_time: submitTime,
      expected_complete_time: expectedCompleteTime,
      delay_days: delayDays,
      status,
    });
  }

  return data.sort((a, b) => b.delay_days - a.delay_days);
};

export const generateMockUsers = (count: number = 10): User[] => {
  const roles: UserRole[] = ['partner', 'lawyer', 'assistant', 'client'];
  const names = [
    '张伟',
    '李娜',
    '王强',
    '刘洋',
    '陈静',
    '杨帆',
    '赵敏',
    '周杰',
    '吴磊',
    '郑雯',
    '孙浩',
    '马丽',
    '朱军',
    '胡婷',
    '郭涛',
  ];

  const users: User[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    const name = names[i % names.length];
    const createdAt = generateRandomDateTime(subMonths(now, 12), now);

    users.push({
      id: generateRandomId(),
      name,
      email: `${name.toLowerCase().replace(/\s/g, '')}@example.com`,
      role,
      is_active: Math.random() > 0.1,
      created_at: createdAt,
      updated_at: createdAt,
    });
  }

  return users;
};

export const mockCurrentUser: User = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: '张三',
  email: 'zhangsan@example.com',
  role: 'partner',
  is_active: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
};

export const mockLawyers: User[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: '李明',
    email: 'liming@example.com',
    role: 'lawyer',
    is_active: true,
    created_at: '2024-01-15T00:00:00',
    updated_at: '2024-01-15T00:00:00',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: '王芳',
    email: 'wangfang@example.com',
    role: 'lawyer',
    is_active: true,
    created_at: '2024-02-01T00:00:00',
    updated_at: '2024-02-01T00:00:00',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: '张伟',
    email: 'zhangwei@example.com',
    role: 'lawyer',
    is_active: true,
    created_at: '2024-02-15T00:00:00',
    updated_at: '2024-02-15T00:00:00',
  },
];

export const caseTypes: string[] = [
  '合同纠纷',
  '婚姻家庭',
  '知识产权',
  '劳动争议',
  '房产纠纷',
  '交通事故',
  '刑事辩护',
  '行政诉讼',
  '公司法务',
  '其他',
];

export const paymentCycleTypes = [
  { value: 'monthly', label: '月付' },
  { value: 'quarterly', label: '季付' },
  { value: 'half_yearly', label: '半年付' },
  { value: 'yearly', label: '年付' },
  { value: 'milestone', label: '里程碑' },
];

export default {
  generateReconciliationTrendData,
  generateContractAttachmentData,
  generateInvoiceDetailData,
  generateApprovalNodeExceptionData,
  generateMockUsers,
  mockCurrentUser,
  mockLawyers,
  caseTypes,
  paymentCycleTypes,
};
