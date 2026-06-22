import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Roles } from '@/auth/roles.decorator';
import { Permissions } from '@/auth/permissions.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole, Permission, ReviewResult, ReviewTargetType } from '@prisma/client';
import { UseInterceptors } from '@nestjs/common';
import { OperationLogInterceptor, OperationLog } from '@/common/interceptors/operation-log.interceptor';

@ApiTags('复核记录')
@Controller('reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(OperationLogInterceptor)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.COMPLIANCE_OFFICER)
  @Permissions(Permission.REVIEW_CONDUCT)
  @OperationLog({
    targetType: 'ReviewRecord',
    action: 'REVIEW' as any,
    description: '执行复核',
  })
  @ApiOperation({ summary: '提交复核' })
  create(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.reviewsService.create(createReviewDto, user.id);
  }

  @Get()
  @Permissions(Permission.REVIEW_VIEW)
  @ApiOperation({ summary: '获取复核记录列表' })
  @ApiQuery({ name: 'targetType', enum: ReviewTargetType, required: false })
  @ApiQuery({ name: 'result', enum: ReviewResult, required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('targetType') targetType?: ReviewTargetType,
    @Query('targetId') targetId?: string,
    @Query('result') result?: ReviewResult,
    @Query('reviewerId') reviewerId?: string,
    @Query('taskId') taskId?: string,
    @Query('evidenceId') evidenceId?: string,
  ) {
    return this.reviewsService.findAll(pagination, {
      targetType,
      targetId,
      result,
      reviewerId,
      taskId,
      evidenceId,
    });
  }

  @Get('history')
  @Permissions(Permission.REVIEW_VIEW)
  @ApiOperation({ summary: '查询复核历史' })
  @ApiQuery({ name: 'targetType', enum: ReviewTargetType })
  getHistory(
    @Query('targetType') targetType: ReviewTargetType,
    @Query('targetId') targetId: string,
  ) {
    return this.reviewsService.getReviewHistory(targetType, targetId);
  }

  @Get(':id')
  @Permissions(Permission.REVIEW_VIEW)
  @ApiOperation({ summary: '获取复核记录详情' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Get('target/:targetType/:targetId')
  @Permissions(Permission.REVIEW_VIEW)
  @ApiOperation({ summary: '获取目标的所有复核记录' })
  findByTarget(
    @Param('targetType') targetType: ReviewTargetType,
    @Param('targetId') targetId: string,
  ) {
    return this.reviewsService.findByTarget(targetType, targetId);
  }
}
