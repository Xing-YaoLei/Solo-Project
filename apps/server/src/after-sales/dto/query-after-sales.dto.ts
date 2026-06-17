import { IsOptional, IsString, IsInt, Min, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AfterSalesStatus } from '@prisma/client';

export class QueryAfterSalesDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '项目ID' })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ description: '状态', enum: AfterSalesStatus, isArray: true })
  @IsEnum(AfterSalesStatus, { each: true })
  @IsArray()
  @IsOptional()
  status?: AfterSalesStatus[];

  @ApiPropertyOptional({ description: '优先级' })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ description: '处理人ID' })
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({ description: '报告人ID' })
  @IsString()
  @IsOptional()
  reporterId?: string;

  @ApiPropertyOptional({ description: '关键词搜索（标题、描述）' })
  @IsString()
  @IsOptional()
  keyword?: string;
}
