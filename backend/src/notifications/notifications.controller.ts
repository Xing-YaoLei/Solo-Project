import { Controller, Get, Put, Param, Body, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationStatus } from '@prisma/client';

@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Query('userId') userId: string,
    @Query('status') status?: NotificationStatus,
  ) {
    return this.notificationsService.findAll(userId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Get('unread/count')
  getUnreadCount(@Query('userId') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Put('read/all')
  markAllAsRead(@Body() data: { userId: string }) {
    return this.notificationsService.markAllAsRead(data.userId);
  }
}
