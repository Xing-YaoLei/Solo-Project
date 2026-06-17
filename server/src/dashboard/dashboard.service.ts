import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getTrends(period: 'week' | 'month') {
    const now = new Date();
    const days = period === 'week' ? 7 : 30;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const reminders = await this.prisma.medicationReminder.findMany({
      where: { scheduledTime: { gte: startDate } },
      select: { status: true, scheduledTime: true },
    });

    const visits = await this.prisma.visitRecord.findMany({
      where: { visitTime: { gte: startDate } },
      select: { visitTime: true },
    });

    const activities = await this.prisma.activityCheckIn.findMany({
      where: { activityDate: { gte: startDate } },
      select: { checkedIn: true, activityDate: true },
    });

    const falls = await this.prisma.fallIncident.findMany({
      where: { incidentTime: { gte: startDate } },
      select: { riskLevel: true, incidentTime: true },
    });

    const dailyData: Record<string, {
      date: string;
      medication: number;
      visit: number;
      activity: number;
      falls: number;
      medTotal: number;
      medCompleted: number;
      visitTotal: number;
      actTotal: number;
      actChecked: number;
    }> = {};

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dailyData[key] = {
        date: key,
        medication: 0,
        visit: 0,
        activity: 0,
        falls: 0,
        medTotal: 0,
        medCompleted: 0,
        visitTotal: 0,
        actTotal: 0,
        actChecked: 0,
      };
    }

    for (const r of reminders) {
      const key = r.scheduledTime.toISOString().split('T')[0];
      if (dailyData[key]) {
        dailyData[key].medTotal++;
        if (r.status === 'COMPLETED') dailyData[key].medCompleted++;
      }
    }

    for (const v of visits) {
      const key = v.visitTime.toISOString().split('T')[0];
      if (dailyData[key]) {
        dailyData[key].visitTotal++;
      }
    }

    for (const a of activities) {
      const key = a.activityDate.toISOString().split('T')[0];
      if (dailyData[key]) {
        dailyData[key].actTotal++;
        if (a.checkedIn) dailyData[key].actChecked++;
      }
    }

    for (const f of falls) {
      const key = f.incidentTime.toISOString().split('T')[0];
      if (dailyData[key]) dailyData[key].falls++;
    }

    const chartData: Array<{ date: string; medication: number; visit: number; activity: number; falls: number }> = [];
    let totalMed = 0, completedMed = 0, totalVisit = 0, totalAct = 0, checkedAct = 0;

    for (const key of Object.keys(dailyData).sort()) {
      const d = dailyData[key];
      d.medication = d.medTotal > 0 ? Math.round((d.medCompleted / d.medTotal) * 100) : 0;
      d.visit = d.visitTotal > 0 ? 100 : 0;
      d.activity = d.actTotal > 0 ? Math.round((d.actChecked / d.actTotal) * 100) : 0;
      chartData.push({ date: d.date, medication: d.medication, visit: d.visit, activity: d.activity, falls: d.falls });
      totalMed += d.medTotal;
      completedMed += d.medCompleted;
      totalVisit += d.visitTotal;
      totalAct += d.actTotal;
      checkedAct += d.actChecked;
    }

    const overallRate = totalMed > 0 ? Math.round((completedMed / totalMed) * 100) : 0;
    const medRate = totalMed > 0 ? Math.round((completedMed / totalMed) * 100) : 0;
    const visitRate = totalVisit > 0 ? 100 : 0;
    const actRate = totalAct > 0 ? Math.round((checkedAct / totalAct) * 100) : 0;

    return {
      period,
      summary: {
        overall: overallRate,
        medication: medRate,
        visit: visitRate,
        activity: actRate,
      },
      chartData,
      totalFalls: falls.length,
    };
  }

  async getAlerts() {
    const alerts: Array<{ type: string; title: string; description: string; elderId?: string; elderName?: string }> = [];

    const highRiskElders = await this.prisma.elder.findMany({
      where: { fallRiskLevel: 'HIGH', status: 'ACTIVE' },
      select: { id: true, name: true, careLevel: true, fallRiskLevel: true },
    });

    for (const elder of highRiskElders) {
      alerts.push({
        type: 'FALL_RISK',
        title: `${elder.name} - 跌倒高风险`,
        description: `护理等级：${elder.careLevel}，需重点关注`,
        elderId: elder.id,
        elderName: elder.name,
      });
    }

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const [recentCount, prevCount] = await Promise.all([
      this.prisma.medicationReminder.count({
        where: { status: 'COMPLETED', scheduledTime: { gte: weekAgo } },
      }),
      this.prisma.medicationReminder.count({
        where: { status: 'COMPLETED', scheduledTime: { gte: twoWeeksAgo, lt: weekAgo } },
      }),
    ]);

    const recentTotal = await this.prisma.medicationReminder.count({
      where: { scheduledTime: { gte: weekAgo } },
    });
    const prevTotal = await this.prisma.medicationReminder.count({
      where: { scheduledTime: { gte: twoWeeksAgo, lt: weekAgo } },
    });

    const recentCompliance = recentTotal > 0 ? (recentCount / recentTotal) * 100 : 0;
    const prevCompliance = prevTotal > 0 ? (prevCount / prevTotal) * 100 : 0;

    if (recentCompliance < prevCompliance && prevTotal > 0) {
      alerts.push({
        type: 'DECLINING',
        title: '护理达标率下降',
        description: `本周达标率 ${Math.round(recentCompliance)}%，较上周下降 ${Math.round(prevCompliance - recentCompliance)} 个百分点`,
      });
    }

    const overdueReminders = await this.prisma.medicationReminder.count({
      where: { status: 'PENDING', scheduledTime: { lt: now } },
    });

    if (overdueReminders > 0) {
      alerts.push({
        type: 'OVERDUE',
        title: '逾期用药提醒',
        description: `有 ${overdueReminders} 条用药提醒已逾期未处理`,
      });
    }

    return alerts;
  }
}
