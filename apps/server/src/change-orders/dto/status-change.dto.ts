import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChangeOrderStatus } from '@prisma/client';

export class StatusChangeDto {
  @ApiProperty({ description: '目标状态', enum: ChangeOrderStatus })
  @IsEnum(ChangeOrderStatus)
  status: ChangeOrderStatus;

  @ApiPropertyOptional({ description: '状态变更备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class BatchStatusUpdateDto {
  @ApiProperty({ description: '变更单ID列表', type: [String] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({ description: '目标状态', enum: ChangeOrderStatus })
  @IsEnum(ChangeOrderStatus)
  status: ChangeOrderStatus;

  @ApiPropertyOptional({ description: '状态变更备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}
