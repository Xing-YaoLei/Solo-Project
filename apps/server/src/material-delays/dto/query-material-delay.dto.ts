import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MaterialDelayStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryMaterialDelayDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;

  @ApiPropertyOptional({ description: '项目ID' })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ description: '状态', enum: MaterialDelayStatus })
  @IsEnum(MaterialDelayStatus)
  @IsOptional()
  status?: MaterialDelayStatus;

  @ApiPropertyOptional({ description: '材料名称搜索' })
  @IsString()
  @IsOptional()
  keyword?: string;
}
