import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../common/prisma/prisma.service';
import { ComplaintStatus } from '@prisma/client';

@Processor('overdue')
export class OverdueProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) {
    super();
  }

  async process(_job: Job<any, any, string>): Promise<any> {
    const now = new Date();
    const overdueComplaints = await this.prisma.complaint.findMany({
      where: {
        deadlineAt: { lt: now },
        status: { notIn: [ComplaintStatus.CLOSED, ComplaintStatus.OVERDUE] },
      },
    });

    for (const complaint of overdueComplaints) {
      await this.prisma.complaint.update({
        where: { id: complaint.id },
        data: { status: ComplaintStatus.OVERDUE },
      });

      await this.prisma.operationLog.create({
        data: {
          complaintId: complaint.id,
          operatorId: 'system',
          operatorName: '系统',
          action: 'OVERDUE',
          detail: `工单已超时，自动标记为超时状态`,
        },
      });
    }

    return { processed: overdueComplaints.length };
  }
}
