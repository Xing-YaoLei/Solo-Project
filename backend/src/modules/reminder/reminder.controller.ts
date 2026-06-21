import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, HttpCode, HttpStatus, Put, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReminderService } from './reminder.service';
import { QueryRemindersDto } from './dto/reminder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserWithoutPassword } from '../auth/entities/auth.entity';

@ApiTags('提醒系统')
@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Get()
  @ApiOperation({ summary: '获取提醒列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query() queryRemindersDto: QueryRemindersDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.reminderService.findAll(queryRemindersDto, currentUser);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读提醒数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUnreadCount(@GetUser() currentUser: UserWithoutPassword) {
    return this.reminderService.getUnreadCount(currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取提醒详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '提醒不存在' })
  async findOne(
    @Param('id') id: string,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.reminderService.findOne(id, currentUser);
  }

  @Put(':id/read')
  @Patch(':id/read')
  @ApiOperation({ summary: '标记提醒为已读' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async markAsRead(
    @Param('id') id: string,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.reminderService.markAsRead(id, currentUser);
  }

  @Post('mark-all-read')
  @Post('read-all')
  @Patch('read-all')
  @ApiOperation({ summary: '标记所有提醒为已读' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async markAllAsRead(@GetUser() currentUser: UserWithoutPassword) {
    return this.reminderService.markAllAsRead(currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除提醒' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '提醒不存在' })
  async delete(
    @Param('id') id: string,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.reminderService.delete(id, currentUser);
  }
}
