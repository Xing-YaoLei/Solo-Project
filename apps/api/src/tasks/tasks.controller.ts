import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { BatchUpdateDto } from './dto/batch-update.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Roles } from '@/auth/roles.decorator';
import { Permissions } from '@/auth/permissions.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole, Permission, TaskStatus, TaskPriority, AuditType, OperationAction } from '@prisma/client';
import { UseInterceptors } from '@nestjs/common';
import { OperationLogInterceptor, OperationLog } from '@/common/interceptors/operation-log.interceptor';

@ApiTags('审计任务')
@Controller('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(OperationLogInterceptor)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.COMPLIANCE_OFFICER, UserRole.AUDITOR)
  @Permissions(Permission.TASK_CREATE)
  @OperationLog({
    targetType: 'AuditTask',
    action: 'CREATE' as any,
    description: '创建审计任务',
  })
  @ApiOperation({ summary: '创建任务' })
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: { id: string }) {
    return this.tasksService.create(createTaskDto, user.id);
  }

  @Get()
  @Permissions(Permission.TASK_VIEW)
  @ApiOperation({ summary: '获取任务列表' })
  @ApiQuery({ name: 'status', enum: TaskStatus, required: false })
  @ApiQuery({ name: 'priority', enum: TaskPriority, required: false })
  @ApiQuery({ name: 'auditType', enum: AuditType, required: false })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'createdById', required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'auditPeriod', required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('auditType') auditType?: AuditType,
    @Query('assignedToId') assignedToId?: string,
    @Query('createdById') createdById?: string,
    @Query('businessOwnerId') businessOwnerId?: string,
    @Query('department') department?: string,
    @Query('auditPeriod') auditPeriod?: string,
  ) {
    return this.tasksService.findAll(pagination, {
      status,
      priority,
      auditType,
      assignedToId,
      createdById,
      businessOwnerId,
      department,
      auditPeriod,
    });
  }

  @Get('kanban')
  @Permissions(Permission.TASK_VIEW)
  @ApiOperation({ summary: '获取看板数据' })
  getKanban(@CurrentUser() user: { id: string; role: UserRole }) {
    const userId =
      user.role === UserRole.ADMIN || user.role === UserRole.MANAGEMENT
        ? undefined
        : user.id;
    return this.tasksService.getKanbanData(userId);
  }

  @Get('stats')
  @Permissions(Permission.TASK_VIEW)
  @ApiOperation({ summary: '获取任务统计' })
  getStats() {
    return this.tasksService.getTaskStats();
  }

  @Get(':id')
  @Permissions(Permission.TASK_VIEW)
  @ApiOperation({ summary: '获取任务详情' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @Permissions(Permission.TASK_EDIT)
  @OperationLog({
    targetType: 'AuditTask',
    action: 'UPDATE' as any,
    targetIdField: 'id',
    description: '更新任务信息',
  })
  @ApiOperation({ summary: '更新任务' })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @Permissions(Permission.TASK_DELETE)
  @OperationLog({
    targetType: 'AuditTask',
    action: 'DELETE' as any,
    targetIdField: 'id',
    description: '删除任务',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除任务' })
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  @Post(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @Permissions(Permission.TASK_ASSIGN)
  @OperationLog({
    targetType: 'AuditTask',
    action: 'ASSIGN' as any,
    targetIdField: 'id',
    description: '分派任务',
  })
  @ApiOperation({ summary: '分派任务' })
  assign(@Param('id') id: string, @Body() assignTaskDto: AssignTaskDto) {
    return this.tasksService.assign(id, assignTaskDto);
  }

  @Post('batch')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @Permissions(Permission.TASK_BATCH_UPDATE)
  @OperationLog({
    targetType: 'AuditTask',
    action: 'BATCH_UPDATE' as any,
    description: '批量更新任务',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量更新任务(分派/状态变更)' })
  batchUpdate(
    @Body() batchUpdateDto: BatchUpdateDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.tasksService.batchUpdate(batchUpdateDto, user.id);
  }
}
