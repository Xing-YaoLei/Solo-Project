import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;
    const models = [
      this.user,
      this.auditTask,
      this.evidence,
      this.attachment,
      this.evidenceSupplement,
      this.reviewRecord,
      this.checklist,
      this.checklistItem,
      this.checklistExecution,
      this.checklistItemResult,
      this.samplingRecord,
      this.samplingItem,
      this.notificationTemplate,
      this.notification,
      this.operationLog,
      this.unauthorizedAccess,
      this.issue,
    ];
    return Promise.all(models.map((model) => (model as any).deleteMany()));
  }
}
