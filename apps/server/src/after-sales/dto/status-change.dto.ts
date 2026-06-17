import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AfterSalesStatus } from '@prisma/client';

export class StatusChangeDto {
  @ApiProperty({ description: '目标状态', enum: AfterSalesStatus })
  @IsEnum(AfterSalesStatus)
  status: AfterSalesStatus;

  @ApiPropertyOptional({ description: '状态变更备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class BatchStatusUpdateDto {
  @ApiProperty({ description: '工单ID列表', type: [String] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({ description: '目标状态', enum: AfterSalesStatus })
  @IsEnum(AfterSalesStatus)
  status: AfterSalesStatus;

  @ApiPropertyOptional({ description: '状态变更备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}
