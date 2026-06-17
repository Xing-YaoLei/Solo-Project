import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { StatisticsService } from './statistics.service';
import { StatisticsQueryDto } from './dto/statistics-query.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('统计分析')
@ApiBearerAuth()
@Controller('statistics')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  @ApiOperation({ summary: '获取综合统计概览' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  getOverview(@Query() query: StatisticsQueryDto) {
    return this.statisticsService.getOverview(query);
  }

  @Get('project')
  @ApiOperation({ summary: '项目统计' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  getProjectStatistics(@Query() query: StatisticsQueryDto) {
    return this.statisticsService.getProjectStatistics(query);
  }

  @Get('schedule')
  @ApiOperation({ summary: '工期偏差统计' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  getScheduleDeviation(@Query() query: StatisticsQueryDto) {
    return this.statisticsService.getScheduleDeviation(query);
  }

  @Get('material')
  @ApiOperation({ summary: '材料延期统计' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  getMaterialDelayStatistics(@Query() query: StatisticsQueryDto) {
    return this.statisticsService.getMaterialDelayStatistics(query);
  }

  @Get('after-sales')
  @ApiOperation({ summary: '售后工单统计' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  getAfterSalesStatistics(@Query() query: StatisticsQueryDto) {
    return this.statisticsService.getAfterSalesStatistics(query);
  }
}
