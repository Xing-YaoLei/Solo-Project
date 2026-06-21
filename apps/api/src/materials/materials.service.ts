import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimelineService } from '../timeline/timeline.service';
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  ResubmitMaterialDto,
  MarkMissingPagesDto,
  AddMissingMaterialDto,
} from './dto/materials.dto';
import {
  TimelineEventType,
  MaterialStatus,
} from '@legal/shared';

@Injectable()
export class MaterialsService {
  constructor(
    private prisma: PrismaService,
    private timelineService: TimelineService,
  ) {}

  async create(caseId: string, userId: string, dto: CreateMaterialDto) {
    const caseData = await this.prisma.case.findUnique({
      where: { id: caseId },
    });
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

    const operator = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    await this.timelineService.addEvent({
      caseId,
      eventType: TimelineEventType.MATERIAL_UPLOADED,
      title: '材料上传',
      content: `上传材料: ${dto.name}${dto.pageTotal ? ` (共${dto.pageTotal}页)` : ''}`,
      operatorId: userId,
      operatorName: operator?.name || '',
    });

    return this.toDTO(material);
  }

  private toDTO(m: any) {
    return {
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
    };
  }

  async findAll(caseId: string) {
    const caseData = await this.prisma.case.findUnique({
      where: { id: caseId },
    });
    if (!caseData) {
      throw new NotFoundException(`Case ${caseId} not found`);
    }

    const list = await this.prisma.caseMaterial.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((m) => this.toDTO(m));
  }

  async approve(id: string, userId: string, note?: string) {
    const material = await this.prisma.caseMaterial.findUnique({
      where: { id },
    });
    if (!material) {
      throw new NotFoundException(`Material ${id} not found`);
    }
    const updated = await this.prisma.caseMaterial.update({
      where: { id },
      data: {
        status: MaterialStatus.APPROVED,
        reviewedAt: new Date(),
        reviewNote: note || material.reviewNote || '材料审核通过',
      },
    });
    const operator = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    await this.timelineService.addEvent({
      caseId: updated.caseId,
      eventType: TimelineEventType.COMMUNICATION,
      title: '材料审核通过',
      content: `材料「${material.name}」审核通过${note ? `：${note}` : ''}`,
      operatorId: userId,
      operatorName: operator?.name || '',
    });
    return this.toDTO(updated);
  }

  async reject(id: string, userId: string, note?: string) {
    const material = await this.prisma.caseMaterial.findUnique({
      where: { id },
    });
    if (!material) {
      throw new NotFoundException(`Material ${id} not found`);
    }
    const updated = await this.prisma.caseMaterial.update({
      where: { id },
      data: {
        status: MaterialStatus.REJECTED,
        reviewedAt: new Date(),
        reviewNote: note || '材料不符合要求',
      },
    });
    const operator = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    await this.timelineService.addEvent({
      caseId: updated.caseId,
      eventType: TimelineEventType.MATERIAL_INCOMPLETE_NOTICE,
      title: '材料审核驳回',
      content: `材料「${material.name}」被驳回${note ? `：${note}` : '：需重新提交'}`,
      operatorId: userId,
      operatorName: operator?.name || '',
    });
    return this.toDTO(updated);
  }

  async update(id: string, userId: string, dto: UpdateMaterialDto) {
    const material = await this.prisma.caseMaterial.findUnique({
      where: { id },
    });
    if (!material) {
      throw new NotFoundException(`Material ${id} not found`);
    }

    const updateData: Record<string, unknown> = { ...dto };
    if (
      dto.status === MaterialStatus.APPROVED ||
      dto.status === MaterialStatus.REJECTED
    ) {
      updateData.reviewedAt = new Date();
    }

    const updated = await this.prisma.caseMaterial.update({
      where: { id },
      data: updateData,
    });
    return this.toDTO(updated);
  }

  async resubmit(
    id: string,
    userId: string,
    dto: ResubmitMaterialDto,
  ) {
    const material = await this.prisma.caseMaterial.findUnique({
      where: { id },
    });
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

    const operator = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    await this.timelineService.addEvent({
      caseId: material.caseId,
      eventType: TimelineEventType.MATERIAL_RESUBMITTED,
      title: '材料重新提交',
      content: `材料「${material.name}」重新提交，新版本: v${resubmitted.version}`,
      operatorId: userId,
      operatorName: operator?.name || '',
      metadata: { version: resubmitted.version, oldVersion: material.version },
    });

    return this.toDTO(resubmitted);
  }

  async markMissingPages(
    id: string,
    userId: string,
    dto: MarkMissingPagesDto,
  ) {
    const material = await this.prisma.caseMaterial.findUnique({
      where: { id },
    });
    if (!material) {
      throw new NotFoundException(`Material ${id} not found`);
    }

    const updated = await this.prisma.caseMaterial.update({
      where: { id },
      data: {
        missingPages: dto.missingPages,
        status: MaterialStatus.MISSING,
      },
    });

    const operator = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    await this.timelineService.addEvent({
      caseId: material.caseId,
      eventType: TimelineEventType.MATERIAL_INCOMPLETE_NOTICE,
      title: '材料缺页提醒',
      content: `材料「${material.name}」第 ${dto.missingPages.join(', ')} 页缺失${dto.note ? `，${dto.note}` : ''}，请尽快补传`,
      operatorId: userId,
      operatorName: operator?.name || '',
      metadata: { missingPages: dto.missingPages, materialId: id },
    });

    return this.toDTO(updated);
  }

  async addMissingMaterial(
    caseId: string,
    userId: string,
    dto: AddMissingMaterialDto,
  ) {
    const caseData = await this.prisma.case.findUnique({
      where: { id: caseId },
    });
    if (!caseData) {
      throw new NotFoundException(`Case ${caseId} not found`);
    }

    const material = await this.prisma.caseMaterial.create({
      data: {
        caseId,
        name: dto.name,
        materialType: dto.materialType,
        status: MaterialStatus.MISSING,
        fileUrl: '',
        fileSize: 0,
        pageTotal: 0,
        missingPages: [],
        uploadedBy: userId,
      },
    });

    const operator = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    await this.timelineService.addEvent({
      caseId,
      eventType: TimelineEventType.MATERIAL_INCOMPLETE_NOTICE,
      title: '新增待补材料',
      content: `需补充材料：${dto.name}${dto.note ? `（${dto.note}）` : ''}`,
      operatorId: userId,
      operatorName: operator?.name || '',
      metadata: { materialId: material.id, note: dto.note },
    });

    return this.toDTO(material);
  }
}
