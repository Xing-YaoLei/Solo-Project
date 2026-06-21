import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TimelineService } from '../timeline/timeline.service';
import { ConflictCheckService } from '../conflict-check/conflict-check.service';
import {
  CreateCaseDto,
  UpdateCaseDto,
  AssistantReviewDto,
  LawyerSupplementDto,
} from './dto/cases.dto';
import {
  CaseStatus,
  TimelineEventType,
  FeeType,
  PaymentStatus,
} from '@legal/shared';

@Injectable()
export class CasesService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private timelineService: TimelineService,
    private conflictCheckService: ConflictCheckService,
  ) {}

  private toListItem(caseData: any) {
    const invoices: any[] = caseData.invoices || [];
    const latestInvoice = invoices.length > 0 ? invoices[0] : null;
    const paymentStatus = latestInvoice?.paymentStatus || PaymentStatus.UNPAID;
    const feeAmount = caseData.feeAmount ? Number(caseData.feeAmount) : undefined;
    const totalAmount = invoices.reduce(
      (sum: number, inv: any) => sum + Number(inv.amount),
      0,
    );

    return {
      id: caseData.id,
      title: caseData.title,
      caseType: caseData.caseType,
      status: caseData.status,
      clientName: caseData.client?.user?.name || '',
      clientPhone: caseData.client?.user?.phone || '',
      clientIdNumber: caseData.client?.idNumber || '',
      clientEmail: caseData.client?.user?.email || '',
      opposingPartyName: caseData.opposingPartyName,
      opposingPartyIdNumber: caseData.opposingPartyIdNumber,
      lawyerName: caseData.lawyer?.name,
      lawyerId: caseData.lawyerId,
      assistantName: caseData.assistant?.name,
      assistantId: caseData.assistantId,
      createdAt: caseData.createdAt.toISOString(),
      updatedAt: caseData.updatedAt.toISOString(),
      nextTrialDate: caseData.trialDate
        ? caseData.trialDate.toISOString()
        : undefined,
      trialLocation: caseData.trialLocation,
      feeAmount,
      feeType: caseData.feeType,
      feeNote: caseData.feeNote,
      caseStage: caseData.caseStage,
      description: caseData.description,
      riskWarnings: caseData.riskWarnings || [],
      paymentStatus,
      totalInvoiceAmount: totalAmount || undefined,
      invoiceCount: invoices.length,
    };
  }

  private toDetail(caseData: any) {
    const base = this.toListItem(caseData);
    const materials = (caseData.materials || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      type: m.materialType,
      status: m.status,
      fileUrl: m.fileUrl,
      fileSize: m.fileSize,
      pageTotal: m.pageTotal,
      missingPages: m.missingPages || [],
      version: m.version,
      uploadedAt: m.createdAt.toISOString(),
      reviewedAt: m.reviewedAt ? m.reviewedAt.toISOString() : undefined,
      reviewNote: m.reviewNote,
    }));
    const timeline = (caseData.timelineEvents || []).map((t: any) => ({
      id: t.id,
      caseId: t.caseId,
      eventType: t.eventType,
      title: t.title,
      content: t.content,
      operatorId: t.operatorId,
      operatorName: t.operatorName,
      metadata: t.metadata,
      createdAt: t.createdAt.toISOString(),
    }));
    const conflictChecks = (caseData.conflictChecks || []).map((c: any) => ({
      id: c.id,
      caseId: c.caseId,
      checkedBy: c.checkedBy,
      hasConflict: c.hasConflict,
      conflictDetails: c.conflictDetails,
      conflictingCaseIds: c.conflictingCaseIds || [],
      checkedAt: c.checkedAt.toISOString(),
      archivedAt: c.archivedAt ? c.archivedAt.toISOString() : undefined,
      archivePath: c.archivePath,
    }));
    return {
      ...base,
      materials,
      timeline,
      conflictChecks,
    };
  }

  async create(userId: string, dto: CreateCaseDto) {
    let client = await this.prisma.client.findFirst({
      where: { idNumber: dto.clientIdNumber },
    });

    if (!client) {
      const user = await this.prisma.user.create({
        data: {
          name: dto.clientName,
          email: dto.clientEmail || `${dto.clientIdNumber}@temp.legal`,
          phone: dto.clientPhone,
          passwordHash: '',
          role: 'CLIENT',
        },
      });
      client = await this.prisma.client.create({
        data: {
          userId: user.id,
          idNumber: dto.clientIdNumber,
        },
      });
    }

    const caseData = await this.prisma.case.create({
      data: {
        title: dto.title,
        caseType: dto.caseType,
        status: CaseStatus.ASSISTANT_REVIEWING,
        description: dto.description,
        clientId: client.id,
        opposingPartyName: dto.opposingPartyName,
        opposingPartyIdNumber: dto.opposingPartyIdNumber,
      },
    });

    if (dto.materials && dto.materials.length > 0) {
      await this.prisma.caseMaterial.createMany({
        data: dto.materials.map((m) => ({
          caseId: caseData.id,
          name: m.name,
          materialType: m.type,
          status: 'PENDING',
          fileUrl: m.fileUrl,
          fileSize: m.fileSize,
          pageTotal: m.pageTotal,
          missingPages: m.missingPages || [],
          uploadedBy: userId || client!.userId,
        })),
      });
    }

    await this.timelineService.addEvent({
      caseId: caseData.id,
      eventType: TimelineEventType.CASE_CREATED,
      title: '案件创建',
      content: `案件「${dto.title}」已创建，客户 ${dto.clientName} 提交委托材料`,
      operatorId: userId || client!.userId,
      operatorName: dto.clientName,
    });

    return this.findOne(caseData.id);
  }

  async findAll(params: {
    status?: string;
    caseType?: string;
    lawyerId?: string;
    clientId?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      status,
      caseType,
      lawyerId,
      clientId,
      page = 1,
      limit = 20,
    } = params;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (caseType) where.caseType = caseType;
    if (lawyerId) where.lawyerId = lawyerId;
    if (clientId) where.clientId = clientId;

    const [rawItems, total] = await Promise.all([
      this.prisma.case.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { include: { user: true } },
          lawyer: true,
          assistant: true,
          invoices: true,
        },
      }),
      this.prisma.case.count({ where }),
    ]);

    const items = rawItems.map((c) => this.toListItem(c));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const caseData = await this.prisma.case.findUnique({
      where: { id },
      include: {
        client: { include: { user: true } },
        lawyer: true,
        assistant: true,
        materials: { orderBy: { createdAt: 'desc' } },
        conflictChecks: { orderBy: { checkedAt: 'desc' } },
        timelineEvents: { orderBy: { createdAt: 'desc' } },
        invoices: true,
      },
    });

    if (!caseData) {
      throw new NotFoundException(`Case ${id} not found`);
    }

    return this.toDetail(caseData);
  }

  async update(id: string, dto: UpdateCaseDto) {
    await this.findOne(id);
    await this.prisma.case.update({ where: { id }, data: dto });
    return this.findOne(id);
  }

  async assistantReview(
    id: string,
    userId: string,
    dto: AssistantReviewDto,
  ) {
    const caseData = await this.findOne(id);

    if (
      caseData.status !== CaseStatus.ASSISTANT_REVIEWING &&
      caseData.status !== CaseStatus.MATERIAL_INCOMPLETE &&
      caseData.status !== CaseStatus.MATERIAL_SUBMITTED
    ) {
      throw new BadRequestException('Case is not in a reviewable state');
    }

    const operator = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    for (const materialId of dto.materialsApproved) {
      await this.prisma.caseMaterial.update({
        where: { id: materialId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewNote: dto.reviewNote,
        },
      });
    }

    for (const materialId of dto.materialsRejected) {
      await this.prisma.caseMaterial.update({
        where: { id: materialId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewNote: dto.reviewNote,
        },
      });
    }

    for (const missing of dto.materialsMissing) {
      if (missing.materialId) {
        await this.prisma.caseMaterial.update({
          where: { id: missing.materialId },
          data: {
            status: 'MISSING',
            missingPages: missing.missingPages || [],
            reviewNote: missing.description,
          },
        });
      } else {
        await this.prisma.caseMaterial.create({
          data: {
            caseId: id,
            name: missing.description,
            materialType: missing.materialType,
            status: 'MISSING',
            fileUrl: '',
            fileSize: 0,
            missingPages: missing.missingPages || [],
            uploadedBy: userId,
          },
        });
      }
    }

    const allMaterials = await this.prisma.caseMaterial.findMany({
      where: { caseId: id },
    });

    const hasIncomplete = allMaterials.some(
      (m) =>
        m.status === 'MISSING' ||
        m.status === 'REJECTED' ||
        m.status === 'PENDING',
    );

    if (
      !dto.identityVerified ||
      !dto.evidenceChecklistComplete ||
      hasIncomplete
    ) {
      await this.prisma.case.update({
        where: { id },
        data: {
          status: CaseStatus.MATERIAL_INCOMPLETE,
          assistantId: userId,
        },
      });

      await this.timelineService.addEvent({
        caseId: id,
        eventType: TimelineEventType.MATERIAL_INCOMPLETE_NOTICE,
        title: '材料不完整通知',
        content: `身份验证: ${dto.identityVerified ? '通过' : '未通过'}, 证据清单: ${dto.evidenceChecklistComplete ? '完整' : '不完整'}, 审核备注: ${dto.reviewNote || dto.identityNote || dto.evidenceNote || '请按要求补传'}`,
        operatorId: userId,
        operatorName: operator?.name || '',
      });

      await this.redis.set(
        `notification:material_incomplete:${id}`,
        JSON.stringify({ caseId: id, reviewedBy: userId }),
        86400,
      );

      return this.findOne(id);
    }

    await this.prisma.case.update({
      where: { id },
      data: {
        status: CaseStatus.CONFLICT_CHECKING,
        assistantId: userId,
      },
    });

    await this.timelineService.addEvent({
      caseId: id,
      eventType: TimelineEventType.IDENTITY_VERIFIED,
      title: '身份验证通过',
      content: `当事人身份已核验，证据清单完整（备注: ${dto.identityNote || dto.evidenceNote || '无'}），进入利益冲突检查`,
      operatorId: userId,
      operatorName: operator?.name || '',
    });

    await this.conflictCheckService.performCheck(id, userId);

    return this.findOne(id);
  }

  async lawyerSupplement(
    id: string,
    userId: string,
    dto: LawyerSupplementDto,
  ) {
    const caseData = await this.findOne(id);

    if (
      caseData.status !== CaseStatus.CONFLICT_PASSED &&
      caseData.status !== CaseStatus.LAWYER_SUPPLEMENTING &&
      caseData.status !== CaseStatus.CASE_ACTIVE
    ) {
      throw new BadRequestException(
        'Case is not in lawyer supplementable state',
      );
    }

    const operator = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const updateData: Record<string, unknown> = {
      caseStage: dto.caseStage,
      feeType: dto.feeType,
      feeAmount: dto.feeAmount,
      feeNote: dto.feeNote,
      riskWarnings: dto.riskWarnings,
      status: CaseStatus.CASE_ACTIVE,
      lawyerId: userId,
    };

    if (dto.trialDate) {
      updateData.trialDate = new Date(dto.trialDate);
      updateData.trialLocation = dto.trialLocation;
    }

    await this.prisma.case.update({ where: { id }, data: updateData });

    const invoices = await this.prisma.invoice.findMany({
      where: { caseId: id },
    });
    if (invoices.length === 0) {
      await this.prisma.invoice.create({
        data: {
          caseId: id,
          amount: dto.feeAmount,
          paymentStatus: PaymentStatus.UNPAID,
          note: `委托费用: ${FeeType[dto.feeType]} - ${dto.feeNote || ''}`,
        },
      });
    }

    await this.timelineService.addEvent({
      caseId: id,
      eventType: TimelineEventType.CASE_STAGE_SET,
      title: '案件阶段设定',
      content: `案件阶段设为: ${dto.caseStage}${dto.supplementNote ? `，备注: ${dto.supplementNote}` : ''}`,
      operatorId: userId,
      operatorName: operator?.name || '',
    });

    if (dto.trialDate) {
      await this.timelineService.addEvent({
        caseId: id,
        eventType: TimelineEventType.TRIAL_SCHEDULED,
        title: '庭审安排',
        content: `庭审日期: ${dto.trialDate}${dto.trialLocation ? `, 地点: ${dto.trialLocation}` : ''}`,
        operatorId: userId,
        operatorName: operator?.name || '',
      });
    }

    await this.timelineService.addEvent({
      caseId: id,
      eventType: TimelineEventType.FEE_AGREED,
      title: '费用约定',
      content: `费用类型: ${dto.feeType}, 金额: ¥${dto.feeAmount.toLocaleString()}${dto.feeNote ? `, 备注: ${dto.feeNote}` : ''}`,
      operatorId: userId,
      operatorName: operator?.name || '',
    });

    if (dto.riskWarnings && dto.riskWarnings.length > 0) {
      await this.timelineService.addEvent({
        caseId: id,
        eventType: TimelineEventType.RISK_WARNING,
        title: '风险提示',
        content: dto.riskWarnings.join('; '),
        operatorId: userId,
        operatorName: operator?.name || '',
      });
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.case.update({
      where: { id },
      data: { status: CaseStatus.CASE_ARCHIVED },
    });
    return this.findOne(id);
  }
}
