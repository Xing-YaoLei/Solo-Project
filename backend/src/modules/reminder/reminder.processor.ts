import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BULL_QUEUES } from '../../common/bull/queue.constants';
import { ReminderType, ReminderStatus, TaskStatus } from '@prisma/client';

@Processor(BULL_QUEUES.REMINDER)
@Injectable()
export class ReminderProcessor {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('check-overdue')
  async handleCheckOverdue(job: Job<{ taskId: string }>) {
    this.logger.log(`Checking overdue for task: ${job.data.taskId}`);

    const task = await this.prisma.confirmationTask.findUnique({
      where: { id: job.data.taskId },
    });

    if (!task) {
      this.logger.warn(`Task not found: ${job.data.taskId}`);
      return;
    }

    if (task.status === TaskStatus.PENDING && task.deadline && new Date(task.deadline) < new Date()) {
      await this.prisma.confirmationTask.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.OVERDUE,
          isOverdue: true,
        },
      });

      await this.createOverdueReminder(task.id, task.projectId);
      this.logger.log(`Task marked as overdue: ${task.id}`);
    }
  }

  @Process('task-assigned')
  async handleTaskAssigned(job: Job<{ taskId: string; userId: string }>) {
    this.logger.log(`Task assigned reminder for user: ${job.data.userId}`);

    const task = await this.prisma.confirmationTask.findUnique({
      where: { id: job.data.taskId },
    });

    if (!task) {
      return;
    }

    await this.prisma.reminder.create({
      data: {
        userId: job.data.userId,
        taskId: job.data.taskId,
        type: ReminderType.TASK_ASSIGNED,
        title: '您有新的任务被分派',
        content: `任务"${task.title}"已分派给您，请及时处理。`,
        status: ReminderStatus.SENT,
        sentAt: new Date(),
      },
    });
  }

  @Process('task-overdue')
  async handleTaskOverdue(job: Job<{ taskId: string; projectManagerId: string }>) {
    this.logger.log(`Task overdue reminder: ${job.data.taskId}`);

    const task = await this.prisma.confirmationTask.findUnique({
      where: { id: job.data.taskId },
      include: { project: true },
    });

    if (!task) {
      return;
    }

    if (task.project?.projectManagerId) {
      await this.prisma.reminder.create({
        data: {
          userId: task.project.projectManagerId,
          taskId: job.data.taskId,
          type: ReminderType.OVERDUE,
          title: '任务逾期提醒',
          content: `任务"${task.title}"已逾期，请及时跟进。`,
          status: ReminderStatus.SENT,
          sentAt: new Date(),
        },
      });
    }
  }

  @Process('dispute-opened')
  async handleDisputeOpened(job: Job<{ disputeId: string; taskId: string; userId: string }>) {
    this.logger.log(`Dispute opened reminder for user: ${job.data.userId}`);

    const task = await this.prisma.confirmationTask.findUnique({
      where: { id: job.data.taskId },
    });

    if (!task) {
      return;
    }

    await this.prisma.reminder.create({
      data: {
        userId: job.data.userId,
        taskId: job.data.taskId,
        type: ReminderType.DISPUTE_OPENED,
        title: '新的争议已提出',
        content: `任务"${task.title}"有新的争议，请及时处理。`,
        status: ReminderStatus.SENT,
        sentAt: new Date(),
      },
    });
  }

  @Process('send-reminder')
  async handleSendReminder(job: Job<{ reminderId: string }>) {
    this.logger.log(`Sending reminder: ${job.data.reminderId}`);

    const reminder = await this.prisma.reminder.findUnique({
      where: { id: job.data.reminderId },
    });

    if (!reminder) {
      return;
    }

    await this.prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        status: ReminderStatus.SENT,
        sentAt: new Date(),
      },
    });

    this.logger.log(`Reminder sent: ${reminder.id}`);
  }

  private async createOverdueReminder(taskId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return;
    }

    const userIds: string[] = [];

    if (project.ownerId) {
      userIds.push(project.ownerId);
    }
    if (project.projectManagerId) {
      userIds.push(project.projectManagerId);
    }

    for (const userId of userIds) {
      await this.prisma.reminder.create({
        data: {
          userId,
          taskId,
          type: ReminderType.OVERDUE,
          title: '任务逾期提醒',
          content: '您有一个确认任务已逾期，请及时处理。',
          status: ReminderStatus.SENT,
          sentAt: new Date(),
        },
      });
    }
  }
}
