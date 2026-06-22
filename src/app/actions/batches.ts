'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from './auth';
import type { SourceType, RiskLevel, AuditStatus } from '@/lib/utils';
import {
  parsePermissionLogs,
  parseErpRecords,
  parseEmailMaterials,
  classifyRisk,
  type ParsedPermissionLog,
  type ParsedErpRecord,
  type ParsedEmail,
} from '@/lib/parsers';

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}
function batchNo() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `B${ymd}${Math.floor(1000 + Math.random() * 9000)}`;
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

export interface CreateBatchInput {
  sourceType: SourceType;
  fileName?: string;
  permissionCsv?: string;
  erpCsv?: string;
  emailEmlPack?: string;
}

const PERM_ACTIONS: Array<{ a: string; r: string; risk: RiskLevel }> = [
  { a: '批量导出客户资料', r: '/api/customer/export', risk: 'HIGH' },
  { a: '共享管理员账号登录', r: 'root@erp-node', risk: 'HIGH' },
  { a: '越权审批付款', r: 'FIN-PAY-*', risk: 'HIGH' },
  { a: '访问敏感定价文档', r: '/confidential/pricing.xlsx', risk: 'MEDIUM' },
  { a: '修改总账科目', r: 'GL-ACCT-*', risk: 'MEDIUM' },
  { a: '新增 IAM 管理员策略', r: 'IAM-POLICY-ADMIN', risk: 'MEDIUM' },
  { a: '下载薪酬表', r: '/hr/salary/2026.xlsx', risk: 'HIGH' },
  { a: '关闭操作审计日志', r: 'audit-log:switch-off', risk: 'HIGH' },
];
const ERP_TEMPLATES = [
  { no: 'PAY', type: 'PAYMENT', title: '付款审批流程越级操作', risk: 'HIGH' as RiskLevel },
  { no: 'PO', type: 'PURCHASE', title: '供应商准入未通过合规评审', risk: 'HIGH' as RiskLevel },
  { no: 'CT', type: 'CONTRACT', title: '合同条款缺失责任上限约定', risk: 'MEDIUM' as RiskLevel },
];
const EMAIL_TEMPLATES = [
  { subj: '【预警】批量导出敏感数据行为', risk: 'HIGH' as RiskLevel, summary: '30 分钟内批量导出 1.2 万条客户信息，未走审批。' },
  { subj: '【法务】合同评审未通过反馈', risk: 'MEDIUM' as RiskLevel, summary: '合同未明确违约责任上限，建议退回重审。' },
  { subj: '供应商资质异常提醒', risk: 'HIGH' as RiskLevel, summary: '供应商资质已过期 47 天，仍在继续付款。' },
];

export async function previewParse(input: CreateBatchInput) {
  await requireUser(['MANAGEMENT', 'REVIEWER']);

  const allowedPerm = input.sourceType === 'PERMISSION_LOG' || input.sourceType === 'COMBINED';
  const allowedErp = input.sourceType === 'ERP_EXPORT' || input.sourceType === 'COMBINED';
  const allowedEmail = input.sourceType === 'EMAIL_MATERIAL' || input.sourceType === 'COMBINED';

  const permLogs = allowedPerm ? parsePermissionLogs(input.permissionCsv ?? '') : [];
  const erpRows = allowedErp ? parseErpRecords(input.erpCsv ?? '') : [];
  const emRows = allowedEmail ? parseEmailMaterials(input.emailEmlPack ?? '') : [];

  const permCount = permLogs.length;
  const erpCount = erpRows.length;
  const emailCount = emRows.length;
  const total = permCount + erpCount + emailCount;

  if (total === 0) {
    return {
      ok: false,
      error: '当前选择的数据源类型没有解析到任何有效记录，请粘贴内容或上传文件。',
      counts: { permission: 0, erp: 0, email: 0, total: 0 },
      sourceType: input.sourceType,
      riskBreakdown: { HIGH: 0, MEDIUM: 0, LOW: 0 },
      preview: { permission: [], erp: [], email: [] },
    };
  }

  const riskBreakdown = {
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  for (const p of permLogs) riskBreakdown[p.riskLevel]++;
  for (const e of erpRows) riskBreakdown[e.riskLevel]++;
  for (const m of emRows) riskBreakdown[m.riskLevel]++;

  return {
    ok: true,
    counts: { permission: permCount, erp: erpCount, email: emailCount, total },
    sourceType: input.sourceType,
    riskBreakdown,
    preview: {
      permission: permLogs.slice(0, 3),
      erp: erpRows.slice(0, 3),
      email: emRows.slice(0, 3),
    },
  };
}

export async function createAuditBatch(input: CreateBatchInput) {
  const user = await requireUser(['MANAGEMENT', 'REVIEWER']);
  const log: Array<{ t: string; step: string; msg: string }> = [];
  const push = (step: string, msg: string) => log.push({ t: new Date().toISOString(), step, msg });

  const allowedPerm = input.sourceType === 'PERMISSION_LOG' || input.sourceType === 'COMBINED';
  const allowedErp = input.sourceType === 'ERP_EXPORT' || input.sourceType === 'COMBINED';
  const allowedEmail = input.sourceType === 'EMAIL_MATERIAL' || input.sourceType === 'COMBINED';

  push('1', '创建导入批次...');
  const batchId = uid('batch');
  const no = batchNo();

  push('2', '解析权限日志...');
  const parsedPerm = allowedPerm ? parsePermissionLogs(input.permissionCsv ?? '') : [];
  const permLogs = parsedPerm.map((p) => ({
    id: uid('pl'),
    batchId,
    userId: p.userId,
    userName: p.userName,
    action: p.action,
    resource: p.resource,
    ipAddress: p.ipAddress,
    riskLevel: p.riskLevel,
    happenedAt: p.happenedAt,
    rawLine: p._raw || null,
  }));
  push('2.1', `权限日志解析完成：${permLogs.length} 条（H=${permLogs.filter((p) => p.riskLevel === 'HIGH').length} M=${permLogs.filter((p) => p.riskLevel === 'MEDIUM').length}）`);

  push('3', '解析 ERP 导出...');
  const parsedErp = allowedErp ? parseErpRecords(input.erpCsv ?? '') : [];
  const erpRows = parsedErp.map((e) => ({
    id: uid('erp'),
    batchId,
    documentNo: e.documentNo,
    documentType: e.documentType,
    amount: e.amount,
    department: e.department,
    operator: e.operator,
    approver: e.approver,
    riskLevel: e.riskLevel,
    happenedAt: e.happenedAt,
    _title: e._title,
    rawLine: e._raw || null,
  }));
  push('3.1', `ERP 导出解析完成：${erpRows.length} 条（H=${erpRows.filter((p) => p.riskLevel === 'HIGH').length} M=${erpRows.filter((p) => p.riskLevel === 'MEDIUM').length}）`);

  push('4', '解析邮件材料...');
  const parsedEm = allowedEmail ? parseEmailMaterials(input.emailEmlPack ?? '') : [];
  const emRows = parsedEm.map((m) => ({
    id: uid('em'),
    batchId,
    subject: m.subject,
    sender: m.sender,
    recipients: m.recipients,
    summary: m.summary,
    riskLevel: m.riskLevel,
    sentAt: m.sentAt,
    rawContent: m._raw || null,
  }));
  push('4.1', `邮件材料解析完成：${emRows.length} 封（H=${emRows.filter((p) => p.riskLevel === 'HIGH').length} M=${emRows.filter((p) => p.riskLevel === 'MEDIUM').length}）`);

  const permCount = permLogs.length;
  const erpCount = erpRows.length;
  const emailCount = emRows.length;
  const totalRaw = permCount + erpCount + emailCount;

  if (totalRaw === 0) {
    push('ERR', '未解析到任何有效记录，请检查输入内容是否符合格式要求');
    throw new Error('未解析到任何有效记录，请检查输入内容是否符合格式要求');
  }

  const sourceType: SourceType = input.sourceType;

  const batch = await prisma.importBatch.create({
    data: {
      id: batchId,
      batchNo: no,
      sourceType,
      fileName: input.fileName,
      filePath: `/uploads/batches/${no}/`,
      createdById: user.id,
      status: 'PROCESSING',
      recordCount: 0,
    },
  });

  if (permLogs.length) {
    const { rawLine, ...dbPerm } = permLogs[0] as any;
    await prisma.permissionLog.createMany({
      data: permLogs.map(({ rawLine, ...rest }: any) => rest),
    });
  }

  if (erpRows.length) {
    await prisma.erpRecord.createMany({
      data: erpRows.map(({ _title, rawLine, ...rest }: any) => rest),
    });
  }

  if (emRows.length) {
    await prisma.emailMaterial.createMany({
      data: emRows.map(({ rawContent, ...rest }: any) => rest),
    });
  }

  push('5', '三源合并、去重并生成整改项...');
  type AuditSeed = {
    title: string;
    description: string;
    riskLevel: RiskLevel;
    sourceType: SourceType;
    deadlineDays: number;
  };
  const seeds: AuditSeed[] = [];

  for (const p of permLogs) {
    seeds.push({
      title: `${p.userName}·${p.action}`,
      description: `权限日志命中：${p.action}（${p.resource}）IP ${p.ipAddress}。`,
      riskLevel: p.riskLevel as RiskLevel,
      sourceType: 'PERMISSION_LOG',
      deadlineDays: p.riskLevel === 'HIGH' ? 3 : 10,
    });
  }
  for (const e of erpRows) {
    seeds.push({
      title: e._title,
      description: `ERP 单据 ${e.documentNo}（¥${(e.amount ?? 0).toLocaleString()}），部门 ${e.department}，操作人 ${e.operator}。`,
      riskLevel: e.riskLevel as RiskLevel,
      sourceType: 'ERP_EXPORT',
      deadlineDays: e.riskLevel === 'HIGH' ? 5 : 14,
    });
  }
  for (const m of emRows) {
    if (m.riskLevel === 'LOW') continue;
    seeds.push({
      title: m.subject.replace(/【.+?】/g, '').trim(),
      description: `${m.summary}（发件人：${m.sender}）`,
      riskLevel: m.riskLevel as RiskLevel,
      sourceType: 'EMAIL_MATERIAL',
      deadlineDays: m.riskLevel === 'HIGH' ? 2 : 7,
    });
  }

  function assignerFor(risk: RiskLevel, source: SourceType): { assigneeId: string | null; reviewerId: string | null; rule: string } {
    if (source === 'PERMISSION_LOG' && risk === 'HIGH') {
      return { assigneeId: 'exec-002', reviewerId: 'rev-001', rule: '高风险权限异常 → 陈伟（首席）' };
    }
    if (source === 'EMAIL_MATERIAL' && risk === 'HIGH') {
      return { assigneeId: 'exec-002', reviewerId: 'rev-001', rule: '高风险邮件预警 → 陈伟（首席）' };
    }
    if (source === 'ERP_EXPORT') {
      return { assigneeId: 'exec-001', reviewerId: 'rev-001', rule: 'ERP 单据审计 → 李华（财务审计）' };
    }
    if (risk === 'MEDIUM') {
      return { assigneeId: 'exec-001', reviewerId: null, rule: '中风险 → 李华' };
    }
    if (risk === 'HIGH') {
      return { assigneeId: 'exec-001', reviewerId: 'rev-001', rule: '高风险 → 李华 + 复核' };
    }
    return { assigneeId: null, reviewerId: null, rule: '待分派' };
  }

  const audits = seeds.map((s, i) => {
    const { assigneeId, reviewerId, rule } = assignerFor(s.riskLevel, s.sourceType);
    return {
      id: uid('aud'),
      title: s.title,
      description: s.description,
      riskLevel: s.riskLevel,
      status: (assigneeId ? 'ASSIGNED' : 'CREATED') as AuditStatus,
      dispatchRule: rule,
      sourceType: s.sourceType,
      assigneeId,
      reviewerId,
      batchId,
      deadlineAt: daysFromNow(Math.max(1, s.deadlineDays - Math.floor(i / 5))),
      revisionCount: 0,
    };
  });

  if (audits.length) {
    await prisma.auditItem.createMany({ data: audits });
  }

  push('OK', `成功！批次 ${no}：三源记录 ${totalRaw} 条 / 整改项 ${audits.length} 条`);

  await prisma.importBatch.update({
    where: { id: batchId },
    data: {
      status: 'SUCCESS',
      recordCount: totalRaw + audits.length,
      processLog: JSON.stringify(log),
    },
  });

  return { ok: true, batchId, batchNo: no, auditCount: audits.length, log, counts: { permission: permCount, erp: erpCount, email: emailCount } };
}

export async function listBatches() {
  await requireUser(['MANAGEMENT', 'REVIEWER']);
  return prisma.importBatch.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      _count: { select: { auditItems: true, permLogs: true, erpRecords: true, emails: true } },
    },
  });
}

export async function getBatchDetail(batchId: string) {
  const user = await requireUser(['MANAGEMENT']);
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      permLogs: { orderBy: { happenedAt: 'desc' }, take: 100 },
      erpRecords: { orderBy: { happenedAt: 'desc' }, take: 100 },
      emails: { orderBy: { sentAt: 'desc' }, take: 100 },
      auditItems: {
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: { select: { id: true, name: true, email: true, department: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  if (!batch) return null;
  return { user, batch };
}
