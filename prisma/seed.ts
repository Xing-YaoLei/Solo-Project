import { PrismaClient } from '@prisma/client';
import type { SourceType, RiskLevel, AuditStatus, UserRole } from '../src/lib/utils';

const prisma = new PrismaClient();

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

const USERS = [
  { id: 'mgmt-001', email: 'management@company.com', name: '张明（合规总监）', role: 'MANAGEMENT' as UserRole, department: '合规部' },
  { id: 'exec-001', email: 'executor@company.com', name: '李华（财务主管）', role: 'EXECUTOR' as UserRole, department: '财务部' },
  { id: 'exec-002', email: 'executor2@company.com', name: '陈伟（IT 主管）', role: 'EXECUTOR' as UserRole, department: '技术部' },
  { id: 'rev-001', email: 'reviewer@company.com', name: '王芳（审计经理）', role: 'REVIEWER' as UserRole, department: '审计部' },
];

const DISPATCH_RULES = ['按地域划分', '按部门归属', '按流程分类', '按资产类别', '按风险等级委派'];
const CLOSE_REASONS = ['已完成整改', '风险豁免', '升级/合并', '事项合并'];
const REVIEW_REJECT_REASONS = [
  '佐证材料不充分',
  '跨部门协同未闭环',
  '整改方案缺少验证',
  '控制措施描述不充分',
  '时限内未完成',
  '风险缓释证据缺失',
  '责任人未落实',
];

interface Rec {
  batchId: string;
}

function makePermLogs(batchId: string) {
  const actions = [
    { a: '批量导出客户资料', r: '/api/customer/export', risk: 'HIGH' as RiskLevel, user: '赵强', uid: 'u-zq' },
    { a: '管理员共享账户登录', r: 'root@erp-node-03', risk: 'HIGH' as RiskLevel, user: '系统运维', uid: 'u-ops' },
    { a: '越权审批付款单', r: 'FIN-PAY-2026-0412', risk: 'HIGH' as RiskLevel, user: '孙丽', uid: 'u-sl' },
    { a: '访问敏感定价库', r: '/confidential/pricing.xlsx', risk: 'MEDIUM' as RiskLevel, user: '钱进', uid: 'u-qj' },
    { a: '修改总账科目', r: 'GL-ACCT-6601', risk: 'MEDIUM' as RiskLevel, user: '李华', uid: 'exec-001' },
    { a: '新增用户管理员权限', r: 'IAM-POLICY-ADMIN', risk: 'MEDIUM' as RiskLevel, user: '陈伟', uid: 'exec-002' },
    { a: '下载员工薪酬表', r: '/hr/salary/2026-05.xlsx', risk: 'HIGH' as RiskLevel, user: 'HR 助理', uid: 'u-hr' },
    { a: '关闭操作审计日志', r: 'audit-log:switch-off', risk: 'HIGH' as RiskLevel, user: '运维组', uid: 'u-ops2' },
  ];
  return actions.map((it, idx) => ({
    id: uid('pl'),
    batchId,
    userId: it.uid,
    userName: it.user,
    action: it.a,
    resource: it.r,
    ipAddress: `10.10.${1 + idx}.${20 + idx}`,
    riskLevel: it.risk,
    happenedAt: daysAgo(Math.floor(Math.random() * 10)),
  }));
}

function makeErpRecords(batchId: string) {
  const docs = [
    { no: 'PAY-2026-061801', type: 'PAYMENT', amt: 2380000, dept: '采购部', op: '周敏', app: '李明', risk: 'HIGH' as RiskLevel, title: '供应商准入未通过合规评审' },
    { no: 'PAY-2026-061509', type: 'PAYMENT', amt: 568000, dept: '市场部', op: '刘洋', app: '张强', risk: 'MEDIUM' as RiskLevel, title: '付款审批流程越级操作' },
    { no: 'PO-2026-061411', type: 'PURCHASE', amt: 1290000, dept: '行政部', op: '王磊', app: '赵敏', risk: 'MEDIUM' as RiskLevel, title: '单一来源采购未走询比价' },
    { no: 'CT-2026-061102', type: 'CONTRACT', amt: 5800000, dept: '法务部', op: '陈超', app: '孙总', risk: 'HIGH' as RiskLevel, title: '合同条款缺失责任上限约定' },
    { no: 'PAY-2026-060907', type: 'PAYMENT', amt: 320000, dept: '财务部', op: '李华', app: '财务总监', risk: 'LOW' as RiskLevel, title: '原始凭证电子化归档缺失' },
  ];
  return docs.map((d, idx) => ({
    id: uid('erp'),
    batchId,
    documentNo: d.no,
    documentType: d.type,
    amount: d.amt,
    department: d.dept,
    operator: d.op,
    approver: d.app,
    riskLevel: d.risk,
    happenedAt: daysAgo(2 + idx),
    _title: d.title,
  }));
}

function makeEmails(batchId: string) {
  const mails = [
    { subj: '【预警】客户资料批量导出行为', sender: 'audit-alert@company.com', to: ['management@company.com'], risk: 'HIGH' as RiskLevel, summary: '30 分钟内累计导出 1.2 万条高净值客户联系方式，未走审批。' },
    { subj: '供应商资质异常提醒 - XX贸易', sender: 'vendor-risk@company.com', to: ['executor@company.com', 'management@company.com'], risk: 'HIGH' as RiskLevel, summary: '供应商资质已过期 47 天，仍在继续发生付款。' },
    { subj: '法务评审未通过合同反馈', sender: 'legal-review@company.com', to: ['reviewer@company.com'], risk: 'MEDIUM' as RiskLevel, summary: 'CT-2026-061102 合同未明确违约责任上限，建议退回重审。' },
    { subj: '员工举报：采购回扣线索', sender: 'whistle@company.com', to: ['reviewer@company.com', 'management@company.com'], risk: 'HIGH' as RiskLevel, summary: '匿名举报采购部在 PO-2026-061411 中有利益关联嫌疑，建议启动专项调查。' },
    { subj: '部门月度合规情况汇总', sender: 'compliance@company.com', to: ['management@company.com'], risk: 'LOW' as RiskLevel, summary: '本月完成 12 项整改闭环，较上月提升 27%。' },
  ];
  return mails.map((m, idx) => ({
    id: uid('em'),
    batchId,
    subject: m.subj,
    sender: m.sender,
    recipients: JSON.stringify(m.to),
    summary: m.summary,
    riskLevel: m.risk,
    sentAt: daysAgo(1 + idx),
  }));
}

function assignerFor(risk: RiskLevel, source?: SourceType): string | null {
  if (source === 'ERP_EXPORT') return 'exec-001';
  if (source === 'PERMISSION_LOG') return risk === 'HIGH' ? 'exec-002' : 'exec-001';
  if (source === 'EMAIL_MATERIAL') return risk === 'HIGH' ? 'exec-002' : 'exec-001';
  return null;
}

function randomRule() {
  return DISPATCH_RULES[Math.floor(Math.random() * DISPATCH_RULES.length)];
}

type PermRec = ReturnType<typeof makePermLogs>[number];
type ErpRec = ReturnType<typeof makeErpRecords>[number];
type EmailRec = ReturnType<typeof makeEmails>[number];

async function main() {
  console.log('==> 清空旧数据...');
  await prisma.$transaction([
    prisma.rectification.deleteMany(),
    prisma.reviewComment.deleteMany(),
    prisma.auditItem.deleteMany(),
    prisma.permissionLog.deleteMany(),
    prisma.erpRecord.deleteMany(),
    prisma.emailMaterial.deleteMany(),
    prisma.importBatch.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('==> 创建用户...');
  for (const u of USERS) {
    await prisma.user.create({ data: u });
  }

  console.log('==> 创建导入批次：权限日志 + ERP 导出 + 邮件材料...');
  const bat1 = await prisma.importBatch.create({
    data: {
      id: uid('batch'),
      batchNo: batchNo(),
      sourceType: 'COMBINED',
      fileName: '合规审计导入_2026Q2_第3批.xlsx / .eml 包',
      filePath: '/uploads/batches/q2-b3/',
      createdById: 'mgmt-001',
      recordCount: 0,
      status: 'SUCCESS',
      processLog: JSON.stringify([
        { t: new Date().toISOString(), step: '1', msg: '开始解析权限日志.csv，共 8 条记录' },
        { t: new Date().toISOString(), step: '2', msg: '规则命中 8 条，合并 ERP 导出.xlsx 5 条' },
        { t: new Date().toISOString(), step: '3', msg: '邮件材料 5 封解析完成，去重 2 条重复事项' },
        { t: new Date().toISOString(), step: '4', msg: '三源合并完成，生成 18 条整改项，自动派工分派执行人' },
        { t: new Date().toISOString(), step: 'OK', msg: `批次导入成功，高风险 7 / 中风险 7 / 低风险 4` },
      ]),
    },
  });

  const pl = makePermLogs(bat1.id);
  const erpAll = makeErpRecords(bat1.id);
  const erpDb = erpAll.map(({ _title, ...rest }) => rest);
  const em = makeEmails(bat1.id);

  await prisma.permissionLog.createMany({ data: pl });
  await prisma.erpRecord.createMany({ data: erpDb });
  await prisma.emailMaterial.createMany({
    data: em.map((e) => ({ ...e })),
  });

  const allAuditSource: Array<{
    title: string;
    desc: string;
    risk: RiskLevel;
    source: SourceType;
    deadlineDays: number;
  }> = [];

  for (const p of pl) {
    allAuditSource.push({
      title: `${p.userName}·${p.action}`,
      desc: `权限日志命中：${p.action}（${p.resource}），IP ${p.ipAddress}，行为与基线不符，需立即整改。`,
      risk: p.riskLevel ?? 'MEDIUM',
      source: 'PERMISSION_LOG',
      deadlineDays: p.riskLevel === 'HIGH' ? 3 : 10,
    });
  }
  for (const e of erpAll) {
    allAuditSource.push({
      title: e._title,
      desc: `ERP 单据 ${e.documentNo}（¥${(e.amount ?? 0).toLocaleString()}），部门 ${e.department}，操作人 ${e.operator}，审批人 ${e.approver}。`,
      risk: e.riskLevel ?? 'MEDIUM',
      source: 'ERP_EXPORT',
      deadlineDays: e.riskLevel === 'HIGH' ? 5 : 14,
    });
  }
  for (const m of em) {
    if (m.riskLevel === 'LOW') continue;
    allAuditSource.push({
      title: m.subject.replace(/【.+?】/g, '').trim(),
      desc: `${m.summary}（来函：${m.sender}）`,
      risk: m.riskLevel ?? 'MEDIUM',
      source: 'EMAIL_MATERIAL',
      deadlineDays: m.riskLevel === 'HIGH' ? 2 : 7,
    });
  }

  console.log('==> 写入审计整改项（三源合并生成）...');
  const auditRecs = allAuditSource.map((s, i) => {
    const statuses: AuditStatus[] = ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_REVIEW', 'CLOSED', 'REJECTED'];
    const pick = i < 2 ? 'CLOSED' : i < 5 ? 'IN_PROGRESS' : i < 8 ? 'PENDING_REVIEW' : i < 11 ? 'REJECTED' : 'ASSIGNED';
    const sid = statuses.indexOf(pick);
    const assignee = assignerFor(s.risk, s.source);
    const closedAt = pick === 'CLOSED' ? daysAgo(Math.max(1, s.deadlineDays - 1)) : null;
    return {
      id: uid('aud'),
      title: s.title,
      description: s.desc,
      riskLevel: s.risk,
      status: pick,
      dispatchRule: randomRule(),
      sourceType: s.source,
      assigneeId: assignee,
      reviewerId: sid >= 3 ? 'rev-001' : null,
      batchId: bat1.id,
      deadlineAt: daysFromNow(s.deadlineDays - Math.floor(i / 2)),
      createdAt: daysAgo(Math.floor(Math.random() * 6) + 1),
      closedAt,
      closeReason: closedAt ? CLOSE_REASONS[Math.floor(Math.random() * CLOSE_REASONS.length)] : null,
      revisionCount: pick === 'REJECTED' ? 1 + Math.floor(Math.random() * 2) : 0,
      firstTimePass: closedAt ? Math.random() > 0.25 : null,
    };
  });

  for (const r of auditRecs) {
    await prisma.auditItem.create({ data: r });
  }

  const audits = await prisma.auditItem.findMany({ where: { batchId: bat1.id } });
  const totalRecs = pl.length + erpAll.length + em.length;
  await prisma.importBatch.update({
    where: { id: bat1.id },
    data: { recordCount: totalRecs + audits.length },
  });

  console.log('==> 补第 2 批次（权限日志 + ERP 导出，不含邮件）');
  const bat2 = await prisma.importBatch.create({
    data: {
      id: uid('batch'),
      batchNo: batchNo(),
      sourceType: 'PERMISSION_LOG',
      fileName: '权限系统导出_20260620.csv',
      filePath: '/uploads/batches/q2-b2-perm/',
      createdById: 'rev-001',
      recordCount: 6,
      status: 'SUCCESS',
      processLog: JSON.stringify([
        { t: new Date().toISOString(), step: '1', msg: '解析权限日志 6 条' },
        { t: new Date().toISOString(), step: '2', msg: '命中高危 2 条，中危 3 条，低危 1 条' },
      ]),
    },
  });
  const pl2 = makePermLogs(bat2.id).slice(0, 6);
  await prisma.permissionLog.createMany({ data: pl2 });
  for (const p of pl2.slice(0, 4)) {
    await prisma.auditItem.create({
      data: {
        id: uid('aud'),
        title: `${p.userName}·${p.action}`,
        description: `权限日志 ${p.resource}`,
        riskLevel: p.riskLevel ?? 'MEDIUM',
        status: 'ASSIGNED',
        dispatchRule: randomRule(),
        sourceType: 'PERMISSION_LOG',
        assigneeId: assignerFor(p.riskLevel as RiskLevel, 'PERMISSION_LOG'),
        batchId: bat2.id,
        deadlineAt: daysFromNow(7),
      },
    });
  }

  console.log('==> Seed 完成！');
  console.log(`    用户 ${USERS.length} 人 | 批次 2 个 | 审计项 ${audits.length + 4} 条`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
