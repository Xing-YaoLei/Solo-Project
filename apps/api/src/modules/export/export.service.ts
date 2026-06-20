import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const EXPORT_CALIBER_NOTES = {
  checkin_efficiency: [
    '核销效率口径说明：',
    '1. 核销率 = 已核销签到码数 / 总发放签到码数，取值范围 [0, 1]',
    '2. 签到码发放范围：订单状态为 PAID / CONFIRMED / COMPLETED 的订单明细自动生成',
    '3. 已核销（CHECKED_IN）：包含已入场但未离场的记录',
    '4. 待核销（PENDING）：签到码有效且未使用，含活动未开始的情况',
    '5. 已过期（EXPIRED）：活动结束后仍未使用的签到码',
    '6. 已作废（INVALID）：由人工操作或订单退款导致的失效签到码',
    '7. 核销耗时：从签到码验证通过到状态变更为 CHECKED_IN 的秒数，仅用于人工核销场景',
    '8. 时间范围：以订单支付时间 (paidAt) 落在查询区间内的订单为准',
  ],
  orders: [
    '订单导出口径说明：',
    '1. 订单金额：totalAmount 为下单时原价合计，paidAmount 为实际到账金额',
    '2. 订单状态流转：PENDING → PAID → CONFIRMED → COMPLETED / REFUNDING / REFUNDED / DISPUTED',
    '3. 已支付订单：状态为 PAID / CONFIRMED / COMPLETED 均视为已支付',
    '4. 订单来源：ONLINE 官网 / OFFLINE 线下 / PARTNER 合作渠道',
    '5. 退款订单：status=REFUNDED 或存在关联退款记录（refund_records.status=PROCESSED）均计入退款',
  ],
  sales: [
    '销售明细口径说明：',
    '1. 票面价（originalPrice）：活动对外公布的原始定价',
    '2. 售价（price）：下单时的实际售价，如有优惠则已体现在价差',
    '3. 售出数量：以订单明细中的 quantity 为准，不区分后续退款',
    '4. 销售净额 = 已支付订单实收金额 - 已退款金额',
  ],
  exceptions: [
    '异常单导出口径说明：',
    '1. 影响范围：基于业务人员记录的定性描述，非精确统计',
    '2. 责任归属：为调查后判定的主要责任方，不代表法律意义上的责任认定',
    '3. 处理周期（小时）= closedAt - createdAt，未关闭的异常单该值为空',
    '4. 严重等级：LOW / MEDIUM / HIGH / CRITICAL，由创建异常单时人工选择',
  ],
};

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async listTasks(activityId?: string) {
    return this.prisma.exportTask.findMany({
      where: activityId ? { activityId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async triggerExport(input: {
    exportType: 'checkin_efficiency' | 'orders' | 'sales' | 'exceptions';
    activityId: string;
    dateRangeFrom?: Date;
    dateRangeTo?: Date;
    createdBy?: string;
    format?: string;
  }) {
    const { exportType, activityId, dateRangeFrom, dateRangeTo, createdBy, format = 'XLSX' } = input;
    const fromStr = dateRangeFrom ? new Date(dateRangeFrom).toISOString().slice(0, 10) : '不限';
    const toStr = dateRangeTo ? new Date(dateRangeTo).toISOString().slice(0, 10) : '不限';

    const task = await this.prisma.exportTask.create({
      data: {
        taskName: `${this.typeLabel(exportType)}_${activityId.slice(0, 6)}_${Date.now()}`,
        exportType,
        format: format as any,
        activityId,
        dateRangeFrom: dateRangeFrom || null,
        dateRangeTo: dateRangeTo || null,
        status: 'PROCESSING',
        caliberNotes: (EXPORT_CALIBER_NOTES[exportType] || []).join('\n'),
        definition: { dateRange: { from: fromStr, to: toStr } },
        createdBy: createdBy || null,
        startedAt: new Date(),
      },
    });

    const data = await this.buildDataset(exportType, activityId, dateRangeFrom, dateRangeTo);

    const buffer = await this.buildWorkbook(exportType, data);
    const fileUrl = this.saveBuffer(buffer, task.id, exportType);

    await this.prisma.exportTask.update({
      where: { id: task.id },
      data: { status: 'COMPLETED', fileUrl, completedAt: new Date() },
    });

    return { taskId: task.id, fileUrl };
  }

  private typeLabel(t: string): string {
    return { checkin_efficiency: '核销效率', orders: '订单明细', sales: '销售统计', exceptions: '异常单' }[t] || t;
  }

  private async buildDataset(type: string, activityId: string, from?: Date, to?: Date) {
    switch (type) {
      case 'checkin_efficiency':
        return this.buildCheckInDataset(activityId, from, to);
      case 'orders':
        return this.buildOrderDataset(activityId, from, to);
      case 'sales':
        return this.buildSalesDataset(activityId, from, to);
      case 'exceptions':
        return this.buildExceptionDataset(activityId, from, to);
      default:
        throw new BadRequestException('不支持的导出类型');
    }
  }

  private async buildCheckInDataset(activityId: string, from?: Date, to?: Date) {
    const codes = await this.prisma.checkInCode.findMany({
      where: {
        activityId,
        createdAt: this.rangeFilter(from, to),
      },
      include: { order: true, orderItem: { include: { ticketType: true } } },
    });

    const detail = codes.map((c) => ({
      签到码: c.code,
      票种名称: c.ticketName,
      客户姓名: c.customerName,
      客户手机: c.order?.customerPhone || '',
      关联订单号: c.order?.orderNo || '',
      座位号: c.seatLabel || '无',
      状态: c.status,
      核销时间: c.checkInAt ? c.checkInAt.toISOString() : '',
      核销人: c.checkInBy || '',
      发放时间: c.createdAt.toISOString(),
      过期时间: c.expireAt ? c.expireAt.toISOString() : '',
    }));

    const total = codes.length;
    const checkedIn = codes.filter((c) => c.status === 'CHECKED_IN').length;
    const pending = codes.filter((c) => c.status === 'PENDING').length;
    const expired = codes.filter((c) => c.status === 'EXPIRED').length;
    const invalid = codes.filter((c) => c.status === 'INVALID').length;
    const rate = total ? Number((checkedIn / total).toFixed(4)) : 0;

    const summary = [
      { 指标: '签到码总数', 值: total, 说明: '发放的签到码数量' },
      { 指标: '已核销数', 值: checkedIn, 说明: '状态为 CHECKED_IN' },
      { 指标: '待核销数', 值: pending, 说明: '状态为 PENDING' },
      { 指标: '已过期数', 值: expired, 说明: '状态为 EXPIRED' },
      { 指标: '已作废数', 值: invalid, 说明: '状态为 INVALID' },
      { 指标: '核销率', 值: rate, 说明: '已核销 / 总数' },
      { 指标: '未到场损失预估(元)', 值: this.estimateLoss(codes), 说明: '待核销+已过期 的票面值之和' },
    ];

    return { summary, detail };
  }

  private estimateLoss(codes: any[]): number {
    return codes
      .filter((c) => ['PENDING', 'EXPIRED'].includes(c.status) && c.orderItem?.ticketType?.price)
      .reduce((s, c) => s + c.orderItem.ticketType.price.toNumber(), 0);
  }

  private async buildOrderDataset(activityId: string, from?: Date, to?: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        activityId,
        paidAt: this.rangeFilter(from, to),
      },
      include: { orderItems: { include: { ticketType: true } }, refunds: true },
    });

    const detail = orders.map((o) => ({
      订单号: o.orderNo,
      客户姓名: o.customerName,
      客户手机: o.customerPhone,
      客户邮箱: o.customerEmail || '',
      订单状态: o.status,
      票种明细: o.orderItems.map((i) => `${i.ticketType.name}x${i.quantity}`).join(';'),
      总金额(元): o.totalAmount.toNumber(),
      实付金额(元): o.paidAmount.toNumber(),
      优惠金额(元): o.discountAmount.toNumber(),
      支付方式: o.paymentMethod || '',
      来源渠道: o.sourceChannel || '',
      下单时间: o.createdAt.toISOString(),
      支付时间: o.paidAt ? o.paidAt.toISOString() : '',
      完成时间: o.completedAt ? o.completedAt.toISOString() : '',
      备注: o.remark || '',
      退款次数: o.refunds.length,
      退款总额(元): o.refunds.reduce((s, r) => s + r.refundAmount.toNumber(), 0),
    }));

    const totalPaid = orders.filter((o) => ['PAID', 'CONFIRMED', 'COMPLETED'].includes(o.status));
    const summary = [
      { 指标: '订单总数', 值: orders.length, 说明: '包含待支付和已支付' },
      { 指标: '已支付订单', 值: totalPaid.length, 说明: '状态为 PAID/CONFIRMED/COMPLETED' },
      { 指标: '退款订单', 值: orders.filter((o) => ['REFUNDING', 'REFUNDED'].includes(o.status)).length },
      { 指标: '争议订单', 值: orders.filter((o) => o.status === 'DISPUTED').length },
      { 指标: '总收入(元)', 值: totalPaid.reduce((s, o) => s + o.paidAmount.toNumber(), 0) },
    ];
    return { summary, detail };
  }

  private async buildSalesDataset(activityId: string, from?: Date, to?: Date) {
    const ticketTypes = await this.prisma.ticketType.findMany({ where: { activityId } });
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: { activityId, paidAt: this.rangeFilter(from, to) },
      },
      include: { ticketType: true },
    });

    const byType = ticketTypes.map((tt) => {
      const items = orderItems.filter((i) => i.ticketTypeId === tt.id);
      const qty = items.reduce((s, i) => s + i.quantity, 0);
      const revenue = items.reduce((s, i) => s + i.subtotal.toNumber(), 0);
      return {
        票种ID: tt.id,
        票种名称: tt.name,
        原始票价(元): tt.originalPrice?.toNumber() || tt.price.toNumber(),
        实际票价(元): tt.price.toNumber(),
        总库存: tt.totalStock,
        销售数量: qty,
        销售金额(元): revenue,
        销售率: tt.totalStock ? Number((qty / tt.totalStock).toFixed(4)) : 0,
        剩余库存: Math.max(0, tt.totalStock - tt.soldCount),
      };
    });

    const summary = [
      { 指标: '票种数', 值: ticketTypes.length },
      { 指标: '总库存', 值: ticketTypes.reduce((s, t) => s + t.totalStock, 0) },
      { 指标: '售出数量', 值: orderItems.reduce((s, i) => s + i.quantity, 0) },
      { 指标: '销售总额(元)', 值: orderItems.reduce((s, i) => s + i.subtotal.toNumber(), 0) },
    ];
    return { summary, byType };
  }

  private async buildExceptionDataset(activityId: string, from?: Date, to?: Date) {
    const list = await this.prisma.exceptionRecord.findMany({
      where: {
        activityId,
        createdAt: this.rangeFilter(from, to),
      },
      include: { order: true },
    });
    const detail = list.map((e) => ({
      异常单号: e.exceptionNo,
      类型: e.type,
      标题: e.title,
      状态: e.status,
      严重等级: e.severity,
      影响范围: e.impactScope,
      责任归属: e.liabilityParty,
      责任说明: e.liabilityDetail || '',
      处理人: e.handlerName || '',
      解决方案: e.resolution || '',
      处理结果: e.handlingResult || '',
      关联订单号: e.order?.orderNo || '',
      创建时间: e.createdAt.toISOString(),
      关闭时间: e.closedAt ? e.closedAt.toISOString() : '',
      处理周期(小时): e.closedAt ? Number(((e.closedAt.getTime() - e.createdAt.getTime()) / 3600000).toFixed(1)) : '',
      截止时间: e.deadline ? e.deadline.toISOString() : '',
    }));
    const typeGroup: Record<string, number> = {};
    list.forEach((e) => (typeGroup[e.type] = (typeGroup[e.type] || 0) + 1));
    const summary = [
      { 指标: '异常单总数', 值: list.length },
      { 指标: '待处理(OPEN)', 值: list.filter((e) => e.status === 'OPEN').length },
      { 指标: '处理中', 值: list.filter((e) => ['INVESTIGATING', 'PENDING_RESPONSE'].includes(e.status)).length },
      { 指标: '已解决/关闭', 值: list.filter((e) => ['RESOLVED', 'CLOSED'].includes(e.status)).length },
      { 指标: '已升级', 值: list.filter((e) => e.status === 'ESCALATED').length },
      ...Object.entries(typeGroup).map(([k, v]) => ({ 指标: `类型:${k}`, 值: v })),
    ];
    return { summary, detail };
  }

  private rangeFilter(from?: Date, to?: Date): any {
    if (!from && !to) return undefined;
    const r: any = {};
    if (from) r.gte = new Date(from);
    if (to) r.lte = new Date(to);
    return r;
  }

  private async buildWorkbook(type: string, data: any) {
    const wb = XLSX.utils.book_new();
    const caliberSheet = XLSX.utils.aoa_to_sheet([
      ['口径说明'],
      ...(EXPORT_CALIBER_NOTES[type as keyof typeof EXPORT_CALIBER_NOTES] || []).map((l) => [l]),
      ['导出时间', new Date().toISOString()],
    ]);
    XLSX.utils.book_append_sheet(wb, caliberSheet, '口径说明');

    const summarySheet = XLSX.utils.json_to_sheet(data.summary || []);
    XLSX.utils.book_append_sheet(wb, summarySheet, '汇总');

    if (data.detail) {
      const detailSheet = XLSX.utils.json_to_sheet(data.detail);
      XLSX.utils.book_append_sheet(wb, detailSheet, '明细');
    }
    if (data.byType) {
      const typeSheet = XLSX.utils.json_to_sheet(data.byType);
      XLSX.utils.book_append_sheet(wb, typeSheet, '按票种');
    }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  private saveBuffer(buffer: Buffer, taskId: string, exportType: string): string {
    try {
      const dir = path.join(os.tmpdir(), 'ticket-exports');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${exportType}-${taskId}.xlsx`);
      fs.writeFileSync(file, buffer);
      return `file://${file}`;
    } catch (e) {
      return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${buffer.toString('base64')}`;
    }
  }

  async downloadDefinition(exportType: string) {
    return {
      exportType,
      caliberNotes: EXPORT_CALIBER_NOTES[exportType as keyof typeof EXPORT_CALIBER_NOTES] || [],
    };
  }
}
