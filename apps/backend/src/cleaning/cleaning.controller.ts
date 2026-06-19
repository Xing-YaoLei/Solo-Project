import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { CleaningService } from './cleaning.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, CleaningStatus } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('保洁任务')
@ApiBearerAuth()
@Controller('cleaning')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CleaningController {
  constructor(private readonly cleaningService: CleaningService) {}

  @Get()
  @ApiOperation({ summary: '获取保洁任务列表' })
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: CleaningStatus,
    @Query('assignedToId') assignedToId?: string,
    @Query('date') date?: string,
  ) {
    return this.cleaningService.findAll(req.user, {
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      propertyId: propertyId ? parseInt(propertyId) : undefined,
      status,
      assignedToId: assignedToId ? parseInt(assignedToId) : undefined,
      date,
    });
  }

  @Get('my')
  @ApiOperation({ summary: '获取我的保洁任务' })
  getMyTasks(
    @Req() req: any,
    @Query('status') status?: CleaningStatus,
    @Query('date') date?: string,
  ) {
    return this.cleaningService.getMyTasks(req.user.userId, { status, date });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取保洁任务详情' })
  findOne(@Param('id') id: string) {
    return this.cleaningService.findOne(parseInt(id));
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.FRONTLINE)
  @ApiOperation({ summary: '创建保洁任务' })
  create(@Body() createTaskDto: any, @Req() req: any) {
    return this.cleaningService.create(createTaskDto, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新保洁任务' })
  update(@Param('id') id: string, @Body() updateTaskDto: any, @Req() req: any) {
    return this.cleaningService.update(parseInt(id), updateTaskDto, req.user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '更新保洁任务状态' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: CleaningStatus,
    @Body('inspectionNotes') inspectionNotes: string,
    @Req() req: any,
  ) {
    return this.cleaningService.updateStatus(parseInt(id), status, req.user, inspectionNotes);
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '分配保洁任务' })
  assignTask(
    @Param('id') id: string,
    @Body('assignedToId') assignedToId: number,
  ) {
    return this.cleaningService.assignTask(parseInt(id), assignedToId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '删除保洁任务' })
  remove(@Param('id') id: string) {
    return this.cleaningService.remove(parseInt(id));
  }
}
