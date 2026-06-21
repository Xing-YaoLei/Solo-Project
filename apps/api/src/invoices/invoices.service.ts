import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimelineService } from '../timeline/timeline.service';
import { CreateInvoiceDto, UpdatePaymentStatusDto } from './dto/invoices.dto';
import { TimelineEventType, PaymentStatus } from '@legal/shared';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private timelineService: TimelineService,
  ) {}

  async findByCase(caseId: string) {
    const caseData = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseData) throw new NotFoundException(`Case ${caseId} not found`);
    const list = await this.prisma.invoice.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((inv) => ({
      id: inv.id,
      caseId: inv.caseId,
      amount: Number(inv.amount),
      paymentStatus: inv.paymentStatus,
      dueDate: inv.dueDate ? inv.dueDate.toISOString() : undefined,
      paidDate: inv.paidDate ? inv.paidDate.toISOString() : undefined,
      paymentMethod: inv.paymentMethod,
      note: inv.note,
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
    }));
  }

  async create(caseId: string, userId: string, dto: CreateInvoiceDto) {
    const caseData = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseData) throw new NotFoundException(`Case ${caseId} not found`);
    const inv = await this.prisma.invoice.create({
      data: {
        caseId,
        amount: dto.amount,
        paymentStatus: dto.paymentStatus || PaymentStatus.UNPAID,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        paymentMethod: dto.paymentMethod,
        note: dto.note,
      },
    });
    const operator = await this.prisma.user.findUnique({ where: { id: userId } });
    await this.timelineService.addEvent({
      caseId,
      eventType: TimelineEventType.COMMUNICATION,
      title: '创建收款单',
      content: `创建收款单，金额: ¥${Number(dto.amount).toLocaleString()}${dto.note ? `（${dto.note}）` : ''}`,
      operatorId: userId,
      operatorName: operator?.name || '',
      metadata: { invoiceId: inv.id },
    });
    return inv;
  }

  async updatePaymentStatus(
    invoiceId: string,
    caseId: string | undefined,
    userId: string,
    dto: UpdatePaymentStatusDto,
  ) {
    let inv;
    if (invoiceId) {
      inv = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    } else if (caseId) {
      inv = await this.prisma.invoice.findFirst({
        where: { caseId },
        orderBy: { createdAt: 'desc' },
      });
    }
    if (!inv) {
      throw new NotFoundException(`Invoice not found, please create one first`);
    }
    if (
      inv.caseId !== caseId &&
      caseId
    ) {
      throw new BadRequestException('Invoice does not match case');
    }
    const updated = await this.prisma.invoice.update({
      where: { id: inv.id },
      data: {
        paymentStatus: dto.paymentStatus,
        paymentMethod: dto.paymentMethod || inv.paymentMethod,
        paidDate: dto.paymentStatus === PaymentStatus.PAID ? new Date() : inv.paidDate,
        note: dto.note || inv.note,
        amount: dto.amount != null ? dto.amount : inv.amount,
      },
    });
    const operator = await this.prisma.user.findUnique({ where: { id: userId } });
    const statusLabels: Record<string, string> = {
      [PaymentStatus.UNPAID]: '未付款',
      [PaymentStatus.PARTIAL]: '部分付款',
      [PaymentStatus.PAID]: '已付清',
      [PaymentStatus.OVERDUE]: '已逾期',
      [PaymentStatus.REFUNDED]: '已退款',
    };
    await this.timelineService.addEvent({
      caseId: inv.caseId,
      eventType: TimelineEventType.COMMUNICATION,
      title: '回款状态更新',
      content: `收款单金额 ¥${Number(updated.amount).toLocaleString()}，状态: ${statusLabels[dto.paymentStatus]}${dto.paymentMethod ? `，方式: ${dto.paymentMethod}` : ''}${dto.note ? `，备注: ${dto.note}` : ''}`,
      operatorId: userId,
      operatorName: operator?.name || '',
      metadata: { invoiceId: updated.id },
    });
    return updated;
  }
}
