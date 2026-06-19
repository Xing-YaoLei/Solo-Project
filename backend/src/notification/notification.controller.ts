import { Controller, Get, Put, Param, Query, ParseIntPipe, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('user/:userId')
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('isRead') isRead?: string,
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
  ) {
    return this.notificationService.findByUser(userId, {
      isRead: isRead === 'true',
      page,
      pageSize,
    });
  }

  @Get('user/:userId/unread-count')
  getUnreadCount(@Param('userId', ParseIntPipe) userId: number) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Put(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.markAsRead(id);
  }

  @Put('user/:userId/read-all')
  markAllAsRead(@Param('userId', ParseIntPipe) userId: number) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Put('notify-role/:role')
  notifyRoles(@Param('role') role: string, @Body() data: any) {
    return this.notificationService.notifyRoles(role, data);
  }
}
