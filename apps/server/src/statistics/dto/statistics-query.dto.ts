import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum StatisticsType {
  PROJECT = 'project',
  SCHEDULE = 'schedule',
  MATERIAL = 'material',
  AFTER_SALES = 'after_sales',
}

export enum TimeRange {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export class StatisticsQueryDto {
  @ApiPropertyOptional({ description: '项目ID' })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: '时间范围', enum: TimeRange })
  @IsEnum(TimeRange)
  @IsOptional()
  timeRange?: TimeRange;

  @ApiPropertyOptional({ description: '统计类型', enum: StatisticsType })
  @IsEnum(StatisticsType)
  @IsOptional()
  type?: StatisticsType;
}
