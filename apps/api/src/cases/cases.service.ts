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
import { CaseStatus, TimelineEventType } from '@legal/shared';

@Injectable()
export class CasesService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private timelineService: TimelineService,
    private conflictCheckService: ConflictCheckService,
  ) {}

  async create(userId: string, dto: CreateCaseDto) {
    let client = await this.prisma.client.findFirst({
      where: { idNumber: dto.clientIdNumber },
    });

    if (!client) {
      const user = await this.prisma.user.create({
        data: {
          name: dto.clientName,
          email: `${dto.clientIdNumber}@temp.legal`,
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
        status: CaseStatus.MATERIAL_SUBMITTED,
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
          uploadedBy: userId,
        })),
      });
    }

    await this.timelineService.addEvent({
      caseId: caseData.id,
      eventType: TimelineEventType.CASE_CREATED,
      title: '案件创建',
      content: `案件「${dto.title}」已创建，状态为材料已提交`,
      operatorId: userId,
      operatorName: '',
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
    const { status, caseType, lawyerId, clientId, page = 1, limit = 20 } = params;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (caseType) where.caseType = caseType;
    if (lawyerId) where.lawyerId = lawyerId;
    if (clientId) where.clientId = clientId;

    const [items, total] = await Promise.all([
      this.prisma.case.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { include: { user: true } },
          lawyer: true,
          assistant: true,
        },
      }),
      this.prisma.case.count({ where }),
    ]);

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
        materials: true,
        conflictChecks: { orderBy: { checkedAt: 'desc' } },
        timelineEvents: { orderBy: { createdAt: 'desc' } },
        invoices: true,
      },
    });

    if (!caseData) {
      throw new NotFoundException(`Case ${id} not found`);
    }

    return caseData;
  }

  async update(id: string, dto: UpdateCaseDto) {
    await this.findOne(id);

    return this.prisma.case.update({
      where: { id },
      data: dto,
    });
  }

  async assistantReview(id: string, userId: string, dto: AssistantReviewDto) {
    const caseData = await this.findOne(id);

    if (caseData.status !== CaseStatus.MATERIAL_SUBMITTED && caseData.status !== CaseStatus.MATERIAL_INCOMPLETE) {
      throw new BadRequestException('Case is not in a reviewable state');
    }

    const operator = await this.prisma.user.findUnique({ where: { id: userId } });

    for (const materialId of dto.materialsApproved) {
      await this.prisma.caseMaterial.update({
        where: { id: materialId },
        data: { status: 'APPROVED', reviewedAt: new Date(), reviewNote: dto.reviewNote },
      });
    }

    for (const materialId of dto.materialsRejected) {
      await this.prisma.caseMaterial.update({
        where: { id: materialId },
        data: { status: 'REJECTED', reviewedAt: new Date(), reviewNote: dto.reviewNote },
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
      (m) => m.status === 'MISSING' || m.status === 'REJECTED' || m.status === 'PENDING',
    );

    if (!dto.identityVerified || !dto.evidenceChecklistComplete || hasIncomplete) {
      await this.prisma.case.update({
        where: { id },
        data: { status: CaseStatus.MATERIAL_INCOMPLETE },
      });

      await this.timelineService.addEvent({
        caseId: id,
        eventType: TimelineEventType.MATERIAL_INCOMPLETE_NOTICE,
        title: '材料不完整通知',
        content: `身份验证: ${dto.identityVerified ? '通过' : '未通过'}, 证据清单: ${dto.evidenceChecklistComplete ? '完整' : '不完整'}`,
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
      data: { status: CaseStatus.CONFLICT_CHECKING },
    });

    await this.timelineService.addEvent({
      caseId: id,
      eventType: TimelineEventType.IDENTITY_VERIFIED,
      title: '身份验证通过',
      content: '当事人身份已验证，证据清单完整，进入利益冲突检查',
      operatorId: userId,
      operatorName: operator?.name || '',
    });

    await this.conflictCheckService.performCheck(id, userId);

    return this.findOne(id);
  }

  async lawyerSupplement(id: string, userId: string, dto: LawyerSupplementDto) {
    const caseData = await this.findOne(id);

    if (caseData.status !== CaseStatus.CONFLICT_PASSED && caseData.status !== CaseStatus.LAWYER_SUPPLEMENTING) {
      throw new BadRequestException('Case is not in lawyer supplementable state');
    }

    const operator = await this.prisma.user.findUnique({ where: { id: userId } });

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

    await this.prisma.case.update({
      where: { id },
      data: updateData,
    });

    await this.timelineService.addEvent({
      caseId: id,
      eventType: TimelineEventType.CASE_STAGE_SET,
      title: '案件阶段设定',
      content: `案件阶段设为: ${dto.caseStage}`,
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
      content: `费用类型: ${dto.feeType}, 金额: ${dto.feeAmount}${dto.feeNote ? `, 备注: ${dto.feeNote}` : ''}`,
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

    return this.prisma.case.update({
      where: { id },
      data: { status: CaseStatus.CASE_ARCHIVED },
    });
  }
}
