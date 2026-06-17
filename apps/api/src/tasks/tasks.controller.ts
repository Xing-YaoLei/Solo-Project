import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common'
import { TasksService } from './tasks.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { TaskStatus, TaskType, Priority } from '@prisma/client'

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async findAll(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('type') type?: TaskType,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: Priority,
    @Query('assigneeId') assigneeId?: string,
    @Query('creatorId') creatorId?: string,
    @Query('propertyId') propertyId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('keyword') keyword?: string,
    @Query('pool') pool?: string,
  ) {
    return this.tasksService.findAll({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      type,
      status,
      priority,
      assigneeId,
      creatorId,
      propertyId,
      tenantId,
      keyword,
      pool,
    })
  }

  @Get('stats')
  async getStats() {
    return this.tasksService.getStats()
  }

  @Get('types')
  async getTypes() {
    return this.tasksService.getTaskTypes()
  }

  @Get('statuses')
  async getStatuses() {
    return this.tasksService.getTaskStatuses()
  }

  @Get('priorities')
  async getPriorities() {
    return this.tasksService.getPriorities()
  }

  @Get('mine')
  async getMyTasks(@Req() req: any, @Query('status') status?: TaskStatus) {
    return this.tasksService.getMyTasks(req.user.userId, status)
  }

  @Get('overdue')
  async getOverdueTasks() {
    return this.tasksService.getOverdueTasks()
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id)
  }

  @Post()
  async create(@Body() data: any, @Req() req: any) {
    return this.tasksService.create(data, req.user.userId)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.tasksService.update(id, data, req.user.userId)
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TaskStatus,
    @Body('remark') remark: string,
    @Req() req: any,
  ) {
    return this.tasksService.updateStatus(id, status, req.user.userId, remark)
  }

  @Put(':id/assign')
  async assign(
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string,
    @Body('remark') remark: string,
    @Req() req: any,
  ) {
    return this.tasksService.assign(id, assigneeId, req.user.userId, remark)
  }

  @Put(':id/reassign')
  async reassign(
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    return this.tasksService.reassign(id, assigneeId, req.user.userId, reason)
  }

  @Put(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body('rejectReason') rejectReason: string,
    @Req() req: any,
  ) {
    return this.tasksService.reject(id, rejectReason, req.user.userId)
  }

  @Put(':id/resubmit')
  async resubmit(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.tasksService.resubmit(id, req.user.userId, data)
  }

  @Post(':id/materials')
  async addMaterials(
    @Param('id') id: string,
    @Body('materials') materials: any[],
    @Req() req: any,
  ) {
    return this.tasksService.addMaterials(id, materials, req.user.userId)
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body('content') content: string,
    @Body('attachments') attachments: any[],
    @Req() req: any,
  ) {
    return this.tasksService.addComment(id, content, req.user.userId, attachments)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.tasksService.delete(id)
  }
}
