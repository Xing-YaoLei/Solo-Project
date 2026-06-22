import { generateBatchNo } from '@/lib/utils';
import type {
  AuditStatus,
  RiskLevel,
  SourceType,
  UserRole,
} from '@/lib/utils';

export interface AuditItemLite {
  id: string;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  status: AuditStatus;
  dispatchRule: string;
  assigneeId: string | null;
  reviewerId: string | null;
  batchId: string;
  batchNo: string;
  sourceType: SourceType;
  deadlineAt: string;
  createdAt: string;
  closedAt: string | null;
  closeReason: string | null;
  revisionCount: number;
  firstTimePass: boolean | null;
}

export interface TimelineEvent {
  id: string;
  auditId: string;
  type: 'CREATE' | 'ASSIGN' | 'RECTIFY' | 'REVIEW_PASS' | 'REVIEW_FAIL' | 'CLOSE';
  actorId: string | null;
  actorName: string;
  comment: string | null;
  attachments: string[];
  createdAt: string;
}

export interface ImportBatchLite {
  id: string;
  batchNo: string;
  sourceType: SourceType;
  fileName: string | null;
  createdById: string;
  createdByName: string;
  recordCount: number;
  auditItemCount: number;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  errorLog: string | null;
  createdAt: string;
}

export interface PermissionLogRow {
  userId: string | null;
  action: string;
  resource: string;
  ipAddress: string | null;
  happenedAt: string;
}

export interface ErpRow {
  documentNo: string;
  amount: number | null;
  department: string | null;
  happenedAt: string;
}

export interface EmailRow {
  subject: string;
  sender: string;
  recipients: string[];
  sentAt: string;
}

export interface BatchDetail {
  batch: ImportBatchLite;
  auditItems: AuditItemLite[];
  permLogs: PermissionLogRow[];
  erpRecords: ErpRow[];
  emails: EmailRow[];
}

interface KpiOverview {
  total: number;
  inProgress: number;
  overdue: number;
  firstPassRate: number;
  closedRate: number;
  riskCounts: { HIGH: number; MEDIUM: number; LOW: number };
  latestEvents: TimelineEvent[];
  trend: { label: string; closed: number; created: number }[];
}

interface MyStats {
  totalAssigned: number;
  pending: number;
  inProgress: number;
  completed: number;
  firstPassRate: number;
  avgDays: number;
}

interface DispatchRuleDatum {
  name: string;
  value: number;
}

interface FunnelDatum {
  stage: string;
  value: number;
  avgHours: number;
}

interface ReviewCommentDatum {
  reason: number;
  count: number;
}

interface CloseReasonDatum {
  week: string;
  completed: number;
  waived: number;
  escalated: number;
}

const DISPATCH_RULES = [
  '按部门归属',
  '按风险等级委派',
  '按流程分类',
  '按地域划分',
  '按资产类别',
];

const REVIEW_REASONS = [
  '整改材料不完整',
  '控制措施描述不充分',
  '风险缓解证据缺失',
  '责任人未落实',
  '时限内未完成',
  '跨部门协同未闭环',
  '未提交系统截图',
  '整改方案缺少验证',
];

const CLOSE_REASONS = ['已完成整改', '风险豁免', '升级处理', '事项合并'];

const DEPARTMENTS = ['财务部', '技术部', '运营部', '市场部', '人力资源部', '采购部'];

const HIGH_AUDIT_TITLES = [
  '超权限访问敏感财务数据',
  'ERP 付款审批流程越级操作',
  '供应商准入未通过合规评审',
  '客户资料批量导出无审批',
  '关键系统管理员共享账号',
];

const MEDIUM_AUDIT_TITLES = [
  '岗位权限分离执行不彻底',
  '月度对账未在规定时限完成',
  '邮件审批链路缺少归档',
  '资产盘点差异未及时说明',
  '新员工账号开通滞后',
  '离职员工权限未在24h回收',
];

const LOW_AUDIT_TITLES = [
  '操作日志保留天数不足',
  '系统密码策略提示不明确',
  '文档版本控制命名不规范',
  '例会签到记录不完整',
  '合规培训完成率偏低',
];

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedStatus(): AuditStatus {
  const r = Math.random();
  if (r < 0.4) return 'CLOSED';
  if (r < 0.6) return 'IN_PROGRESS';
  if (r < 0.75) return 'PENDING_REVIEW';
  if (r < 0.88) return 'ASSIGNED';
  if (r < 0.96) return 'REJECTED';
  return 'CREATED';
}

function daysFromNow(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

function daysAgo(offsetDays: number): string {
  return daysFromNow(-offsetDays);
}

const USERS = [
  { id: 'mgmt-001', name: '张明（合规总监）', role: 'MANAGEMENT' as UserRole, dept: '合规部' },
  { id: 'exec-001', name: '李华（财务主管）', role: 'EXECUTOR' as UserRole, dept: '财务部' },
  { id: 'exec-002', name: '陈伟（IT 主管）', role: 'EXECUTOR' as UserRole, dept: '技术部' },
  { id: 'exec-003', name: '刘洋（运营主管）', role: 'EXECUTOR' as UserRole, dept: '运营部' },
  { id: 'exec-004', name: '赵雪（采购主管）', role: 'EXECUTOR' as UserRole, dept: '采购部' },
  { id: 'rev-001', name: '王芳（审计经理）', role: 'REVIEWER' as UserRole, dept: '审计部' },
  { id: 'rev-002', name: '周杰（合规审计）', role: 'REVIEWER' as UserRole, dept: '合规部' },
];

function reviewerIds() {
  return USERS.filter((u) => u.role === 'REVIEWER').map((u) => u.id);
}
function executorIds() {
  return USERS.filter((u) => u.role === 'EXECUTOR').map((u) => u.id);
}

function userName(id: string | null) {
  return id ? USERS.find((u) => u.id === id)?.name ?? '未知用户' : '系统自动';
}

function auditForBatch(batchId: string, batchNo: string, sourceType: SourceType): AuditItemLite {
  const risk = (['HIGH', 'MEDIUM', 'LOW'] as RiskLevel[])[
    Math.floor(Math.random() * 3)
  ];
  const pool =
    risk === 'HIGH' ? HIGH_AUDIT_TITLES : risk === 'MEDIUM' ? MEDIUM_AUDIT_TITLES : LOW_AUDIT_TITLES;
  const title = pick(pool);
  const status = weightedStatus();
  const createdAt = daysAgo(Math.floor(Math.random() * 60 + 3));
  let deadlineAt: string;
  if (risk === 'HIGH') deadlineAt = daysFromNow(Math.floor(Math.random() * 10 - 2));
  else if (risk === 'MEDIUM') deadlineAt = daysFromNow(Math.floor(Math.random() * 20 + 2));
  else deadlineAt = daysFromNow(Math.floor(Math.random() * 30 + 5));

  const closedAt =
    status === 'CLOSED' ? daysAgo(Math.floor(Math.random() * 10 + 1)) : null;
  const closeReason =
    closedAt
      ? CLOSE_REASONS[Math.floor(Math.random() * CLOSE_REASONS.length)]
      : null;

  const revisionCount = status === 'REJECTED' ? Math.floor(Math.random() * 3 + 1) : 0;
  const firstTimePass =
    status === 'CLOSED' ? (Math.random() > 0.25 ? true : false) : null;

  const assigneeId =
    status === 'CREATED' ? null : pick(executorIds());
  const reviewerId =
    status === 'CREATED' || status === 'ASSIGNED'
      ? null
      : pick(reviewerIds());

  return {
    id: uid('audit'),
    title,
    description: `根据${sourceType === 'PERMISSION_LOG' ? '权限日志异常分析' : sourceType === 'ERP_EXPORT' ? 'ERP数据一致性校验' : sourceType === 'EMAIL_MATERIAL' ? '邮件合规检索' : '多源交叉比对'}发现的问题，需相关部门在规定时限内完成整改并提交佐证材料。`,
    riskLevel: risk,
    status,
    dispatchRule: pick(DISPATCH_RULES),
    assigneeId,
    reviewerId,
    batchId,
    batchNo,
    sourceType,
    deadlineAt,
    createdAt,
    closedAt,
    closeReason,
    revisionCount,
    firstTimePass,
  };
}

function seed(): {
  batches: ImportBatchLite[];
  audits: AuditItemLite[];
} {
  const sources: SourceType[] = ['PERMISSION_LOG', 'ERP_EXPORT', 'EMAIL_MATERIAL', 'COMBINED'];
  const batches: ImportBatchLite[] = [];
  const audits: AuditItemLite[] = [];
  const management = USERS.find((u) => u.role === 'MANAGEMENT')!;

  for (let i = 0; i < 6; i++) {
    const id = uid('batch');
    const batchNo = generateBatchNo();
    const source = pick(sources);
    const auditCount =
      source === 'COMBINED'
        ? Math.floor(Math.random() * 10 + 12)
        : Math.floor(Math.random() * 8 + 5);
    const createdAt = daysAgo(i * 7 + Math.floor(Math.random() * 5));
    batches.push({
      id,
      batchNo,
      sourceType: source,
      fileName: `${source}_${batchNo}.${source === 'EMAIL_MATERIAL' ? 'zip' : 'csv'}`,
      createdById: management.id,
      createdByName: management.name,
      recordCount: auditCount * (Math.floor(Math.random() * 30 + 10)),
      auditItemCount: auditCount,
      status: i === 0 && Math.random() < 0.4 ? 'PROCESSING' : 'SUCCESS',
      errorLog: null,
      createdAt,
    });
    for (let a = 0; a < auditCount; a++) {
      audits.push(auditForBatch(id, batchNo, source));
    }
  }
  return { batches, audits };
}

const SEED = seed();

function timelineFor(audit: AuditItemLite): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  events.push({
    id: uid('ev'),
    auditId: audit.id,
    type: 'CREATE',
    actorId: 'mgmt-001',
    actorName: userName('mgmt-001'),
    comment: `导入批次 ${audit.batchNo} 生成整改项`,
    attachments: [],
    createdAt: audit.createdAt,
  });
  if (audit.assigneeId && audit.status !== 'CREATED') {
    events.push({
      id: uid('ev'),
      auditId: audit.id,
      type: 'ASSIGN',
      actorId: 'mgmt-001',
      actorName: userName('mgmt-001'),
      comment: `派工规则：${audit.dispatchRule}`,
      attachments: [],
      createdAt: daysAfter(audit.createdAt, 1),
    });
  }
  if (audit.status !== 'CREATED' && audit.status !== 'ASSIGNED') {
    events.push({
      id: uid('ev'),
      auditId: audit.id,
      type: 'RECTIFY',
      actorId: audit.assigneeId,
      actorName: userName(audit.assigneeId),
      comment: '已完成整改动作，上传佐证材料如下',
      attachments: ['整改说明.pdf', '系统截图.png'],
      createdAt: daysAfter(audit.createdAt, Math.floor(Math.random() * 6 + 2)),
    });
  }
  if (audit.status === 'REJECTED' || audit.status === 'CLOSED') {
    const passed = audit.status === 'CLOSED';
    events.push({
      id: uid('ev'),
      auditId: audit.id,
      type: passed ? 'REVIEW_PASS' : 'REVIEW_FAIL',
      actorId: audit.reviewerId,
      actorName: userName(audit.reviewerId),
      comment: passed
        ? '复核通过，整改有效'
        : pick(REVIEW_REASONS) + '，请重新整改后提交',
      attachments: passed ? [] : ['复核意见.pdf'],
      createdAt: daysAfter(audit.createdAt, Math.floor(Math.random() * 9 + 5)),
    });
  }
  if (audit.status === 'CLOSED') {
    events.push({
      id: uid('ev'),
      auditId: audit.id,
      type: 'CLOSE',
      actorId: audit.reviewerId,
      actorName: userName(audit.reviewerId),
      comment: `关闭原因：${audit.closeReason ?? '已完成整改'}`,
      attachments: [],
      createdAt: audit.closedAt!,
    });
  }
  return events.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

function daysAfter(iso: string, offset: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
}

function byUserRole(audits: AuditItemLite[], userId: string, role: UserRole): AuditItemLite[] {
  if (role === 'MANAGEMENT') return audits;
  if (role === 'REVIEWER') {
    return audits.filter(
      (a) =>
        a.reviewerId === userId ||
        a.status === 'PENDING_REVIEW' ||
        a.status === 'CLOSED',
    );
  }
  return audits.filter((a) => a.assigneeId === userId || a.status === 'CREATED');
}

function filterAudits(
  audits: AuditItemLite[],
  filters: {
    status?: string;
    riskLevel?: string;
    dispatchRule?: string;
    sourceType?: string;
    batchId?: string;
    overdueOnly?: boolean;
  },
): AuditItemLite[] {
  let arr = audits.slice();
  if (filters.status) arr = arr.filter((a) => a.status === filters.status);
  if (filters.riskLevel) arr = arr.filter((a) => a.riskLevel === filters.riskLevel);
  if (filters.dispatchRule) arr = arr.filter((a) => a.dispatchRule === filters.dispatchRule);
  if (filters.sourceType) arr = arr.filter((a) => a.sourceType === filters.sourceType);
  if (filters.batchId) arr = arr.filter((a) => a.batchId === filters.batchId);
  if (filters.overdueOnly) {
    const now = Date.now();
    arr = arr.filter((a) => a.status !== 'CLOSED' && +new Date(a.deadlineAt) < now);
  }
  return arr;
}

function paginate<T>(arr: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return {
    items: arr.slice(start, start + pageSize),
    total: arr.length,
    page,
    pageSize,
  };
}

function kpiOverview(audits: AuditItemLite[]): KpiOverview {
  const total = audits.length;
  const inProgress = audits.filter(
    (a) => a.status === 'IN_PROGRESS' || a.status === 'PENDING_REVIEW' || a.status === 'REJECTED',
  ).length;
  const now = Date.now();
  const overdue = audits.filter(
    (a) => a.status !== 'CLOSED' && +new Date(a.deadlineAt) < now,
  ).length;
  const closed = audits.filter((a) => a.status === 'CLOSED');
  const firstPassTotal = closed.filter((c) => c.firstTimePass === true).length;
  const firstPassRate = closed.length ? firstPassTotal / closed.length : 0;
  const closedRate = total ? closed.length / total : 0;
  const riskCounts = {
    HIGH: audits.filter((a) => a.riskLevel === 'HIGH').length,
    MEDIUM: audits.filter((a) => a.riskLevel === 'MEDIUM').length,
    LOW: audits.filter((a) => a.riskLevel === 'LOW').length,
  };
  const eventsByAudit = audits.flatMap((a) => timelineFor(a));
  const latestEvents = eventsByAudit
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 10);

  const trend: { label: string; closed: number; created: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (i + 1) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const label = `${start.getMonth() + 1}/${start.getDate()}`;
    trend.push({
      label,
      closed: closed.filter(
        (c) => c.closedAt && +new Date(c.closedAt) >= +start && +new Date(c.closedAt) < +end,
      ).length,
      created: audits.filter(
        (a) => +new Date(a.createdAt) >= +start && +new Date(a.createdAt) < +end,
      ).length,
    });
  }
  return {
    total,
    inProgress,
    overdue,
    firstPassRate,
    closedRate,
    riskCounts,
    latestEvents,
    trend,
  };
}

function myStats(audits: AuditItemLite[], userId: string): MyStats {
  const mine = audits.filter((a) => a.assigneeId === userId);
  const pending = mine.filter((a) => a.status === 'ASSIGNED' || a.status === 'CREATED').length;
  const inProgress = mine.filter(
    (a) => a.status === 'IN_PROGRESS' || a.status === 'PENDING_REVIEW' || a.status === 'REJECTED',
  ).length;
  const completed = mine.filter((a) => a.status === 'CLOSED');
  const firstPassTotal = completed.filter((c) => c.firstTimePass === true).length;
  const firstPassRate = completed.length ? firstPassTotal / completed.length : 0;
  const now = new Date();
  const avgDays = completed.length
    ? completed.reduce((sum, c) => {
        const d =
          (c.closedAt ? +new Date(c.closedAt) : +now) - +new Date(c.createdAt);
        return sum + Math.round(d / (1000 * 60 * 60 * 24));
      }, 0) / completed.length
    : 0;
  return {
    totalAssigned: mine.length,
    pending,
    inProgress,
    completed: completed.length,
    firstPassRate,
    avgDays,
  };
}

function dispatchRuleData(audits: AuditItemLite[]): DispatchRuleDatum[] {
  const map = new Map<string, number>();
  audits.forEach((a) => {
    map.set(a.dispatchRule, (map.get(a.dispatchRule) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

function funnelData(audits: AuditItemLite[]): FunnelDatum[] {
  const stages = [
    { key: 'CREATED', label: '已创建' },
    { key: 'ASSIGNED', label: '已派工' },
    { key: 'IN_PROGRESS', label: '整改中' },
    { key: 'PENDING_REVIEW', label: '待复核' },
    { key: 'CLOSED', label: '已关闭' },
  ];
  const indexOf = (s: string) => stages.findIndex((x) => x.key === s);
  return stages.map((s, i) => {
    const value = audits.filter((a) => indexOf(a.status) >= i).length;
    const inStage = audits.filter((a) => a.status === s.key);
    const avgHours = inStage.length
      ? inStage.reduce((sum, a) => sum + Math.floor(Math.random() * 40 + 8), 0) / inStage.length
      : 0;
    return { stage: s.label, value, avgHours: Math.round(avgHours) };
  });
}

function reviewCommentsData(audits: AuditItemLite[]): { reason: string; count: number }[] {
  const rejected = audits.filter((a) => a.revisionCount > 0);
  const freq = new Map<string, number>();
  rejected.forEach((a) => {
    for (let i = 0; i < a.revisionCount; i++) {
      const r = REVIEW_REASONS[Math.floor(Math.random() * REVIEW_REASONS.length)];
      freq.set(r, (freq.get(r) ?? 0) + 1);
    }
  });
  if (freq.size === 0) {
    REVIEW_REASONS.slice(0, 6).forEach((r, idx) =>
      freq.set(r, Math.max(1, 8 - idx)),
    );
  }
  return Array.from(freq.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function closeReasonsData(audits: AuditItemLite[]): CloseReasonDatum[] {
  const closed = audits.filter((a) => a.status === 'CLOSED');
  const weeks: CloseReasonDatum[] = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (i + 1) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const label = `${start.getMonth() + 1}/${start.getDate()}`;
    const bucket = closed.filter(
      (c) => c.closedAt && +new Date(c.closedAt) >= +start && +new Date(c.closedAt) < +end,
    );
    weeks.push({
      week: label,
      completed: bucket.filter((b) => b.closeReason === '已完成整改' || !b.closeReason).length,
      waived: bucket.filter((b) => b.closeReason === '风险豁免').length,
      escalated: bucket.filter((b) => b.closeReason === '升级处理' || b.closeReason === '事项合并')
        .length,
    });
  }
  return weeks;
}

function batchDetail(batchId: string): BatchDetail | null {
  const batch = SEED.batches.find((b) => b.id === batchId);
  if (!batch) return null;
  const batchAudits = SEED.audits.filter((a) => a.batchId === batchId);
  const permLogs: PermissionLogRow[] = [];
  const erpRecords: ErpRow[] = [];
  const emails: EmailRow[] = [];
  for (let i = 0; i < 15; i++) {
    permLogs.push({
      userId: pick(['U001', 'U002', 'U003', null]),
      action: pick([
        'LOGIN_SUCCESS',
        'LOGIN_FAIL',
        'EXPORT_DATA',
        'VIEW_REPORT',
        'UPDATE_SETTINGS',
        'APPROVE_PAYMENT',
      ]),
      resource: pick(['财务报表', '用户列表', 'ERP-财务模块', '权限中心', '客户档案']),
      ipAddress: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      happenedAt: daysAgo(Math.floor(Math.random() * 30)),
    });
  }
  for (let i = 0; i < 10; i++) {
    erpRecords.push({
      documentNo: `ERP-${2024}${String(Math.floor(Math.random() * 900000 + 100000))}`,
      amount: Math.round(Math.random() * 500000) / 100,
      department: pick(DEPARTMENTS),
      happenedAt: daysAgo(Math.floor(Math.random() * 60)),
    });
  }
  for (let i = 0; i < 8; i++) {
    emails.push({
      subject: pick([
        '关于Q3合规检查的整改通知',
        '供应商准入资料补充',
        '付款审批流程确认',
        '权限申请复核',
        '月度合规例会纪要',
      ]),
      sender: pick([
        'compliance@company.com',
        'finance@company.com',
        'audit@company.com',
        'hr@company.com',
      ]),
      recipients: Array.from(
        { length: Math.floor(Math.random() * 3 + 1) },
        () => pick(['manager@company.com', 'exec@company.com', 'legal@company.com']),
      ),
      sentAt: daysAgo(Math.floor(Math.random() * 30)),
    });
  }
  return {
    batch,
    auditItems: batchAudits,
    permLogs,
    erpRecords,
    emails,
  };
}

export const mockData = {
  audits: {
    list(params: {
      userId: string;
      role: UserRole;
      page?: number;
      pageSize?: number;
      filters?: Parameters<typeof filterAudits>[1];
    }) {
      const { userId, role, page = 1, pageSize = 20, filters = {} } = params;
      const visible = byUserRole(SEED.audits, userId, role);
      const filtered = filterAudits(visible, filters);
      filtered.sort(
        (a, b) =>
          (a.status === 'CLOSED' ? 1 : 0) - (b.status === 'CLOSED' ? 1 : 0) ||
          +new Date(b.createdAt) - +new Date(a.createdAt),
      );
      return paginate(filtered, page, pageSize);
    },
    get(id: string) {
      return SEED.audits.find((a) => a.id === id) ?? null;
    },
    timeline(id: string) {
      const audit = SEED.audits.find((a) => a.id === id);
      return audit ? timelineFor(audit) : [];
    },
    submitRectification(auditId: string, submitterId: string, description: string) {
      const audit = SEED.audits.find((a) => a.id === auditId);
      if (!audit) return null;
      audit.status = 'PENDING_REVIEW';
      return audit;
    },
    review(auditId: string, reviewerId: string, passed: boolean, comment: string) {
      const audit = SEED.audits.find((a) => a.id === auditId);
      if (!audit) return null;
      if (passed) {
        audit.status = 'CLOSED';
        audit.closedAt = new Date().toISOString();
        audit.closeReason = '已完成整改';
        audit.firstTimePass = audit.revisionCount === 0;
      } else {
        audit.status = 'REJECTED';
        audit.revisionCount += 1;
      }
      audit.reviewerId = reviewerId;
      return audit;
    },
  },
  batches: {
    list() {
      return SEED.batches.sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
    },
    get(id: string) {
      return batchDetail(id);
    },
    create(input: {
      sourceType: SourceType;
      fileName: string;
      createdById: string;
      createdByName: string;
    }) {
      const id = uid('batch');
      const batchNo = generateBatchNo();
      const newBatch: ImportBatchLite = {
        id,
        batchNo,
        sourceType: input.sourceType,
        fileName: input.fileName,
        createdById: input.createdById,
        createdByName: input.createdByName,
        recordCount: 0,
        auditItemCount: 0,
        status: 'PROCESSING',
        errorLog: null,
        createdAt: new Date().toISOString(),
      };
      SEED.batches.unshift(newBatch);
      const auditCount = Math.floor(Math.random() * 6 + 4);
      for (let i = 0; i < auditCount; i++) {
        SEED.audits.unshift(auditForBatch(id, batchNo, input.sourceType));
      }
      setTimeout(() => {
        newBatch.status = 'SUCCESS';
        newBatch.recordCount = auditCount * 18;
        newBatch.auditItemCount = auditCount;
      }, 1200);
      return newBatch;
    },
  },
  analytics: {
    overview(audits: AuditItemLite[]) {
      return kpiOverview(audits);
    },
    dispatchRules(audits: AuditItemLite[]) {
      return dispatchRuleData(audits);
    },
    funnel(audits: AuditItemLite[]) {
      return funnelData(audits);
    },
    reviewComments(audits: AuditItemLite[]) {
      return reviewCommentsData(audits);
    },
    closeReasons(audits: AuditItemLite[]) {
      return closeReasonsData(audits);
    },
  },
  kpi: {
    overview(userId: string, role: UserRole) {
      const audits = byUserRole(SEED.audits, userId, role);
      return kpiOverview(audits);
    },
    myStats(userId: string) {
      return myStats(SEED.audits, userId);
    },
  },
  users: {
    list() {
      return USERS;
    },
    dispatchRules: DISPATCH_RULES,
    reviewReasons: REVIEW_REASONS,
  },
};
