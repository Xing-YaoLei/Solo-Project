import { Controller, Get, Query, Post } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { ResponsibilityParty } from '@prisma/client';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('close-duration')
  async getCloseDurationAnalysis(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('region') region?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('responsibility') responsibility?: ResponsibilityParty,
    @Query('problemTag') problemTag?: string,
  ) {
    return this.analysisService.getCloseDurationAnalysis({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      region,
      assigneeId,
      responsibility,
      problemTag,
    });
  }

  @Get('trend')
  async getTrendAnalysis(
    @Query('days') days = '30',
    @Query('region') region?: string,
    @Query('responsibility') responsibility?: ResponsibilityParty,
  ) {
    return this.analysisService.getTrendAnalysis({
      days: parseInt(days),
      region,
      responsibility,
    });
  }

  @Get('problem-tags')
  async getProblemTagAnalysis(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('region') region?: string,
  ) {
    return this.analysisService.getProblemTagAnalysis({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      region,
    });
  }

  @Get('performance')
  async getPerformanceByAssignee(
    @Query('days') days = '30',
    @Query('region') region?: string,
  ) {
    return this.analysisService.getPerformanceByAssignee({
      days: parseInt(days),
      region,
    });
  }

  @Get('dashboard')
  async getDashboardStats() {
    return this.analysisService.getDashboardStats();
  }

  @Post('clear-cache')
  async clearCache() {
    return this.analysisService.clearCache();
  }
}
