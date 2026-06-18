import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { ReportQueryDto } from './dto/report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { UserWithoutPassword } from '../auth/entities/auth.entity';

@ApiTags('报表统计')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '获取首页统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDashboardStats(@GetUser() currentUser: UserWithoutPassword) {
    return this.reportService.getDashboardStats(currentUser);
  }

  @Get('task-stats')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: '获取任务统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTaskStats(
    @Query() query: ReportQueryDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.reportService.getTaskStats(query, currentUser);
  }

  @Get('confirmation-time')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: '获取确认耗时统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getConfirmationTimeReport(
    @Query() query: ReportQueryDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.reportService.getConfirmationTimeReport(query, currentUser);
  }

  @Get('unconfirmed-amount')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: '获取未确认金额统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUnconfirmedAmountReport(
    @Query() query: ReportQueryDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.reportService.getUnconfirmedAmountReport(query, currentUser);
  }

  @Get('rework-reasons')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: '获取返工原因统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getReworkReasonReport(
    @Query() query: ReportQueryDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.reportService.getReworkReasonReport(query, currentUser);
  }

  @Get('projects')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: '获取项目统计报表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getProjectStats(
    @Query() query: ReportQueryDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.reportService.getProjectStats(query, currentUser);
  }
}
