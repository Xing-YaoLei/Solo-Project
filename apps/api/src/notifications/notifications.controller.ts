import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, HttpCode, HttpStatus, Patch, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, SendTemplatedNotificationDto, MarkReadDto, CreateTemplateDto, UpdateTemplateDto } from './dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Roles } from '@/auth/roles.decorator';
import { Permissions } from '@/auth/permissions.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole, Permission, NotificationType } from '@prisma/client';

@ApiTags('通知消息')
@Controller('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @ApiOperation({ summary: '手动创建通知' })
  create(@Body() createDto: CreateNotificationDto) {
    return this.notificationsService.create(createDto);
  }

  @Post('template/send')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.COMPLIANCE_OFFICER)
  @Permissions(Permission.TEMPLATE_USE)
  @ApiOperation({ summary: '按模板批量发送通知' })
  sendTemplated(@Body() sendDto: SendTemplatedNotificationDto) {
    return this.notificationsService.sendTemplated(sendDto);
  }

  @Get('mine')
  @ApiOperation({ summary: '获取当前用户的通知列表' })
  @ApiQuery({ name: 'type', enum: NotificationType, required: false })
  findMine(
    @CurrentUser() user: { id: string },
    @Query() pagination: PaginationDto,
    @Query('type') type?: NotificationType,
    @Query('isRead') isRead?: string,
  ) {
    return this.notificationsService.findByUser(user.id, pagination, {
      type,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
    });
  }

  @Get('mine/unread-count')
  @ApiOperation({ summary: '获取当前用户未读通知数' })
  getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Post('mine/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '标记当前用户的通知为已读' })
  markRead(
    @CurrentUser() user: { id: string },
    @Body() markReadDto: MarkReadDto,
  ) {
    return this.notificationsService.markRead(user.id, markReadDto);
  }

  @Delete('mine/:id')
  @ApiOperation({ summary: '删除当前用户的通知' })
  removeMine(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.remove(id, user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @ApiOperation({ summary: '管理员：获取所有通知' })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('type') type?: NotificationType,
    @Query('recipientId') recipientId?: string,
    @Query('isRead') isRead?: string,
    @Query('taskId') taskId?: string,
  ) {
    return this.notificationsService.findAll(pagination, {
      type,
      recipientId,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      taskId,
    });
  }

  @Get('templates')
  @Permissions(Permission.TEMPLATE_VIEW)
  @ApiOperation({ summary: '获取通知模板列表' })
  findTemplates(
    @Query() pagination: PaginationDto,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.notificationsService.findTemplates(pagination, {
      category,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('templates/:id')
  @Permissions(Permission.TEMPLATE_VIEW)
  @ApiOperation({ summary: '获取通知模板详情' })
  findOneTemplate(@Param('id') id: string) {
    try {
      return this.notificationsService.findOneTemplate(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Post('templates')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @Permissions(Permission.TEMPLATE_CREATE)
  @ApiOperation({ summary: '创建通知模板' })
  createTemplate(
    @Body() createDto: CreateTemplateDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.createTemplate({
      ...createDto,
      createdById: user.id,
    });
  }

  @Patch('templates/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @Permissions(Permission.TEMPLATE_EDIT)
  @ApiOperation({ summary: '更新通知模板' })
  updateTemplate(
    @Param('id') id: string,
    @Body() updateDto: UpdateTemplateDto,
  ) {
    try {
      return this.notificationsService.updateTemplate(id, updateDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Delete('templates/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @Permissions(Permission.TEMPLATE_EDIT)
  @ApiOperation({ summary: '删除通知模板' })
  deleteTemplate(@Param('id') id: string) {
    try {
      return this.notificationsService.deleteTemplate(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
}
