import { Controller, Get, Patch, Post, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { FollowUpTasksService } from './follow-up-tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsDateString } from 'class-validator';

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

  @IsString()
  @IsNotEmpty()
  verifiedBy: string;
}

@UseGuards(JwtAuthGuard)
@Controller('follow-up-tasks')
export class FollowUpTasksController {
  constructor(private followUpTasksService: FollowUpTasksService) {}

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
  async findOne(@Param('id') id: string) {
    return this.followUpTasksService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.followUpTasksService.updateStatus(id, updateStatusDto.status);
  }

  @Post(':id/notes')
  async addReviewNote(@Param('id') id: string, @Body() dto: AddReviewNoteDto, @Req() req: any) {
    return this.followUpTasksService.addReviewNote(id, {
      authorId: req.user.id,
      authorName: req.user.name,
      authorRole: req.user.role,
      type: dto.type,
      content: dto.content,
    });
  }

  @Post(':id/pharmacist-opinion')
  async submitPharmacistOpinion(@Param('id') id: string, @Body() dto: SubmitPharmacistOpinionDto, @Req() req: any) {
    return this.followUpTasksService.submitPharmacistOpinion(id, {
      pharmacistId: req.user.id,
      pharmacistName: req.user.name,
      opinion: dto.opinion,
      isApproved: dto.isApproved,
    });
  }

  @Post(':id/batch-expiry')
  async submitBatchExpiry(@Param('id') id: string, @Body() dto: SubmitBatchExpiryDto) {
    return this.followUpTasksService.submitBatchExpiry(id, dto);
  }
}
