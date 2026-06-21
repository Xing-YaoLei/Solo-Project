import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MonthlyReportQueryDto } from './dto/reports.dto';
import { MonthlyReportDTO, CaseType, PaymentStatus, CaseStatus } from '@legal/shared';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getMonthlyReport(userId: string, query: MonthlyReportQueryDto): Promise<MonthlyReportDTO> {
    const cacheKey = `report:monthly:${query.year}:${query.month}:${query.caseType || 'all'}:${query.lawyerId || 'all'}:${query.paymentStatus || 'all'}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const startDate = new Date(query.year, query.month - 1, 1);
    const endDate = new Date(query.year, query.month, 1);

    const where: Record<string, unknown> = {
      createdAt: { gte: startDate, lt: endDate },
      status: { not: CaseStatus.CASE_ARCHIVED },
    };

    if (query.caseType) where.caseType = query.caseType;
    if (query.lawyerId) where.lawyerId = query.lawyerId;

    const cases = await this.prisma.case.findMany({
      where,
      include: {
        lawyer: true,
        invoices: true,
      },
    });

    const totalCases = cases.length;
    const activeCases = cases.filter((c) =>
      [CaseStatus.CASE_ACTIVE, CaseStatus.LAWYER_SUPPLEMENTING, CaseStatus.LAWYER_ASSIGNING].includes(c.status as CaseStatus),
    ).length;
    const closedCases = cases.filter((c) => c.status === CaseStatus.CASE_CLOSED).length;

    const allInvoices = cases.flatMap((c) => c.invoices);
    const totalRevenue = allInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const collectedRevenue = allInvoices
      .filter((inv) => inv.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
    const outstandingRevenue = totalRevenue - collectedRevenue;

    const byCaseType: Record<string, { count: number; revenue: number; collected: number }> = {};
    for (const c of cases) {
      const type = c.caseType;
      if (!byCaseType[type]) {
        byCaseType[type] = { count: 0, revenue: 0, collected: 0 };
      }
      byCaseType[type].count += 1;
      const caseRevenue = c.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const caseCollected = c.invoices
        .filter((inv) => inv.paymentStatus === PaymentStatus.PAID)
        .reduce((sum, inv) => sum + Number(inv.amount), 0);
      byCaseType[type].revenue += caseRevenue;
      byCaseType[type].collected += caseCollected;
    }

    const byLawyer: Record<string, { count: number; revenue: number; collected: number }> = {};
    for (const c of cases) {
      const lawyerName = c.lawyer?.name || '未分配';
      if (!byLawyer[lawyerName]) {
        byLawyer[lawyerName] = { count: 0, revenue: 0, collected: 0 };
      }
      byLawyer[lawyerName].count += 1;
      const caseRevenue = c.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const caseCollected = c.invoices
        .filter((inv) => inv.paymentStatus === PaymentStatus.PAID)
        .reduce((sum, inv) => sum + Number(inv.amount), 0);
      byLawyer[lawyerName].revenue += caseRevenue;
      byLawyer[lawyerName].collected += caseCollected;
    }

    const invoiceWhere: Record<string, unknown> = {};
    if (query.paymentStatus) invoiceWhere.paymentStatus = query.paymentStatus;

    const byPaymentStatus: Record<string, { count: number; amount: number }> = {};
    const filteredInvoices = query.paymentStatus
      ? allInvoices.filter((inv) => inv.paymentStatus === query.paymentStatus)
      : allInvoices;

    for (const inv of filteredInvoices) {
      const status = inv.paymentStatus;
      if (!byPaymentStatus[status]) {
        byPaymentStatus[status] = { count: 0, amount: 0 };
      }
      byPaymentStatus[status].count += 1;
      byPaymentStatus[status].amount += Number(inv.amount);
    }

    const report: MonthlyReportDTO = {
      year: query.year,
      month: query.month,
      totalCases,
      activeCases,
      closedCases,
      totalRevenue,
      collectedRevenue,
      outstandingRevenue,
      byCaseType,
      byLawyer,
      byPaymentStatus,
    };

    await this.redis.set(cacheKey, JSON.stringify(report), 3600);

    await this.prisma.monthlyReport.upsert({
      where: { year_month: { year: query.year, month: query.month } },
      create: {
        year: query.year,
        month: query.month,
        reportData: report as any,
        generatedBy: userId,
      },
      update: {
        reportData: report as any,
        generatedBy: userId,
        generatedAt: new Date(),
      },
    });

    return report;
  }
}
