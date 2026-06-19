import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DepositStatus } from '@prisma/client';

@Injectable()
export class DepositsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    status?: DepositStatus;
    bookingId?: string;
  }) {
    return this.prisma.deposit.findMany({
      where: {
        status: params.status,
        bookingId: params.bookingId,
      },
      include: {
        booking: {
          include: {
            property: { select: { id: true, name: true, roomNumber: true } },
          },
        },
        auditLogs: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            property: true,
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          include: { deposit: false },
        },
      },
    });

    if (!deposit) {
      throw new NotFoundException('押金记录不存在');
    }

    return deposit;
  }

  async create(data: {
    bookingId: string;
    amount: number;
    status?: DepositStatus;
    notes?: string;
    changedById?: string;
  }) {
    const { changedById, ...depositData } = data;
    
    const deposit = await this.prisma.deposit.create({
      data: depositData,
    });

    await this.prisma.depositAuditLog.create({
      data: {
        depositId: deposit.id,
        fieldName: 'amount',
        oldValue: null,
        newValue: data.amount.toString(),
        changedById: data.changedById,
        changeReason: '创建押金记录',
      },
    });

    return deposit;
  }

  async update(
    id: string,
    data: {
      amount?: number;
      status?: DepositStatus;
      refundAmount?: number;
      deductAmount?: number;
      deductReason?: string;
      refundedAt?: Date;
      notes?: string;
    },
    changedById?: string,
    changeReason?: string,
  ) {
    const existing = await this.prisma.deposit.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('押金记录不存在');
    }

    const deposit = await this.prisma.deposit.update({
      where: { id },
      data,
    });

    const auditLogs = [];
    
    if (data.amount !== undefined && data.amount !== existing.amount.toNumber()) {
      auditLogs.push({
        depositId: id,
        fieldName: 'amount',
        oldValue: existing.amount.toString(),
        newValue: data.amount.toString(),
        changedById,
        changeReason: changeReason || '更新押金金额',
      });
    }
    
    if (data.status !== undefined && data.status !== existing.status) {
      auditLogs.push({
        depositId: id,
        fieldName: 'status',
        oldValue: existing.status,
        newValue: data.status,
        changedById,
        changeReason: changeReason || '更新押金状态',
      });
    }
    
    if (data.refundAmount !== undefined && data.refundAmount !== existing.refundAmount.toNumber()) {
      auditLogs.push({
        depositId: id,
        fieldName: 'refundAmount',
        oldValue: existing.refundAmount.toString(),
        newValue: data.refundAmount.toString(),
        changedById,
        changeReason: changeReason || '更新退款金额',
      });
    }
    
    if (data.deductAmount !== undefined && data.deductAmount !== existing.deductAmount.toNumber()) {
      auditLogs.push({
        depositId: id,
        fieldName: 'deductAmount',
        oldValue: existing.deductAmount.toString(),
        newValue: data.deductAmount.toString(),
        changedById,
        changeReason: changeReason || data.deductReason || '更新扣款金额',
      });
    }

    if (auditLogs.length > 0) {
      await this.prisma.depositAuditLog.createMany({
        data: auditLogs,
      });
    }

    return deposit;
  }

  async getAuditLogs(depositId: string) {
    return this.prisma.depositAuditLog.findMany({
      where: { depositId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
