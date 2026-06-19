import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ConflictsService } from './conflicts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ConflictStatus, ConflictRiskLevel, UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('房态冲突')
@ApiBearerAuth()
@Controller('conflicts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConflictsController {
  constructor(private readonly conflictsService: ConflictsService) {}

  @Get()
  @ApiOperation({ summary: '获取冲突列表' })
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: ConflictStatus,
    @Query('riskLevel') riskLevel?: ConflictRiskLevel,
    @Query('roomId') roomId?: string,
  ) {
    return this.conflictsService.findAll(req.user, {
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      propertyId: propertyId ? parseInt(propertyId) : undefined,
      status,
      riskLevel,
      roomId: roomId ? parseInt(roomId) : undefined,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取冲突统计' })
  getStatistics(@Query('propertyId') propertyId?: string) {
    return this.conflictsService.getStatistics(
      propertyId ? parseInt(propertyId) : undefined,
    );
  }

  @Get('high-risk')
  @ApiOperation({ summary: '获取高风险冲突' })
  getHighRiskConflicts(@Query('propertyId') propertyId?: string) {
    return this.conflictsService.getHighRiskConflicts(
      propertyId ? parseInt(propertyId) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取冲突详情' })
  findOne(@Param('id') id: string) {
    return this.conflictsService.findOne(parseInt(id));
  }

  @Post()
  @ApiOperation({ summary: '创建冲突记录' })
  create(@Body() createConflictDto: any, @Req() req: any) {
    return this.conflictsService.create(createConflictDto, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新冲突记录' })
  update(@Param('id') id: string, @Body() updateConflictDto: any, @Req() req: any) {
    return this.conflictsService.update(parseInt(id), updateConflictDto, req.user);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '更新冲突状态' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ConflictStatus,
    @Body('resolution') resolution: string,
    @Req() req: any,
  ) {
    return this.conflictsService.updateStatus(
      parseInt(id),
      status,
      req.user.userId,
      resolution,
    );
  }

  @Post(':id/communications')
  @ApiOperation({ summary: '添加沟通记录' })
  addCommunication(
    @Param('id') id: string,
    @Body('message') message: string,
    @Body('attachments') attachments: any,
    @Req() req: any,
  ) {
    return this.conflictsService.addCommunication(
      parseInt(id),
      req.user.userId,
      message,
      attachments,
    );
  }

  @Post(':id/reviews')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '添加复核意见' })
  addReviewRecord(
    @Param('id') id: string,
    @Body('reviewType') reviewType: string,
    @Body('opinion') opinion: string,
    @Body('isApproved') isApproved: boolean,
    @Req() req: any,
  ) {
    return this.conflictsService.addReviewRecord(
      parseInt(id),
      req.user.userId,
      reviewType,
      opinion,
      isApproved,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '删除冲突记录' })
  remove(@Param('id') id: string) {
    return this.conflictsService.remove(parseInt(id));
  }
}
