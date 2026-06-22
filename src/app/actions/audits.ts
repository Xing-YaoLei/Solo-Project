'use server';

import { prisma } from '@/lib/prisma';
import { requireUser, getCurrentUser } from './auth';
import type { AuditStatus, RiskLevel, SourceType } from '@/lib/utils';

export interface AuditFilter {
  status?: AuditStatus;
  riskLevel?: RiskLevel;
  sourceType?: SourceType;
  overdueOnly?: boolean;
  keyword?: string;
}

export async function listAllAudits(filter: AuditFilter = {}) {
  const user = await requireUser(['MANAGEMENT', 'REVIEWER']);
  const where = buildWhere(filter);
  const rows = await prisma.auditItem.findMany({
    where,
    orderBy: { deadlineAt: 'asc' },
    include: {
      batch: { select: { id: true, batchNo: true, sourceType: true } },
      assignee: { select: { id: true, name: true, email: true, department: true } },
      reviewer: { select: { id: true, name: true, email: true } },
    },
  });
  return { user, audits: rows };
}

export async function listMyAudits(filter: AuditFilter = {}) {
  const user = await requireUser(['EXECUTOR', 'MANAGEMENT', 'REVIEWER']);
  const where = buildWhere({ ...filter, onlyMyId: user.role === 'EXECUTOR' ? user.id : undefined });
  const rows = await prisma.auditItem.findMany({
    where,
    orderBy: { deadlineAt: 'asc' },
    include: {
      batch: { select: { id: true, batchNo: true, sourceType: true } },
      assignee: { select: { id: true, name: true, email: true, department: true } },
      reviewer: { select: { id: true, name: true, email: true } },
    },
  });
  return { user, audits: rows };
}

function buildWhere(f: AuditFilter & { onlyMyId?: string }) {
  const now = new Date();
  const where: any = {};
  if (f.status) where.status = f.status;
  if (f.riskLevel) where.riskLevel = f.riskLevel;
  if (f.sourceType) where.sourceType = f.sourceType;
  if (f.onlyMyId) where.assigneeId = f.onlyMyId;
  if (f.overdueOnly) where.AND = [{ deadlineAt: { lt: now } }, { status: { notIn: ['CLOSED'] } }];
  if (f.keyword) {
    where.OR = [
      { title: { contains: f.keyword, mode: 'insensitive' } },
      { description: { contains: f.keyword, mode: 'insensitive' } },
    ];
  }
  return where;
}

export async function getAuditDetail(id: string) {
  const user = await requireUser();
  const audit = await prisma.auditItem.findUnique({
    where: { id },
    include: {
      batch: { select: { id: true, batchNo: true, sourceType: true, fileName: true, createdById: true } },
      assignee: { select: { id: true, name: true, email: true, department: true } },
      reviewer: { select: { id: true, name: true, email: true } },
      rectifications: { orderBy: { createdAt: 'desc' } },
      reviews: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!audit) return { user, audit: null as any, forbidden: false };

  const forbidden = user.role === 'EXECUTOR' && audit.assigneeId !== user.id;
  if (forbidden) {
    const sanitized = {
      ...audit,
      title: '无权限查看',
      description: '您没有权限查看该整改项的内容',
      assignee: null,
      reviewer: null,
      assigneeId: null,
      reviewerId: null,
      batch: { id: audit.batch.id, batchNo: '********', sourceType: null, fileName: null, createdById: null },
      rectifications: [],
      reviews: [],
      dispatchRule: '***',
      riskLevel: 'MEDIUM' as const,
      status: 'CREATED' as const,
      deadlineAt: new Date(),
      createdAt: new Date(),
      closedAt: null,
      closeReason: null,
      revisionCount: 0,
      firstTimePass: null,
    };
    return { user, audit: sanitized, forbidden: true };
  }
  return { user, audit, forbidden: false };
}

export async function submitRectification(auditId: string, description: string, fileNames: string[] = []) {
  const user = await requireUser(['EXECUTOR']);
  const audit = await prisma.auditItem.findUnique({ where: { id: auditId } });
  if (!audit || audit.assigneeId !== user.id) throw new Error('无权操作该整改项');

  await prisma.rectification.create({
    data: {
      id: `rect-${Math.random().toString(36).slice(2, 10)}`,
      auditId,
      submitterId: user.id,
      description,
      attachmentUrls: JSON.stringify(fileNames),
    },
  });
  await prisma.auditItem.update({
    where: { id: auditId },
    data: { status: 'PENDING_REVIEW', reviewerId: audit.reviewerId ?? 'rev-001' },
  });
  return { ok: true };
}

export async function submitReview(auditId: string, passed: boolean, comment: string) {
  const user = await requireUser(['REVIEWER', 'MANAGEMENT']);
  if (!passed && !comment.trim()) throw new Error('复核不通过必须填写意见');

  const prev = await prisma.auditItem.findUnique({ where: { id: auditId } });
  if (!prev) throw new Error('未找到整改项');

  await prisma.reviewComment.create({
    data: {
      id: `rvw-${Math.random().toString(36).slice(2, 10)}`,
      auditId,
      reviewerId: user.id,
      comment,
      passed,
    },
  });
  const revisionCount = prev.revisionCount + (passed ? 0 : 1);
  const firstTimePass = passed ? prev.revisionCount === 0 : null;
  await prisma.auditItem.update({
    where: { id: auditId },
    data: {
      status: passed ? 'CLOSED' : 'REJECTED',
      closedAt: passed ? new Date() : null,
      closeReason: passed ? '已完成整改' : null,
      revisionCount,
      firstTimePass: firstTimePass ?? prev.firstTimePass,
    },
  });
  return { ok: true };
}
