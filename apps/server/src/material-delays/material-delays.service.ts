import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDelayDto } from './dto/create-material-delay.dto';
import { UpdateMaterialDelayDto } from './dto/update-material-delay.dto';
import { QueryMaterialDelayDto } from './dto/query-material-delay.dto';
import { MaterialDelayStatus, LogAction } from '@prisma/client';

const STATUS_FLOW: Record<MaterialDelayStatus, MaterialDelayStatus[]> = {
  [MaterialDelayStatus.REPORTED]: [MaterialDelayStatus.CONFIRMED],
  [MaterialDelayStatus.CONFIRMED]: [MaterialDelayStatus.RESCHEDULED, MaterialDelayStatus.RESOLVED],
  [MaterialDelayStatus.RESCHEDULED]: [MaterialDelayStatus.RESOLVED],
  [MaterialDelayStatus.RESOLVED]: [MaterialDelayStatus.CLOSED],
  [MaterialDelayStatus.CLOSED]: [],
};

@Injectable()
export class MaterialDelaysService {
  constructor(private prisma: PrismaService) {}

  private calculateDelayDays(originalDate: Date, estimatedDate?: Date, actualDate?: Date): number | null {
    const endDate = actualDate || estimatedDate;
    if (!endDate) return null;
    const diffTime = endDate.getTime() - originalDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  async create(createDto: CreateMaterialDelayDto, userId: string) {
    const delayDays = this.calculateDelayDays(
      new Date(createDto.originalDate),
      createDto.estimatedDate ? new Date(createDto.estimatedDate) : undefined,
    );

    const result = await this.prisma.$transaction(async (prisma) => {
      const materialDelay = await prisma.materialDelay.create({
        data: {
          ...createDto,
          quantity: createDto.quantity ? createDto.quantity.toString() : undefined,
          delayDays,
          reportedById: userId,
        },
        include: {
          project: true,
          changeOrder: true,
          reportedBy: true,
          handledBy: true,
          history: true,
        },
      });

      await prisma.materialDelayLog.create({
        data: {
          materialDelayId: materialDelay.id,
          newStatus: MaterialDelayStatus.REPORTED,
          remark: '创建材料延期记录',
          operatorId: userId,
        },
      });

      await prisma.operationLog.create({
        data: {
          action: LogAction.CREATE,
          entityType: 'MaterialDelay',
          entityId: materialDelay.id,
          newValue: JSON.stringify(materialDelay),
          remark: '创建材料延期记录',
          operatorId: userId,
        },
      });

      return materialDelay;
    });

    return result;
  }

  async findAll(queryDto: QueryMaterialDelayDto) {
    const { page = 1, pageSize = 10, projectId, status, keyword } = queryDto;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (keyword) {
      where.OR = [
        { materialName: { contains: keyword } },
        { reason: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.materialDelay.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
          changeOrder: { select: { id: true, orderNo: true, title: true } },
          reportedBy: { select: { id: true, name: true } },
          handledBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.materialDelay.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const materialDelay = await this.prisma.materialDelay.findUnique({
      where: { id },
      include: {
        project: true,
        changeOrder: true,
        reportedBy: { select: { id: true, name: true, email: true } },
        handledBy: { select: { id: true, name: true, email: true } },
        history: {
          orderBy: { createdAt: 'desc' },
          include: {
            operator: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!materialDelay) {
      throw new NotFoundException('材料延期记录不存在');
    }

    return materialDelay;
  }

  async update(id: string, updateDto: UpdateMaterialDelayDto, userId: string) {
    const existing = await this.prisma.materialDelay.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('材料延期记录不存在');
    }

    const originalDate = updateDto.originalDate ? new Date(updateDto.originalDate) : existing.originalDate;
    const estimatedDate = updateDto.estimatedDate ? new Date(updateDto.estimatedDate) : existing.estimatedDate;
    const actualDate = updateDto.actualDate ? new Date(updateDto.actualDate) : existing.actualDate;

    const delayDays = this.calculateDelayDays(
      originalDate,
      estimatedDate || undefined,
      actualDate || undefined,
    );

    const result = await this.prisma.$transaction(async (prisma) => {
      const updated = await prisma.materialDelay.update({
        where: { id },
        data: {
          ...updateDto,
          quantity: updateDto.quantity ? updateDto.quantity.toString() : undefined,
          delayDays,
        },
        include: {
          project: true,
          changeOrder: true,
          reportedBy: true,
          handledBy: true,
        },
      });

      await prisma.operationLog.create({
        data: {
          action: LogAction.UPDATE,
          entityType: 'MaterialDelay',
          entityId: id,
          oldValue: JSON.stringify(existing),
          newValue: JSON.stringify(updated),
          remark: '更新材料延期记录',
          operatorId: userId,
        },
      });

      return updated;
    });

    return result;
  }

  async updateStatus(id: string, newStatus: MaterialDelayStatus, userId: string, remark?: string) {
    const existing = await this.prisma.materialDelay.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('材料延期记录不存在');
    }

    const allowedTransitions = STATUS_FLOW[existing.status];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `状态变更不允许: ${existing.status} -> ${newStatus}`,
      );
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      const updated = await prisma.materialDelay.update({
        where: { id },
        data: {
          status: newStatus,
          handledById: userId,
        },
        include: {
          project: true,
          changeOrder: true,
          reportedBy: true,
          handledBy: true,
        },
      });

      await prisma.materialDelayLog.create({
        data: {
          materialDelayId: id,
          oldStatus: existing.status,
          newStatus,
          remark,
          operatorId: userId,
        },
      });

      await prisma.operationLog.create({
        data: {
          action: LogAction.STATUS_CHANGE,
          entityType: 'MaterialDelay',
          entityId: id,
          oldValue: existing.status,
          newValue: newStatus,
          remark: remark || `状态变更: ${existing.status} -> ${newStatus}`,
          operatorId: userId,
        },
      });

      return updated;
    });

    return result;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.materialDelay.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('材料延期记录不存在');
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.materialDelayLog.deleteMany({ where: { materialDelayId: id } });
      await prisma.materialDelay.delete({ where: { id } });

      await prisma.operationLog.create({
        data: {
          action: LogAction.DELETE,
          entityType: 'MaterialDelay',
          entityId: id,
          oldValue: JSON.stringify(existing),
          remark: '删除材料延期记录',
          operatorId: userId,
        },
      });
    });

    return { message: '删除成功' };
  }
}
