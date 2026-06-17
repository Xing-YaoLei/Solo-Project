import { Controller, Get, Patch, Post, Param, Query, Body, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { FollowUpTasksService } from './follow-up-tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { IsString, IsNotEmpty, IsBoolean, IsDateString } from 'class-validator';

class UpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}

class AddReviewNoteDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

class SubmitPharmacistOpinionDto {
  @IsString()
  @IsNotEmpty()
  opinion: string;

  @IsBoolean()
  isApproved: boolean;
}

class SubmitBatchExpiryDto {
  @IsString()
  @IsNotEmpty()
  batchNo: string;

  @IsDateString()
  productionDate: string;

  @IsDateString()
  expiryDate: string;

  @IsString()
  @IsNotEmpty()
  shelfLife: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('follow-up-tasks')
export class FollowUpTasksController {
  constructor(private followUpTasksService: FollowUpTasksService) {}

  @Roles('ADMIN', 'MANAGER')
  @Get()
  async findAll(@Query() query: { status?: string; riskLevel?: string }) {
    return this.followUpTasksService.findAll({
      status: query.status,
      riskLevel: query.riskLevel,
    });
  }

  @Get('my-tasks')
  async findMyTasks(@Req() req: any, @Query() query: { status?: string; riskLevel?: string }) {
    return this.followUpTasksService.findMyTasks(req.user.id, {
      status: query.status,
      riskLevel: query.riskLevel,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const task = await this.followUpTasksService.findOne(id);
    if (!task) {
      return null;
    }
    const isManager = req.user.role === 'ADMIN' || req.user.role === 'MANAGER';
    if (!isManager && task.assigneeId !== req.user.id) {
      throw new ForbiddenException('无权访问此任务');
    }
    return task;
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto, @Req() req: any) {
    const task = await this.followUpTasksService.findOne(id);
    const isManager = req.user.role === 'ADMIN' || req.user.role === 'MANAGER';
    if (!isManager && task && task.assigneeId !== req.user.id) {
      throw new ForbiddenException('无权修改此任务');
    }
    return this.followUpTasksService.updateStatus(id, updateStatusDto.status);
  }

  @Post(':id/notes')
  async addReviewNote(@Param('id') id: string, @Body() dto: AddReviewNoteDto, @Req() req: any) {
    const task = await this.followUpTasksService.findOne(id);
    const isManager = req.user.role === 'ADMIN' || req.user.role === 'MANAGER';
    if (!isManager && task && task.assigneeId !== req.user.id) {
      throw new ForbiddenException('无权操作此任务');
    }
    return this.followUpTasksService.addReviewNote(id, {
      authorId: req.user.id,
      authorName: req.user.name,
      authorRole: req.user.role,
      type: dto.type,
      content: dto.content,
    });
  }

  @Roles('ADMIN', 'MANAGER', 'PHARMACIST')
  @Post(':id/pharmacist-opinion')
  async submitPharmacistOpinion(@Param('id') id: string, @Body() dto: SubmitPharmacistOpinionDto, @Req() req: any) {
    const task = await this.followUpTasksService.findOne(id);
    const isManager = req.user.role === 'ADMIN' || req.user.role === 'MANAGER';
    if (!isManager && task && task.assigneeId !== req.user.id) {
      throw new ForbiddenException('无权操作此任务');
    }
    return this.followUpTasksService.submitPharmacistOpinion(id, {
      pharmacistId: req.user.id,
      pharmacistName: req.user.name,
      opinion: dto.opinion,
      isApproved: dto.isApproved,
    });
  }

  @Post(':id/batch-expiry')
  async submitBatchExpiry(@Param('id') id: string, @Body() dto: SubmitBatchExpiryDto, @Req() req: any) {
    const task = await this.followUpTasksService.findOne(id);
    const isManager = req.user.role === 'ADMIN' || req.user.role === 'MANAGER';
    if (!isManager && task && task.assigneeId !== req.user.id) {
      throw new ForbiddenException('无权操作此任务');
    }
    return this.followUpTasksService.submitBatchExpiry(id, {
      ...dto,
      verifiedBy: req.user.name,
    });
  }
}
