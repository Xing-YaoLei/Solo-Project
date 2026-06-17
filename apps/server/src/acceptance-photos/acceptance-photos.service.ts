import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcceptancePhotoDto } from './dto/create-acceptance-photo.dto';
import { UpdateAcceptancePhotoDto } from './dto/update-acceptance-photo.dto';
import { ReviewDto } from './dto/review.dto';
import { AcceptanceStatus, LogAction } from '@prisma/client';

@Injectable()
export class AcceptancePhotosService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateAcceptancePhotoDto, userId: string) {
    const changeOrder = await this.prisma.designChangeOrder.findUnique({
      where: { id: createDto.changeOrderId },
    });

    if (!changeOrder) {
      throw new NotFoundException('设计变更单不存在');
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      const photo = await prisma.acceptancePhoto.create({
        data: {
          ...createDto,
          uploaderId: userId,
        },
        include: {
          changeOrder: { select: { id: true, orderNo: true, title: true } },
          uploader: { select: { id: true, name: true } },
          reviewer: { select: { id: true, name: true } },
        },
      });

      await prisma.operationLog.create({
        data: {
          action: LogAction.CREATE,
          entityType: 'AcceptancePhoto',
          entityId: photo.id,
          newValue: JSON.stringify(photo),
          remark: '上传验收照片',
          operatorId: userId,
        },
      });

      return photo;
    });

    return result;
  }

  async findAll(changeOrderId?: string, status?: AcceptanceStatus) {
    const where: any = {};
    if (changeOrderId) where.changeOrderId = changeOrderId;
    if (status) where.status = status;

    return this.prisma.acceptancePhoto.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        changeOrder: { select: { id: true, orderNo: true, title: true } },
        uploader: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
      },
    });
  }

  async findByChangeOrder(changeOrderId: string) {
    return this.prisma.acceptancePhoto.findMany({
      where: { changeOrderId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: string) {
    const photo = await this.prisma.acceptancePhoto.findUnique({
      where: { id },
      include: {
        changeOrder: true,
        uploader: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!photo) {
      throw new NotFoundException('验收照片不存在');
    }

    return photo;
  }

  async update(id: string, updateDto: UpdateAcceptancePhotoDto, userId: string) {
    const existing = await this.prisma.acceptancePhoto.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('验收照片不存在');
    }

    if (existing.status !== AcceptanceStatus.PENDING) {
      throw new BadRequestException('只有待审核状态的照片可以修改');
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      const updated = await prisma.acceptancePhoto.update({
        where: { id },
        data: updateDto,
        include: {
          changeOrder: { select: { id: true, orderNo: true, title: true } },
          uploader: { select: { id: true, name: true } },
          reviewer: { select: { id: true, name: true } },
        },
      });

      await prisma.operationLog.create({
        data: {
          action: LogAction.UPDATE,
          entityType: 'AcceptancePhoto',
          entityId: id,
          oldValue: JSON.stringify(existing),
          newValue: JSON.stringify(updated),
          remark: '更新验收照片',
          operatorId: userId,
        },
      });

      return updated;
    });

    return result;
  }

  async review(id: string, reviewDto: ReviewDto, userId: string) {
    const existing = await this.prisma.acceptancePhoto.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('验收照片不存在');
    }

    if (existing.status !== AcceptanceStatus.PENDING) {
      throw new BadRequestException('只有待审核状态的照片可以审核');
    }

    const { status, remark } = reviewDto;

    if (status === AcceptanceStatus.PENDING) {
      throw new BadRequestException('审核状态不能设置为待审核');
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      const updated = await prisma.acceptancePhoto.update({
        where: { id },
        data: {
          status,
          reviewRemark: remark,
          reviewedById: userId,
          reviewedAt: new Date(),
        },
        include: {
          changeOrder: { select: { id: true, orderNo: true, title: true } },
          uploader: { select: { id: true, name: true } },
          reviewer: { select: { id: true, name: true } },
        },
      });

      await prisma.operationLog.create({
        data: {
          action: LogAction.STATUS_CHANGE,
          entityType: 'AcceptancePhoto',
          entityId: id,
          oldValue: existing.status,
          newValue: status,
          remark: remark || `审核结果: ${status}`,
          operatorId: userId,
        },
      });

      return updated;
    });

    return result;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.acceptancePhoto.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('验收照片不存在');
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.acceptancePhoto.delete({ where: { id } });

      await prisma.operationLog.create({
        data: {
          action: LogAction.DELETE,
          entityType: 'AcceptancePhoto',
          entityId: id,
          oldValue: JSON.stringify(existing),
          remark: '删除验收照片',
          operatorId: userId,
        },
      });
    });

    return { message: '删除成功' };
  }
}
