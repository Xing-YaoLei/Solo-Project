import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimelineService } from '../timeline/timeline.service';
import { CreateMaterialDto, UpdateMaterialDto, ResubmitMaterialDto } from './dto/materials.dto';
import { TimelineEventType, MaterialStatus } from '@legal/shared';

@Injectable()
export class MaterialsService {
  constructor(
    private prisma: PrismaService,
    private timelineService: TimelineService,
  ) {}

  async create(caseId: string, userId: string, dto: CreateMaterialDto) {
    const caseData = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseData) {
      throw new NotFoundException(`Case ${caseId} not found`);
    }

    const material = await this.prisma.caseMaterial.create({
      data: {
        caseId,
        name: dto.name,
        materialType: dto.materialType,
        status: MaterialStatus.PENDING,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize,
        pageTotal: dto.pageTotal,
        missingPages: dto.missingPages || [],
        uploadedBy: userId,
      },
    });

    const operator = await this.prisma.user.findUnique({ where: { id: userId } });

    await this.timelineService.addEvent({
      caseId,
      eventType: TimelineEventType.MATERIAL_UPLOADED,
      title: '材料上传',
      content: `上传材料: ${dto.name}`,
      operatorId: userId,
      operatorName: operator?.name || '',
    });

    return material;
  }

  async findAll(caseId: string) {
    const caseData = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseData) {
      throw new NotFoundException(`Case ${caseId} not found`);
    }

    return this.prisma.caseMaterial.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, userId: string, dto: UpdateMaterialDto) {
    const material = await this.prisma.caseMaterial.findUnique({ where: { id } });
    if (!material) {
      throw new NotFoundException(`Material ${id} not found`);
    }

    const updateData: Record<string, unknown> = { ...dto };
    if (dto.status === MaterialStatus.APPROVED || dto.status === MaterialStatus.REJECTED) {
      updateData.reviewedAt = new Date();
    }

    return this.prisma.caseMaterial.update({
      where: { id },
      data: updateData,
    });
  }

  async resubmit(id: string, userId: string, dto: ResubmitMaterialDto) {
    const material = await this.prisma.caseMaterial.findUnique({ where: { id } });
    if (!material) {
      throw new NotFoundException(`Material ${id} not found`);
    }

    const resubmitted = await this.prisma.caseMaterial.update({
      where: { id },
      data: {
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize,
        status: MaterialStatus.RESUBMITTED,
        version: material.version + 1,
        reviewNote: dto.reviewNote,
      },
    });

    const operator = await this.prisma.user.findUnique({ where: { id: userId } });

    await this.timelineService.addEvent({
      caseId: material.caseId,
      eventType: TimelineEventType.MATERIAL_RESUBMITTED,
      title: '材料重新提交',
      content: `材料「${material.name}」重新提交，版本: ${resubmitted.version}`,
      operatorId: userId,
      operatorName: operator?.name || '',
    });

    return resubmitted;
  }
}
