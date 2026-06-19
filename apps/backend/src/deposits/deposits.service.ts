import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DepositStatus } from '@prisma/client';

@Injectable()
export class DepositsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    pageSize?: number;
    orderId?: number;
    status?: DepositStatus;
    keyword?: string;
    propertyId?: number;
  }) {
    const { page = 1, pageSize = 10, orderId, status, keyword, propertyId } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (orderId) where.orderId = orderId;
    if (status) where.status = status;
    if (propertyId) {
      where.order = { propertyId };
    }

    const [deposits, total] = await Promise.all([
      this.prisma.deposit.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderNo: true,
              guestName: true,
              property: { select: { name: true } },
              room: { select: { roomNumber: true } },
            },
          },
        },
      }),
      this.prisma.deposit.count({ where }),
    ]);

    return { list: deposits, total, page, pageSize };
  }

  async findOne(id: number) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { id },
      include: {
        order: true,
        room: true,
      },
    });

    if (!deposit) {
      throw new NotFoundException('押金记录不存在');
    }

    return deposit;
  }

  async create(data: any) {
    return this.prisma.deposit.create({
      data,
    });
  }

  async update(id: number, data: any) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id } });
    if (!deposit) {
      throw new NotFoundException('押金记录不存在');
    }

    return this.prisma.deposit.update({
      where: { id },
      data,
    });
  }

  async markPaid(id: number, paidAmount: number, paymentMethod?: string) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id } });
    if (!deposit) {
      throw new NotFoundException('押金记录不存在');
    }

    return this.prisma.deposit.update({
      where: { id },
      data: {
        status: DepositStatus.PAID,
        paidAmount,
        paymentMethod,
        paidAt: new Date(),
      },
    });
  }

  async refund(id: number, refundAmount: number, remarks?: string) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id } });
    if (!deposit) {
      throw new NotFoundException('押金记录不存在');
    }

    const isFullRefund = refundAmount >= deposit.paidAmount;

    return this.prisma.deposit.update({
      where: { id },
      data: {
        status: isFullRefund ? DepositStatus.REFUNDED : DepositStatus.PARTIAL_REFUNDED,
        refundAmount,
        refundedAt: new Date(),
        remarks,
      },
    });
  }

  async deduct(id: number, deductionReason: string, deductionAmount?: number) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id } });
    if (!deposit) {
      throw new NotFoundException('押金记录不存在');
    }

    const refundAmount = deductionAmount 
      ? deposit.paidAmount - deductionAmount 
      : 0;

    return this.prisma.deposit.update({
      where: { id },
      data: {
        status: DepositStatus.DEDUCTED,
        refundAmount,
        refundedAt: new Date(),
        deductionReason,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.deposit.delete({ where: { id } });
  }
}
