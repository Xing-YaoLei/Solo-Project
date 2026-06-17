import { IsOptional, IsString, IsInt, Min, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ChangeOrderStatus } from '@prisma/client';

export class QueryChangeOrderDto {
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

  @ApiPropertyOptional({ description: '状态', enum: ChangeOrderStatus, isArray: true })
  @IsEnum(ChangeOrderStatus, { each: true })
  @IsArray()
  @IsOptional()
  status?: ChangeOrderStatus[];

  @ApiPropertyOptional({ description: '设计师ID' })
  @IsString()
  @IsOptional()
  designerId?: string;

  @ApiPropertyOptional({ description: '关键词搜索（标题、描述）' })
  @IsString()
  @IsOptional()
  keyword?: string;
}
