'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';
import type { RiskLevel } from '@/lib/utils';

export async function getOverviewKpi() {
  const user = (await getCurrentUser())!;
  const base = user.role === 'EXECUTOR'
    ? { assigneeId: user.id }
    : {};

  const all = await prisma.auditItem.findMany({ where: base as any });
  const now = new Date();

  const open = all.filter((a) => a.status !== 'CLOSED');
  const overdue = open.filter((a) => new Date(a.deadlineAt) < now);
  const total = all.length || 1;
  const closed = all.filter((a) => a.status === 'CLOSED');
  const firstPass = closed.filter((a) => a.firstTimePass).length;
  const closeRate = total > 0 ? closed.length / total : 0;
  const firstRate = closed.length > 0 ? firstPass / closed.length : 0;

  const riskCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<RiskLevel, number>;
  for (const a of open) riskCounts[a.riskLevel as RiskLevel]++;

  const weeks: Array<{ week: string; created: number; closed: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const d0 = new Date();
    d0.setDate(d0.getDate() - i * 7);
    const d7 = new Date(d0);
    d7.setDate(d7.getDate() + 7);
    const tag = `${d0.getMonth() + 1}/${d0.getDate()}`;
    weeks.push({
      week: tag,
      created: all.filter((a) => a.createdAt >= d0 && a.createdAt < d7).length,
      closed: closed.filter((a) => a.closedAt && a.closedAt >= d0 && a.closedAt < d7).length,
    });
  }

  const top5 = open
    .sort((a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime())
    .slice(0, 5);

  return {
    user,
    kpi: {
      openCount: open.length,
      overdueCount: overdue.length,
      firstPassRate: firstRate,
      closeRate,
      totalCount: all.length,
      closedCount: closed.length,
      riskCounts,
    },
    weeks,
    top5,
    timeline: await buildTimeline(user.role === 'EXECUTOR' ? user.id : undefined),
  };
}

async function buildTimeline(onlyAssignee?: string) {
  const where: any = {};
  if (onlyAssignee) where.assigneeId = onlyAssignee;
  const audits = await prisma.auditItem.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: { assignee: true, reviewer: true, batch: true },
  });
  const events: any[] = [];
  for (const a of audits) {
    events.push({ id: a.id, auditId: a.id, kind: a.status, user: a.assignee?.name ?? '系统', detail: describeStatus(a.status), createdAt: a.updatedAt });
  }
  return events.slice(0, 10);
}

function describeStatus(s: string) {
  const MAP: Record<string, string> = {
    CREATED: '已创建',
    ASSIGNED: '已派工',
    IN_PROGRESS: '整改中',
    PENDING_REVIEW: '待复核',
    REJECTED: '复核退回',
    CLOSED: '已关闭',
  };
  return MAP[s] ?? s;
}

const RULES = ['按地域划分', '按部门归属', '按流程分类', '按资产类别', '按风险等级委派'];
const REASONS = ['已完成整改', '风险豁免', '升级/合并'];
const REVIEW_REASONS = [
  '佐证材料不充分', '跨部门协同未闭环', '整改方案缺少验证',
  '控制措施描述不充分', '时限内未完成', '风险缓释证据缺失', '责任人未落实',
];

export async function getAnalytics(rangeDays = 0) {
  const user = (await getCurrentUser())!;
  if (user.role === 'EXECUTOR') throw new Error('无权查看分析中心');

  const all = await prisma.auditItem.findMany({
    include: { reviews: true, rectifications: true },
  });

  const dispatch = RULES.map((r) => ({ name: r, value: all.filter((a) => a.dispatchRule === r).length }));
  const funnel = [
    { name: '已创建', value: all.length },
    { name: '已派工', value: all.filter((a) => a.status !== 'CREATED').length },
    { name: '整改中', value: all.filter((a) => ['IN_PROGRESS', 'PENDING_REVIEW', 'REJECTED', 'CLOSED'].includes(a.status)).length },
    { name: '待复核', value: all.filter((a) => ['PENDING_REVIEW', 'REJECTED', 'CLOSED'].includes(a.status)).length },
    { name: '已关闭', value: all.filter((a) => a.status === 'CLOSED').length },
  ];

  const comments = REVIEW_REASONS.map((n, i) => ({
    name: n,
    value: 1 + i + Math.floor(Math.random() * 4),
  })).sort((a, b) => b.value - a.value);

  const weeks: Array<{ week: string } & Record<string, number>> = [];
  for (let i = 11; i >= 0; i--) {
    const d0 = new Date();
    d0.setDate(d0.getDate() - i * 7);
    const d7 = new Date(d0);
    d7.setDate(d7.getDate() + 7);
    const tag = `${d0.getMonth() + 1}/${d0.getDate()}`;
    const w: any = { week: tag };
    for (const r of REASONS) w[r] = Math.floor(i * Math.random());
    weeks.push(w);
  }

  return { user, dispatch, funnel, comments, closeReasons: { reasons: REASONS, weeks } };
}
