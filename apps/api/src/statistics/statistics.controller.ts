import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Roles } from '@/auth/roles.decorator';
import { Permissions } from '@/auth/permissions.decorator';
import { UserRole, Permission, IssueSeverity, EvidenceCategory, AuditType } from '@prisma/client';

@ApiTags('统计分析')
@Controller('statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Permissions(Permission.STATISTICS_VIEW)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '仪表盘概览统计' })
  getDashboard() {
    return this.statisticsService.getDashboard();
  }

  @Get('tasks')
  @ApiOperation({ summary: '任务维度统计' })
  @ApiQuery({ name: 'auditType', enum: AuditType, required: false })
  getTaskStats(
    @Query('department') department?: string,
    @Query('auditType') auditType?: AuditType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getTaskStats({ department, startDate, endDate, auditType });
  }

  @Get('evidences')
  @ApiOperation({ summary: '证据维度统计' })
  @ApiQuery({ name: 'category', enum: EvidenceCategory, required: false })
  getEvidenceStats(
    @Query('category') category?: EvidenceCategory,
    @Query('taskId') taskId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getEvidenceStats({ category, taskId, startDate, endDate });
  }

  @Get('issues')
  @ApiOperation({ summary: '问题维度统计' })
  @ApiQuery({ name: 'severity', enum: IssueSeverity, required: false })
  getIssueStats(
    @Query('category') category?: string,
    @Query('department') department?: string,
    @Query('severity') severity?: IssueSeverity,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getIssueStats({ category, department, severity, startDate, endDate });
  }

  @Get('issues/recurrence-trend')
  @ApiOperation({ summary: '问题复发趋势统计' })
  getRecurrenceTrend(@Query('months') months?: string) {
    return this.statisticsService.getRecurrenceTrend(months ? parseInt(months, 10) : 6);
  }

  @Get('users')
  @ApiOperation({ summary: '用户维度统计' })
  getUserStats() {
    return this.statisticsService.getUserStats();
  }

  @Get('reviews')
  @ApiOperation({ summary: '复核维度统计' })
  getReviewStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getReviewStats({ startDate, endDate });
  }

  @Get('drill-down')
  @ApiOperation({ summary: '穿透查询（支持多维度）' })
  @ApiQuery({
    name: 'dimension',
    required: true,
    schema: {
      type: 'string',
      enum: [
        'task_status',
        'task_department',
        'issue_severity',
        'issue_category',
        'evidence_category',
        'issue_recurred',
      ],
    },
  })
  drillDown(
    @Query('dimension') dimension: string,
    @Query('value') value: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.drillDown(dimension, value, { startDate, endDate });
  }
}
