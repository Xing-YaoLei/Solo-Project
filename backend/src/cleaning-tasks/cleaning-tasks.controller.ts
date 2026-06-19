import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { CleaningTasksService } from './cleaning-tasks.service';
import { CleaningTaskStatus } from '@prisma/client';

@Controller('api/cleaning-tasks')
export class CleaningTasksController {
  constructor(private readonly cleaningTasksService: CleaningTasksService) {}

  @Get()
  findAll(
    @Query('status') status?: CleaningTaskStatus,
    @Query('propertyId') propertyId?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cleaningTasksService.findAll({
      status,
      propertyId,
      assignedToId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cleaningTasksService.findOne(id);
  }

  @Post()
  create(@Body() data: {
    propertyId: string;
    bookingId?: string;
    taskDate: Date;
    scheduledStart: Date;
    scheduledEnd: Date;
    priority?: string;
    notes?: string;
    createdById?: string;
  }) {
    return this.cleaningTasksService.create(data);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: {
      taskDate?: Date;
      scheduledStart?: Date;
      scheduledEnd?: Date;
      priority?: string;
      notes?: string;
      status?: CleaningTaskStatus;
      updatedById?: string;
    },
  ) {
    const { updatedById, ...rest } = data;
    return this.cleaningTasksService.update(id, rest, updatedById);
  }

  @Put(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() data: { assignedToId: string; assignedById?: string },
  ) {
    return this.cleaningTasksService.assign(id, data.assignedToId, data.assignedById);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() data: {
      status: CleaningTaskStatus;
      updatedById?: string;
      reason?: string;
    },
  ) {
    return this.cleaningTasksService.updateStatus(
      id,
      data.status,
      data.updatedById,
      data.reason,
    );
  }
}
