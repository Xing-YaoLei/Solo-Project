import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportExcelDto, QueryExportRecordDto, ExportType } from './dto/export.dto';
import { CALIBER_NOTES, GENERAL_CALIBER } from './export-caliber';
import { buildPaginatedResult } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  private getExportFileName(exportType: string, customName?: string): string {
    if (customName) return `${customName}.xlsx`;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const typeMap: Record<string, string> = {
      HEARING_SUMMARY: '开庭日历汇总',
      ATTENDANCE_STATS: '到场签到统计',
      EXCEPTION_STATS: '异常单统计',
      CONFLICT_STATS: '冲突检测统计',
      REMINDER_SUMMARY: '提醒发送汇总',
      CASE_SUMMARY: '案件汇总表',
    };
    return `${typeMap[exportType] || '数据导出'}_${dateStr}.xlsx`;
  }

  private async fetchHearingData(start: Date, end: Date, filter?: any) {
    const where: any = {
      startTime: { gte: start, lte: end },
    };
    if (filter?.status) where.status = filter.status;
    if (filter?.courtId) where.courtId = filter.courtId;
    if (filter?.caseId) where.caseId = filter.caseId;

    return this.prisma.hearing.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        caseInfo: { select: { caseNo: true, courtCaseNo: true, title: true } },
        court: { select: { name: true } },
        courtRoom: { select: { roomNo: true, roomName: true } },
        presidingJudge: { select: { name: true } },
        creator: { select: { realName: true } },
        assignments: {
          include: { assignee: { select: { realName: true } } },
        },
        attendance: { select: { personName: true } },
      },
    });
  }

  private async fetchAttendanceData(start: Date, end: Date, filter?: any) {
    const where: any = {
      hearing: { startTime: { gte: start, lte: end } },
    };
    if (filter?.status) where.status = filter.status;
    if (filter?.attendeeType) where.attendeeType = filter.attendeeType;
    if (filter?.hearingId) where.hearingId = filter.hearingId;

    return this.prisma.attendanceRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        hearing: { select: { hearingNo: true, startTime: true, endTime: true } },
        user: { select: { realName: true } },
      },
    });
  }

  private async fetchExceptionData(start: Date, end: Date, filter?: any) {
    const where: any = {
      createdAt: { gte: start, lte: end },
    };
    if (filter?.status) where.status = filter.status;
    if (filter?.exceptionType) where.exceptionType = filter.exceptionType;
    if (filter?.severity) where.severity = filter.severity;

    return this.prisma.exceptionRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        hearing: { select: { hearingNo: true } },
        case: { select: { caseNo: true } },
        creator: { select: { realName: true } },
        resolver: { select: { realName: true } },
      },
    });
  }

  private async fetchConflictData(start: Date, end: Date, filter?: any) {
    const where: any = {
      createdAt: { gte: start, lte: end },
    };
    if (filter?.conflictType) where.conflictType = filter.conflictType;
    if (filter?.severity) where.severity = filter.severity;
    if (filter?.isResolved !== undefined) where.isResolved = filter.isResolved;

    return this.prisma.conflictCheck.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        hearing: { select: { hearingNo: true } },
      },
    });
  }

  private async fetchReminderData(start: Date, end: Date, filter?: any) {
    const where: any = {
      createdAt: { gte: start, lte: end },
    };
    if (filter?.reminderType) where.reminderType = filter.reminderType;
    if (filter?.status) where.status = filter.status;
    if (filter?.hearingId) where.hearingId = filter.hearingId;

    return this.prisma.reminder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        hearing: { select: { hearingNo: true } },
        sender: { select: { realName: true } },
        recipients: true,
      },
    });
  }

  private async fetchCaseData(start: Date, end: Date, filter?: any) {
    const where: any = {
      createdAt: { gte: start, lte: end },
    };
    if (filter?.status) where.status = filter.status;
    if (filter?.caseType) where.caseType = filter.caseType;
    if (filter?.lawyerInChargeId) where.lawyerInChargeId = filter.lawyerInChargeId;

    return this.prisma.case.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        ownerClient: { select: { name: true, clientNo: true } },
        lawyerInCharge: { select: { realName: true } },
        assistantInCharge: { select: { realName: true } },
        hearings: true,
        exceptions: { where: { status: { not: 'CLOSED' } } },
      },
    });
  }

  private mapHearingData(rows: any[]): any[] {
    return rows.map((h) => {
      const start = new Date(h.startTime);
      const end = new Date(h.endTime);
      const duration = Math.round((end.getTime() - start.getTime()) / 60000);
      const lawyers = h.assignments
        .filter((a: any) => a.assignee)
        .map((a: any) => a.assignee.realName)
        .join('、');
      const attendees = h.attendance.map((a: any) => a.personName).join('、');
      const courtRoom = [h.courtRoom?.roomNo, h.courtRoom?.roomName].filter(Boolean).join(' ');

      return {
        hearingNo: h.hearingNo,
        caseNo: h.caseInfo?.caseNo || '',
        courtCaseNo: h.caseInfo?.courtCaseNo || '',
        caseTitle: h.caseInfo?.title || '',
        courtName: h.court?.name || '',
        courtRoom,
        presidingJudge: h.presidingJudge?.name || '',
        startTime: h.startTime,
        endTime: h.endTime,
        duration,
        hearingType: h.hearingType,
        status: h.status,
        isImportant: h.isImportant ? '是' : '否',
        priority: h.priority,
        assignedLawyers: lawyers,
        attendees,
        creator: h.creator?.realName || '',
        createdAt: h.createdAt,
      };
    });
  }

  private mapAttendanceData(rows: any[]): any[] {
    return rows.map((a) => {
      let lateMinutes = 0;
      let earlyLeaveMinutes = 0;
      if (a.hearing?.startTime && a.checkInTime) {
        const diff = (new Date(a.checkInTime).getTime() - new Date(a.hearing.startTime).getTime()) / 60000;
        if (diff > 0) lateMinutes = Math.round(diff);
      }
      if (a.hearing?.endTime && a.checkOutTime) {
        const diff = (new Date(a.hearing.endTime).getTime() - new Date(a.checkOutTime).getTime()) / 60000;
        if (diff > 0) earlyLeaveMinutes = Math.round(diff);
      }

      return {
        hearingNo: a.hearing?.hearingNo || '',
        hearingTime: a.hearing?.startTime || '',
        personName: a.personName,
        attendeeType: a.attendeeType,
        plannedRole: a.plannedRole || '',
        status: a.status,
        checkInTime: a.checkInTime || '',
        checkOutTime: a.checkOutTime || '',
        lateMinutes,
        earlyLeaveMinutes,
        signType: a.signType || '',
        recordedBy: a.user?.realName || a.recordedBy || '',
      };
    });
  }

  private mapExceptionData(rows: any[]): any[] {
    return rows.map((e) => {
      let resolutionTime: number | null = null;
      if (e.createdAt && e.resolvedAt) {
        resolutionTime = Math.round(
          (new Date(e.resolvedAt).getTime() - new Date(e.createdAt).getTime()) / 3600000,
        );
      }

      return {
        exceptionNo: e.exceptionNo,
        exceptionType: e.exceptionType,
        title: e.title,
        severity: e.severity,
        status: e.status,
        caseNo: e.case?.caseNo || '',
        hearingNo: e.hearing?.hearingNo || '',
        creator: e.creator?.realName || '',
        createdAt: e.createdAt,
        resolver: e.resolver?.realName || '',
        investigationResult: e.investigationResult || '',
        handlingResult: e.handlingResult || '',
        correctiveAction: e.correctiveAction || '',
        preventiveMeasure: e.preventiveMeasure || '',
        estimatedLoss: e.estimatedLoss ? Number(e.estimatedLoss) : '',
        actualLoss: e.actualLoss ? Number(e.actualLoss) : '',
        resolutionTime: resolutionTime !== null ? resolutionTime : '',
      };
    });
  }

  private mapConflictData(rows: any[]): any[] {
    return rows.map((c) => ({
      hearingNo: c.hearing?.hearingNo || '',
      conflictType: c.conflictType,
      severity: c.severity,
      description: c.description,
      partyAName: c.partyAName || '',
      partyBName: c.partyBName || '',
      isResolved: c.isResolved ? '是' : '否',
      resolvedAt: c.resolvedAt || '',
      resolvedBy: c.resolvedBy || '',
      resolution: c.resolution || '',
      createdAt: c.createdAt,
    }));
  }

  private mapReminderData(rows: any[]): any[] {
    return rows.map((r) => {
      const recipientCount = r.recipients.length;
      const deliveredCount = r.recipients.filter((x: any) => x.deliveredAt).length;
      const readCount = r.recipients.filter((x: any) => x.readAt).length;
      const confirmedCount = r.recipients.filter((x: any) => x.confirmedAt).length;
      const failCount = r.recipients.filter(
        (x: any) => x.status === 'FAILED' || x.failReason,
      ).length;
      let sendDelay = '';
      if (r.scheduledTime && r.sentAt) {
        const diff = Math.round(
          (new Date(r.sentAt).getTime() - new Date(r.scheduledTime).getTime()) / 60000,
        );
        sendDelay = diff.toString();
      }

      return {
        reminderId: r.id,
        hearingNo: r.hearing?.hearingNo || '',
        reminderType: r.reminderType,
        title: r.title,
        content: r.content,
        scheduledTime: r.scheduledTime,
        sentAt: r.sentAt || '',
        sendDelay,
        status: r.status,
        sender: r.sender?.realName || '',
        recipientCount,
        deliveredCount,
        readCount,
        confirmedCount,
        failCount,
        retryCount: r.retryCount,
        createdAt: r.createdAt,
      };
    });
  }

  private mapCaseData(rows: any[]): any[] {
    return rows.map((c) => {
      const hearingCount = c.hearings.length;
      const completedHearings = c.hearings.filter((h: any) => h.status === 'COMPLETED').length;
      const pendingHearings = hearingCount - completedHearings;

      return {
        caseNo: c.caseNo,
        courtCaseNo: c.courtCaseNo || '',
        title: c.title,
        caseType: c.caseType,
        caseCategory: c.caseCategory || '',
        status: c.status,
        clientName: c.ownerClient?.name || '',
        ownerClientNo: c.ownerClient?.clientNo || '',
        lawyerInCharge: c.lawyerInCharge?.realName || '',
        assistantInCharge: c.assistantInCharge?.realName || '',
        courtLevel: c.courtLevel || '',
        jurisdiction: c.jurisdiction || '',
        acceptanceDate: c.acceptanceDate || '',
        deadlineDate: c.deadlineDate || '',
        amountInvolved: c.amountInvolved ? Number(c.amountInvolved) : '',
        retentionFee: c.retentionFee ? Number(c.retentionFee) : '',
        paymentStatus: c.paymentStatus || '',
        hearingCount,
        completedHearings,
        pendingHearings,
        openExceptions: c.exceptions.length,
        createdAt: c.createdAt,
      };
    });
  }

  private applyIncludedFields(rows: any[], includedFields?: string[]): any[] {
    if (!includedFields || includedFields.length === 0) return rows;
    return rows.map((row) => {
      const filtered: any = {};
      includedFields.forEach((f) => {
        if (row.hasOwnProperty(f)) filtered[f] = row[f];
      });
      return filtered;
    });
  }

  private formatCellValue(value: any): any {
    if (value === null || value === undefined || value === '') return '';
    if (value instanceof Date) return value;
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
  }

  private async buildDataSheet(
    worksheet: ExcelJS.Worksheet,
    data: any[],
    caliberNotes: Record<string, string>,
  ) {
    if (data.length === 0) {
      worksheet.getRow(1).getCell(1).value = '暂无数据';
      return;
    }

    const headers = Object.keys(data[0]);

    const headerRow = worksheet.addRow(headers.map((h) => caliberNotes[h]?.split('：')[0] || caliberNotes[h]?.split(':')[0] || h));
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    data.forEach((row) => {
      const values = headers.map((h) => this.formatCellValue(row[h]));
      const dataRow = worksheet.addRow(values);
      dataRow.alignment = { vertical: 'middle', wrapText: true };
      dataRow.height = 22;
    });

    headers.forEach((_, index) => {
      const col = worksheet.getColumn(index + 1);
      col.width = 18;
    });

    worksheet.getColumn(1).width = 24;

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: worksheet.rowCount, column: headers.length },
    };

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  private buildCaliberSheet(
    worksheet: ExcelJS.Worksheet,
    specificCaliber?: Record<string, string>,
    exportTypeName?: string,
  ) {
    const titleRow = worksheet.addRow(['数据导出口径说明']);
    titleRow.font = { bold: true, size: 16, color: { argb: 'FF1F3864' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.height = 40;
    worksheet.mergeCells(`A1:C1`);

    const metaRow = worksheet.addRow([
      `导出类型：${exportTypeName || '通用'}`,
      `导出时间：${new Date().toLocaleString('zh-CN')}`,
      '',
    ]);
    metaRow.font = { size: 10, color: { argb: 'FF595959' } };
    metaRow.height = 24;

    worksheet.addRow(['']);

    if (specificCaliber && Object.keys(specificCaliber).length > 0) {
      const specTitle = worksheet.addRow(['一、导出字段口径说明']);
      specTitle.font = { bold: true, size: 13, color: { argb: 'FF1F3864' } };
      specTitle.height = 28;
      worksheet.mergeCells(`A${specTitle.number}:C${specTitle.number}`);

      const specHeader = worksheet.addRow(['字段名', '字段中文名', '口径说明']);
      specHeader.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      specHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2E75B6' },
      };
      specHeader.alignment = { vertical: 'middle', horizontal: 'center' };
      specHeader.height = 26;

      Object.entries(specificCaliber).forEach(([key, desc]) => {
        const colonIndex = desc.indexOf('：') !== -1 ? desc.indexOf('：') : desc.indexOf(':');
        const chineseName = colonIndex !== -1 ? desc.substring(0, colonIndex) : key;
        const caliberDesc = colonIndex !== -1 ? desc.substring(colonIndex + 1).trim() : desc;
        const row = worksheet.addRow([key, chineseName, caliberDesc]);
        row.alignment = { vertical: 'middle', wrapText: true };
        row.height = 24;
      });
    }

    worksheet.addRow(['']);

    const genTitle = worksheet.addRow(['二、通用口径规则']);
    genTitle.font = { bold: true, size: 13, color: { argb: 'FF1F3864' } };
    genTitle.height = 28;
    worksheet.mergeCells(`A${genTitle.number}:C${genTitle.number}`);

    GENERAL_CALIBER.forEach((category) => {
      const catTitle = worksheet.addRow([`（${GENERAL_CALIBER.indexOf(category) + 1}）${category.category}`]);
      catTitle.font = { bold: true, size: 11, color: { argb: 'FF2E75B6' } };
      catTitle.height = 26;
      worksheet.mergeCells(`A${catTitle.number}:C${catTitle.number}`);

      const catHeader = worksheet.addRow(['序号', '名称', '口径说明']);
      catHeader.font = { bold: true, size: 10 };
      catHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDDEBF7' },
      };
      catHeader.alignment = { vertical: 'middle', horizontal: 'center' };
      catHeader.height = 24;

      category.items.forEach((item, idx) => {
        const row = worksheet.addRow([idx + 1, item.name, item.desc]);
        row.alignment = { vertical: 'middle', wrapText: true };
        row.height = 24;
      });
    });

    worksheet.getColumn(1).width = 14;
    worksheet.getColumn(2).width = 22;
    worksheet.getColumn(3).width = 90;
  }

  async exportExcel(dto: ExportExcelDto, response: Response, exportedById: string) {
    const start = new Date(dto.startTimeRange);
    const end = new Date(dto.endTimeRange);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('时间格式不正确');
    }
    if (start > end) {
      throw new BadRequestException('开始时间不能晚于结束时间');
    }

    let rawData: any[] = [];
    let mappedData: any[] = [];
    let caliberNotes: Record<string, string> = {};
    let dataSheetName = '数据';
    let exportTypeName = '';

    switch (dto.exportType) {
      case ExportType.HEARING_SUMMARY:
        rawData = await this.fetchHearingData(start, end, dto.filterCriteria);
        mappedData = this.mapHearingData(rawData);
        caliberNotes = CALIBER_NOTES.HEARING_SUMMARY;
        dataSheetName = '开庭汇总';
        exportTypeName = '开庭日历汇总';
        break;
      case ExportType.ATTENDANCE_STATS:
        rawData = await this.fetchAttendanceData(start, end, dto.filterCriteria);
        mappedData = this.mapAttendanceData(rawData);
        caliberNotes = CALIBER_NOTES.ATTENDANCE_STATS;
        dataSheetName = '签到统计';
        exportTypeName = '到场签到统计';
        break;
      case ExportType.EXCEPTION_STATS:
        rawData = await this.fetchExceptionData(start, end, dto.filterCriteria);
        mappedData = this.mapExceptionData(rawData);
        caliberNotes = CALIBER_NOTES.EXCEPTION_STATS;
        dataSheetName = '异常统计';
        exportTypeName = '异常单统计';
        break;
      case ExportType.CONFLICT_STATS:
        rawData = await this.fetchConflictData(start, end, dto.filterCriteria);
        mappedData = this.mapConflictData(rawData);
        caliberNotes = CALIBER_NOTES.CONFLICT_STATS;
        dataSheetName = '冲突统计';
        exportTypeName = '冲突检测统计';
        break;
      case ExportType.REMINDER_SUMMARY:
        rawData = await this.fetchReminderData(start, end, dto.filterCriteria);
        mappedData = this.mapReminderData(rawData);
        caliberNotes = CALIBER_NOTES.REMINDER_SUMMARY;
        dataSheetName = '提醒汇总';
        exportTypeName = '提醒发送汇总';
        break;
      case ExportType.CASE_SUMMARY:
        rawData = await this.fetchCaseData(start, end, dto.filterCriteria);
        mappedData = this.mapCaseData(rawData);
        caliberNotes = CALIBER_NOTES.CASE_SUMMARY;
        dataSheetName = '案件汇总';
        exportTypeName = '案件汇总表';
        break;
      default:
        throw new BadRequestException('不支持的导出类型');
    }

    mappedData = this.applyIncludedFields(mappedData, dto.includedFields);
    const recordCount = mappedData.length;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SoloManagePro';
    workbook.created = new Date();
    workbook.modified = new Date();

    const dataSheet = workbook.addWorksheet(dataSheetName, {
      views: [{ showGridLines: true }],
    });
    const caliberSheet = workbook.addWorksheet('口径说明', {
      views: [{ showGridLines: false }],
    });

    const usedCaliberNotes: Record<string, string> = {};
    if (dto.includedFields && dto.includedFields.length > 0) {
      dto.includedFields.forEach((f) => {
        if (caliberNotes[f]) usedCaliberNotes[f] = caliberNotes[f];
      });
    } else {
      Object.assign(usedCaliberNotes, caliberNotes);
    }

    await this.buildDataSheet(dataSheet, mappedData, usedCaliberNotes);
    this.buildCaliberSheet(caliberSheet, usedCaliberNotes, exportTypeName);

    const exporter = await this.prisma.user.findUnique({
      where: { id: exportedById },
      select: { realName: true },
    });
    const exportedByName = exporter?.realName || '系统';

    let caliberSummary = `导出类型：${exportTypeName}；时间范围：${dto.startTimeRange} 至 ${dto.endTimeRange}；记录数：${recordCount}条。`;
    if (dto.includedFields && dto.includedFields.length > 0) {
      caliberSummary += `自定义字段：${dto.includedFields.join('、')}。`;
    }

    await this.prisma.exportRecord.create({
      data: {
        exportType: dto.exportType,
        fileName: this.getExportFileName(dto.exportType, dto.customFileName),
        startTimeRange: start,
        endTimeRange: end,
        filterCriteria: dto.filterCriteria as Prisma.InputJsonValue,
        includedFields: dto.includedFields || Object.keys(usedCaliberNotes),
        caliberNote: caliberSummary,
        summaryData: {
          exportTypeName,
          recordCount,
          timeRange: { start: dto.startTimeRange, end: dto.endTimeRange },
        } as Prisma.InputJsonValue,
        recordCount,
        exportedById,
        exportedByName,
      },
    });

    const fileName = this.getExportFileName(dto.exportType, dto.customFileName);
    const encodedFileName = encodeURIComponent(fileName);

    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);
    response.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    await workbook.xlsx.write(response);
    response.end();
  }

  async findAllExportRecords(query: QueryExportRecordDto) {
    const { page = 1, limit = 20, exportType, exportedById, createdAtFrom, createdAtTo } = query;

    const where: any = {};
    if (exportType) where.exportType = exportType;
    if (exportedById) where.exportedById = exportedById;
    if (createdAtFrom || createdAtTo) {
      where.createdAt = {};
      if (createdAtFrom) where.createdAt.gte = new Date(createdAtFrom);
      if (createdAtTo) where.createdAt.lte = new Date(createdAtTo);
    }

    const [list, total] = await Promise.all([
      this.prisma.exportRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.exportRecord.count({ where }),
    ]);

    return buildPaginatedResult(list, total, page, limit);
  }

  async findOneExportRecord(id: string) {
    const record = await this.prisma.exportRecord.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException('导出记录不存在');
    }
    return record;
  }

  async getCaliberList() {
    const result: any[] = [];
    const typeMap: Record<string, string> = {
      HEARING_SUMMARY: '开庭日历汇总',
      ATTENDANCE_STATS: '到场签到统计',
      EXCEPTION_STATS: '异常单统计',
      CONFLICT_STATS: '冲突检测统计',
      REMINDER_SUMMARY: '提醒发送汇总',
      CASE_SUMMARY: '案件汇总表',
    };

    Object.entries(CALIBER_NOTES).forEach(([key, notes]) => {
      result.push({
        exportType: key,
        exportTypeName: typeMap[key] || key,
        fields: Object.entries(notes).map(([field, desc]) => {
          const colonIndex = desc.indexOf('：') !== -1 ? desc.indexOf('：') : desc.indexOf(':');
          return {
            fieldKey: field,
            fieldName: colonIndex !== -1 ? desc.substring(0, colonIndex) : field,
            description: colonIndex !== -1 ? desc.substring(colonIndex + 1).trim() : desc,
          };
        }),
      });
    });

    return {
      exportTypeList: result,
      generalCaliber: GENERAL_CALIBER,
    };
  }
}
