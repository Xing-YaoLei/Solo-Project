import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BatchOperationType } from '@prisma/client';

export class QueryBatchOperationDto {
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

  @ApiPropertyOptional({ description: '批量操作类型', enum: BatchOperationType })
  @IsEnum(BatchOperationType)
  @IsOptional()
  type?: BatchOperationType;

  @ApiPropertyOptional({ description: '操作人ID' })
  @IsString()
  @IsOptional()
  operatorId?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: '关键词搜索（名称、描述）' })
  @IsString()
  @IsOptional()
  keyword?: string;
}
