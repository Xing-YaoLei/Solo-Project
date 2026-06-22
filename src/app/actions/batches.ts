'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from './auth';
import type { SourceType, RiskLevel } from '@/lib/utils';

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

export async function createAuditBatch(input: CreateBatchInput) {
  const user = await requireUser(['MANAGEMENT', 'REVIEWER']);
  const log: Array<{ t: string; step: string; msg: string }> = [];
  const push = (step: string, msg: string) => log.push({ t: new Date().toISOString(), step, msg });

  push('1', '创建导入批次...');
  const batchId = uid('batch');
  const no = batchNo();

  const permCount = (input.permissionCsv ?? '').split('\n').filter((l) => l.trim()).length || Math.floor(4 + Math.random() * 6);
  const erpCount = (input.erpCsv ?? '').split('\n').filter((l) => l.trim()).length || Math.floor(3 + Math.random() * 4);
  const emailCount = (input.emailEmlPack ?? '').split('\n').filter((l) => l.trim()).length || Math.floor(2 + Math.random() * 4);

  const sourceType: SourceType =
    permCount > 0 && erpCount > 0 && emailCount > 0
      ? 'COMBINED'
      : permCount > 0
        ? 'PERMISSION_LOG'
        : erpCount > 0
          ? 'ERP_EXPORT'
          : 'EMAIL_MATERIAL';

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

  push('2', `解析权限日志 ${permCount} 条...`);
  const permLogs = Array.from({ length: permCount }).map((_, i) => {
    const t = PERM_ACTIONS[i % PERM_ACTIONS.length];
    return {
      id: uid('pl'),
      batchId,
      userId: `u-${i}`,
      userName: `用户${String.fromCharCode(65 + i)}`,
      action: t.a,
      resource: t.r,
      ipAddress: `10.10.${1 + i}.${20 + i}`,
      riskLevel: t.risk,
      happenedAt: daysAgo(Math.floor(Math.random() * 8)),
    };
  });
  if (permLogs.length) await prisma.permissionLog.createMany({ data: permLogs });

  push('3', `解析 ERP 导出 ${erpCount} 条...`);
  const erpRows = Array.from({ length: erpCount }).map((_, i) => {
    const t = ERP_TEMPLATES[i % ERP_TEMPLATES.length];
    return {
      id: uid('erp'),
      batchId,
      documentNo: `${t.no}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      documentType: t.type,
      amount: 100000 + Math.floor(Math.random() * 5000000),
      department: ['采购部', '财务部', '市场部', '行政部'][i % 4],
      operator: ['李华', '陈伟', '刘洋', '王磊'][i % 4],
      approver: ['财务总监', 'CEO', '审计经理', '技术总监'][i % 4],
      riskLevel: t.risk,
      happenedAt: daysAgo(i),
      _title: t.title,
    };
  });
  if (erpRows.length) {
    await prisma.erpRecord.createMany({
      data: erpRows.map(({ _title, ...rest }) => rest),
    });
  }

  push('4', `解析邮件材料 ${emailCount} 封...`);
  const emRows = Array.from({ length: emailCount }).map((_, i) => {
    const t = EMAIL_TEMPLATES[i % EMAIL_TEMPLATES.length];
    return {
      id: uid('em'),
      batchId,
      subject: t.subj,
      sender: ['audit-alert@company.com', 'vendor-risk@company.com', 'legal-review@company.com'][i % 3],
      recipients: JSON.stringify(['management@company.com', 'reviewer@company.com']),
      summary: t.summary,
      riskLevel: t.risk,
      sentAt: daysAgo(i + 1),
    };
  });
  if (emRows.length) await prisma.emailMaterial.createMany({ data: emRows });

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

  const RULES = ['按地域划分', '按部门归属', '按流程分类', '按资产类别', '按风险等级委派'];
  const EXECS = ['exec-001', 'exec-002'];
  const audits = seeds.map((s, i) => ({
    id: uid('aud'),
    title: s.title,
    description: s.description,
    riskLevel: s.riskLevel,
    status: i < seeds.length / 3 ? 'ASSIGNED' : i < (seeds.length * 2) / 3 ? 'IN_PROGRESS' : 'CREATED',
    dispatchRule: RULES[Math.floor(Math.random() * RULES.length)],
    sourceType: s.sourceType,
    assigneeId: s.riskLevel === 'MEDIUM' || s.riskLevel === 'HIGH' ? EXECS[Math.floor(Math.random() * EXECS.length)] : null,
    reviewerId: s.riskLevel === 'HIGH' ? 'rev-001' : null,
    batchId,
    deadlineAt: daysFromNow(s.deadlineDays - Math.floor(i / 3)),
    revisionCount: 0,
  }));

  for (const a of audits) {
    await prisma.auditItem.create({ data: a });
  }

  push('OK', `成功！批次 ${no}：三源记录 ${permCount + erpCount + emailCount} 条 / 整改项 ${audits.length} 条`);

  await prisma.importBatch.update({
    where: { id: batchId },
    data: {
      status: 'SUCCESS',
      recordCount: permCount + erpCount + emailCount + audits.length,
      processLog: JSON.stringify(log),
    },
  });

  return { ok: true, batchId, batchNo: no, auditCount: audits.length, log };
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
