import { IsOptional, IsString, IsInt, Min, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LogAction } from '@prisma/client';

export class QueryOperationLogDto {
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

  @ApiPropertyOptional({ description: '实体类型' })
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiPropertyOptional({ description: '实体ID' })
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({ description: '操作类型', enum: LogAction, isArray: true })
  @IsEnum(LogAction, { each: true })
  @IsArray()
  @IsOptional()
  actions?: LogAction[];

  @ApiPropertyOptional({ description: '操作人ID' })
  @IsString()
  @IsOptional()
  operatorId?: string;

  @ApiPropertyOptional({ description: '批量操作ID' })
  @IsString()
  @IsOptional()
  batchOperationId?: string;

  @ApiPropertyOptional({ description: '关键词搜索（备注）' })
  @IsString()
  @IsOptional()
  keyword?: string;
}
