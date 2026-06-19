import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskStatus } from '@prisma/client';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  findAll(
    @Query('scheduleId') scheduleId?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('status') status?: TaskStatus,
    @Query('type') type?: string,
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
  ) {
    return this.taskService.findAll({
      scheduleId: scheduleId ? parseInt(scheduleId) : undefined,
      assigneeId: assigneeId ? parseInt(assigneeId) : undefined,
      status,
      type,
      page,
      pageSize,
    });
  }

  @Get('board/:scheduleId')
  getTaskBoard(@Param('scheduleId', ParseIntPipe) scheduleId: number) {
    return this.taskService.getTaskBoard(scheduleId);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findById(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.taskService.create(data);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    const { operatorId, ...rest } = data;
    return this.taskService.update(id, rest, operatorId ? parseInt(operatorId) : undefined);
  }

  @Put(':id/assign')
  assign(@Param('id', ParseIntPipe) id: number, @Body() data: { assigneeId: number; operatorId?: number }) {
    return this.taskService.assign(id, data.assigneeId, data.operatorId);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { status: TaskStatus; operatorId?: number; remark?: string },
  ) {
    return this.taskService.updateStatus(id, data.status, data.operatorId, data.remark);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Query('operatorId') operatorId?: string) {
    return this.taskService.remove(id, operatorId ? parseInt(operatorId) : undefined);
  }
}
