import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';

@ApiTags('统计汇总')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly service: StatisticsService) {}

  @Get('overview')
  @ApiOperation({ summary: '获取总览统计' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getOverview(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getOverview(startDate, endDate);
  }

  @Get('by-source')
  @ApiOperation({ summary: '按来源渠道统计' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getBySource(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getBySource(startDate, endDate);
  }

  @Get('by-person')
  @ApiOperation({ summary: '按责任人统计' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getByPerson(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getByPerson(startDate, endDate);
  }

  @Get('by-review-tags')
  @ApiOperation({ summary: '按复盘标签统计' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getByReviewTags(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getByReviewTags(startDate, endDate);
  }

  @Get('delay-reasons')
  @ApiOperation({ summary: '延误原因统计' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getDelayReasons(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getDelayReasons(startDate, endDate);
  }

  @Get('daily-trend')
  @ApiOperation({ summary: '每日趋势统计' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getDailyTrend(@Query('days') days?: string) {
    return this.service.getDailyTrend(days ? parseInt(days) : 30);
  }
}
