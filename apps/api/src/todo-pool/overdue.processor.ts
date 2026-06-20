import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../common/prisma/prisma.service';
import { ComplaintStatus } from '@prisma/client';

const SYSTEM_USER_ID = 'system-user-0000-0000-0000-000000000001';
const SYSTEM_USER_NAME = '系统';

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

    let processed = 0;
    for (const complaint of overdueComplaints) {
      try {
        await this.prisma.complaint.update({
          where: { id: complaint.id },
          data: { status: ComplaintStatus.OVERDUE },
        });

        await this.prisma.operationLog.create({
          data: {
            complaintId: complaint.id,
            operatorId: SYSTEM_USER_ID,
            operatorName: SYSTEM_USER_NAME,
            action: 'OVERDUE',
            detail: `工单已超时，自动标记为超时状态`,
          },
        });
        processed++;
      } catch (e) {
        console.error(`处理超时工单 ${complaint.id} 失败:`, e);
      }
    }

    return { processed };
  }
}
