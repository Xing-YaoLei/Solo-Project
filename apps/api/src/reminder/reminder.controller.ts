import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { ReminderChannel } from '@prisma/client';

@Controller('reminders')
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Get()
  async getReminders(
    @Query('recipientId') recipientId: string,
    @Query('read') read?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.reminderService.getReminders({
      recipientId,
      read: read !== undefined ? read === 'true' : undefined,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  }

  @Get('unread-count/:recipientId')
  async getUnreadCount(@Param('recipientId') recipientId: string) {
    const count = await this.reminderService.getUnreadCount(recipientId);
    return { count };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Body() data: { recipientId: string }) {
    return this.reminderService.markAsRead(id, data.recipientId);
  }

  @Put('read-all/:recipientId')
  async markAllAsRead(@Param('recipientId') recipientId: string) {
    return this.reminderService.markAllAsRead(recipientId);
  }

  @Post('send')
  async sendReminder(@Body() data: any) {
    return this.reminderService.sendReminder(data);
  }

  @Post('process/:channel')
  async processQueue(@Param('channel') channel: ReminderChannel) {
    await this.reminderService.processQueue(channel);
    return { success: true };
  }
}
