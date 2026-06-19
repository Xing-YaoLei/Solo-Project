import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogService } from '../system-log/system-log.service';
import * as ExcelJS from 'exceljs';
import { format } from 'date-fns';

@Injectable()
export class ExportService {
  constructor(
    private prisma: PrismaService,
    private systemLogService: SystemLogService,
  ) {}

  async getExportRecords(params?: {
    exportType?: string;
    operatorId?: number;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { exportType, operatorId, startDate, endDate, page = 1, pageSize = 20 } = params || {};
    const where: any = {};

    if (exportType) where.exportType = exportType;
    if (operatorId) where.operatorId = operatorId;
    if (startDate) where.createdAt = { gte: startDate };
    if (endDate) {
      if (where.createdAt) {
        where.createdAt.lte = endDate;
      } else {
        where.createdAt = { lte: endDate };
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.exportRecord.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          operator: { select: { id: true, name: true } },
        },
      }),
      this.prisma.exportRecord.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async exportVerificationData(params: {
    scheduleId?: number;
    startDate?: Date;
    endDate?: Date;
    operatorId: number;
  }) {
    const { scheduleId, startDate, endDate, operatorId } = params;
    const where: any = {};

    if (startDate) where.verifyTime = { gte: startDate };
    if (endDate) {
      if (where.verifyTime) {
        where.verifyTime.lte = endDate;
      } else {
        where.verifyTime = { lte: endDate };
      }
    }
    if (scheduleId) {
      where.order = { scheduleId };
    }

    const verifications = await this.prisma.verificationRecord.findMany({
      where,
      orderBy: { verifyTime: 'desc' },
      include: {
        order: {
          include: {
            schedule: { select: { id: true, title: true, startTime: true, venue: true } },
            ticketType: { select: { id: true, name: true, price: true } },
          },
        },
        verifier: { select: { id: true, name: true, role: true } },
      },
    });

    const operator = await this.prisma.user.findUnique({ where: { id: operatorId } });
    const generateTime = new Date();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('核销记录');

    worksheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '核销时间', key: 'verifyTime', width: 20 },
      { header: '订单号', key: 'orderNo', width: 20 },
      { header: '演出名称', key: 'scheduleTitle', width: 30 },
      { header: '票种', key: 'ticketName', width: 15 },
      { header: '购票人', key: 'buyerName', width: 12 },
      { header: '联系电话', key: 'buyerPhone', width: 15 },
      { header: '核销数量', key: 'quantity', width: 10 },
      { header: '核销方式', key: 'verifyMethod', width: 12 },
      { header: '核销员', key: 'verifierName', width: 12 },
      { header: '备注', key: 'remark', width: 30 },
    ];

    worksheet.getRow(1).font = { bold: true };

    verifications.forEach((v, i) => {
      worksheet.addRow({
        index: i + 1,
        verifyTime: format(new Date(v.verifyTime), 'yyyy-MM-dd HH:mm:ss'),
        orderNo: v.order.orderNo,
        scheduleTitle: v.order.schedule.title,
        ticketName: v.order.ticketType.name,
        buyerName: v.order.buyerName,
        buyerPhone: v.order.buyerPhone,
        quantity: v.quantity,
        verifyMethod: v.verifyMethod,
        verifierName: v.verifier.name,
        remark: v.remark || '',
      });
    });

    const summaryRow = worksheet.addRow({});
    summaryRow.getCell(1).value = '合计';
    summaryRow.getCell(1).font = { bold: true };
    summaryRow.getCell(8).value = { formula: `SUM(H2:H${verifications.length + 1})` };
    summaryRow.getCell(8).font = { bold: true };

    const infoRow1 = worksheet.addRow({});
    infoRow1.getCell(1).value = '筛选条件';
    infoRow1.getCell(2).value = `演出: ${scheduleId ? '指定演出' : '全部'} | 时间范围: ${startDate ? format(startDate, 'yyyy-MM-dd') : '开始'} ~ ${endDate ? format(endDate, 'yyyy-MM-dd') : '结束'}`;

    const infoRow2 = worksheet.addRow({});
    infoRow2.getCell(1).value = '生成时间';
    infoRow2.getCell(2).value = format(generateTime, 'yyyy-MM-dd HH:mm:ss');

    const infoRow3 = worksheet.addRow({});
    infoRow3.getCell(1).value = '操作人';
    infoRow3.getCell(2).value = operator?.name || '未知';

    const filename = `核销记录_${format(generateTime, 'yyyyMMdd_HHmmss')}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();

    const exportRecord = await this.prisma.exportRecord.create({
      data: {
        filename,
        exportType: 'verification',
        filterConditions: {
          scheduleId: scheduleId || null,
          startDate: startDate ? format(startDate, 'yyyy-MM-dd') : null,
          endDate: endDate ? format(endDate, 'yyyy-MM-dd') : null,
          generateTime: format(generateTime, 'yyyy-MM-dd HH:mm:ss'),
          operator: operator?.name || '未知',
          recordCount: verifications.length,
        } as any,
        operatorId,
        recordCount: verifications.length,
      },
    });

    await this.systemLogService.create({
      action: 'EXPORT',
      module: 'export',
      description: `导出核销记录: ${filename}`,
      operatorId,
      relatedId: exportRecord.id,
      relatedType: 'ExportRecord',
    });

    return {
      filename,
      buffer,
      exportRecord,
    };
  }

  async exportSponsorData(params: {
    scheduleId?: number;
    level?: string;
    operatorId: number;
  }) {
    const { scheduleId, level, operatorId } = params;
    const where: any = {};

    if (scheduleId) where.scheduleId = scheduleId;
    if (level) where.level = level;

    const sponsors = await this.prisma.sponsor.findMany({
      where,
      orderBy: { amount: 'desc' },
      include: {
        schedule: { select: { id: true, title: true } },
      },
    });

    const operator = await this.prisma.user.findUnique({ where: { id: operatorId } });
    const generateTime = new Date();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('赞助清单');

    worksheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '赞助商名称', key: 'name', width: 30 },
      { header: '赞助级别', key: 'level', width: 12 },
      { header: '赞助金额', key: 'amount', width: 15 },
      { header: '相关演出', key: 'scheduleTitle', width: 30 },
      { header: '联系人', key: 'contactName', width: 12 },
      { header: '联系电话', key: 'contactPhone', width: 15 },
      { header: '赞助权益', key: 'benefits', width: 40 },
      { header: '状态', key: 'status', width: 10 },
    ];

    worksheet.getRow(1).font = { bold: true };

    let totalAmount = 0;
    sponsors.forEach((s, i) => {
      worksheet.addRow({
        index: i + 1,
        name: s.name,
        level: s.level,
        amount: Number(s.amount),
        scheduleTitle: s.schedule.title,
        contactName: s.contactName || '',
        contactPhone: s.contactPhone || '',
        benefits: s.benefits || '',
        status: s.status,
      });
      totalAmount += Number(s.amount);
    });

    const summaryRow = worksheet.addRow({});
    summaryRow.getCell(1).value = '合计';
    summaryRow.getCell(1).font = { bold: true };
    summaryRow.getCell(3).value = sponsors.length + '家';
    summaryRow.getCell(3).font = { bold: true };
    summaryRow.getCell(4).value = totalAmount;
    summaryRow.getCell(4).font = { bold: true };

    const infoRow1 = worksheet.addRow({});
    infoRow1.getCell(1).value = '筛选条件';
    infoRow1.getCell(2).value = `演出: ${scheduleId ? '指定演出' : '全部'} | 级别: ${level || '全部'}`;

    const infoRow2 = worksheet.addRow({});
    infoRow2.getCell(1).value = '生成时间';
    infoRow2.getCell(2).value = format(generateTime, 'yyyy-MM-dd HH:mm:ss');

    const infoRow3 = worksheet.addRow({});
    infoRow3.getCell(1).value = '操作人';
    infoRow3.getCell(2).value = operator?.name || '未知';

    const filename = `赞助清单_${format(generateTime, 'yyyyMMdd_HHmmss')}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();

    const exportRecord = await this.prisma.exportRecord.create({
      data: {
        filename,
        exportType: 'sponsor',
        filterConditions: {
          scheduleId: scheduleId || null,
          level: level || null,
          generateTime: format(generateTime, 'yyyy-MM-dd HH:mm:ss'),
          operator: operator?.name || '未知',
          recordCount: sponsors.length,
        } as any,
        operatorId,
        recordCount: sponsors.length,
      },
    });

    await this.systemLogService.create({
      action: 'EXPORT',
      module: 'export',
      description: `导出赞助清单: ${filename}`,
      operatorId,
      relatedId: exportRecord.id,
      relatedType: 'ExportRecord',
    });

    return {
      filename,
      buffer,
      exportRecord,
    };
  }

  async exportReviewData(params: {
    year: number;
    month: number;
    operatorId: number;
  }) {
    const { year, month, operatorId } = params;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const schedules = await this.prisma.performanceSchedule.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        ticketTypes: true,
        _count: { select: { orders: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    const verifications = await this.prisma.verificationRecord.findMany({
      where: {
        verifyTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        order: {
          include: {
            schedule: { select: { id: true, title: true } },
            ticketType: { select: { id: true, name: true, price: true } },
          },
        },
      },
    });

    const operator = await this.prisma.user.findUnique({ where: { id: operatorId } });
    const generateTime = new Date();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('月底核销复盘');

    worksheet.columns = [
      { header: '演出名称', key: 'title', width: 30 },
      { header: '演出时间', key: 'startTime', width: 20 },
      { header: '演出地点', key: 'venue', width: 15 },
      { header: '总票数', key: 'totalTickets', width: 10 },
      { header: '已售票数', key: 'soldTickets', width: 10 },
      { header: '已核销数', key: 'verifiedTickets', width: 10 },
      { header: '核销率', key: 'verifyRate', width: 10 },
      { header: '核销收入', key: 'revenue', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };

    let totalSold = 0;
    let totalVerified = 0;
    let totalRevenue = 0;

    for (const schedule of schedules) {
      const scheduleVerifications = verifications.filter(v => v.order.scheduleId === schedule.id);
      const scheduleVerifiedTickets = scheduleVerifications.reduce((sum, v) => sum + v.quantity, 0);
      const scheduleSoldTickets = schedule.ticketTypes.reduce((sum, t) => sum + t.soldCount, 0);
      const scheduleRevenue = scheduleVerifications.reduce((sum, v) => sum + v.quantity * Number(v.order.ticketType.price), 0);

      totalSold += scheduleSoldTickets;
      totalVerified += scheduleVerifiedTickets;
      totalRevenue += scheduleRevenue;

      worksheet.addRow({
        title: schedule.title,
        startTime: format(new Date(schedule.startTime), 'yyyy-MM-dd HH:mm'),
        venue: schedule.venue,
        totalTickets: schedule.ticketTypes.reduce((sum, t) => sum + t.totalCount, 0),
        soldTickets: scheduleSoldTickets,
        verifiedTickets: scheduleVerifiedTickets,
        verifyRate: scheduleSoldTickets > 0 ? ((scheduleVerifiedTickets / scheduleSoldTickets) * 100).toFixed(2) + '%' : '0%',
        revenue: scheduleRevenue.toFixed(2),
      });
    }

    const summaryRow = worksheet.addRow({});
    summaryRow.getCell(1).value = '合计';
    summaryRow.getCell(1).font = { bold: true };
    summaryRow.getCell(5).value = totalSold;
    summaryRow.getCell(5).font = { bold: true };
    summaryRow.getCell(6).value = totalVerified;
    summaryRow.getCell(6).font = { bold: true };
    summaryRow.getCell(7).value = totalSold > 0 ? ((totalVerified / totalSold) * 100).toFixed(2) + '%' : '0%';
    summaryRow.getCell(7).font = { bold: true };
    summaryRow.getCell(8).value = totalRevenue.toFixed(2);
    summaryRow.getCell(8).font = { bold: true };

    const infoRow1 = worksheet.addRow({});
    infoRow1.getCell(1).value = '筛选条件';
    infoRow1.getCell(2).value = `${year}年${month}月核销效率复盘`;

    const infoRow2 = worksheet.addRow({});
    infoRow2.getCell(1).value = '生成时间';
    infoRow2.getCell(2).value = format(generateTime, 'yyyy-MM-dd HH:mm:ss');

    const infoRow3 = worksheet.addRow({});
    infoRow3.getCell(1).value = '操作人';
    infoRow3.getCell(2).value = operator?.name || '未知';

    const filename = `月底核销复盘_${year}年${month}月_${format(generateTime, 'yyyyMMdd_HHmmss')}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();

    const exportRecord = await this.prisma.exportRecord.create({
      data: {
        filename,
        exportType: 'review',
        filterConditions: {
          year,
          month,
          generateTime: format(generateTime, 'yyyy-MM-dd HH:mm:ss'),
          operator: operator?.name || '未知',
          scheduleCount: schedules.length,
        } as any,
        operatorId,
        recordCount: schedules.length,
      },
    });

    await this.systemLogService.create({
      action: 'EXPORT',
      module: 'export',
      description: `导出月底核销复盘: ${filename}`,
      operatorId,
      relatedId: exportRecord.id,
      relatedType: 'ExportRecord',
    });

    return {
      filename,
      buffer,
      exportRecord,
    };
  }
}
