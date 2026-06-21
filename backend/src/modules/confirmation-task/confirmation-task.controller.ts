import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfirmationTaskService } from './confirmation-task.service';
import {
  CreateConfirmationTaskDto,
  UpdateConfirmationTaskDto,
  AssignTaskDto,
  UpdateTaskStatusDto,
  QueryTasksDto,
  TaskImageDto,
} from './dto/confirmation-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { UserWithoutPassword } from '../auth/entities/auth.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BULL_QUEUES } from '../../common/bull/queue.constants';

@ApiTags('确认任务')
@Controller('confirmation-tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ConfirmationTaskController {
  constructor(
    private readonly confirmationTaskService: ConfirmationTaskService,
    @InjectQueue(BULL_QUEUES.REMINDER) private reminderQueue: Queue,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.FOREMAN, UserRole.DESIGNER)
  @ApiOperation({ summary: '创建确认任务' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(
    @Body() createTaskDto: CreateConfirmationTaskDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.confirmationTaskService.create(createTaskDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: '获取确认任务列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query() queryTasksDto: QueryTasksDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.confirmationTaskService.findAll(queryTasksDto, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取确认任务详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  async findOne(
    @Param('id') id: string,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.confirmationTaskService.findOne(id, currentUser);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.FOREMAN, UserRole.DESIGNER)
  @ApiOperation({ summary: '更新确认任务' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateConfirmationTaskDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.confirmationTaskService.update(id, updateTaskDto, currentUser);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除确认任务' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  async remove(
    @Param('id') id: string,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.confirmationTaskService.remove(id, currentUser);
  }

  @Post(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: '分派任务' })
  @ApiResponse({ status: 200, description: '分派成功' })
  async assign(
    @Param('id') id: string,
    @Body() assignTaskDto: AssignTaskDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.confirmationTaskService.assign(id, assignTaskDto, currentUser);
  }

  @Post(':id/status')
  @Patch(':id/status')
  @ApiOperation({ summary: '更新任务状态' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTaskStatusDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.confirmationTaskService.updateStatus(id, updateStatusDto, currentUser);
  }

  @Post(':id/images')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.FOREMAN, UserRole.DESIGNER)
  @ApiOperation({ summary: '添加任务图片' })
  @ApiResponse({ status: 201, description: '添加成功' })
  async addImages(
    @Param('id') id: string,
    @Body() images: TaskImageDto[],
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.confirmationTaskService.addImages(id, images, currentUser);
  }

  @Delete(':id/images/:imageId')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.FOREMAN, UserRole.DESIGNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除任务图片' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.confirmationTaskService.removeImage(id, imageId, currentUser);
  }

  @Post('check-overdue')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: '手动触发逾期检查' })
  @ApiResponse({ status: 200, description: '触发成功' })
  async triggerOverdueCheck() {
    await this.reminderQueue.add('check-all-overdue', {});
    return { message: '逾期检查已触发' };
  }

  @Post('check-missing-documents')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: '手动触发资料缺失检查' })
  @ApiResponse({ status: 200, description: '触发成功' })
  async triggerMissingDocumentsCheck() {
    await this.reminderQueue.add('check-all-missing-documents', {});
    return { message: '资料缺失检查已触发' };
  }
}
