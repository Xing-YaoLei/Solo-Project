import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BatchOperationType, ChangeOrderStatus } from '@prisma/client';

export class CreateBatchOperationDto {
  @ApiProperty({ description: '批量操作类型', enum: BatchOperationType })
  @IsEnum(BatchOperationType)
  @IsNotEmpty()
  type: BatchOperationType;

  @ApiProperty({ description: '批量操作名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '批量操作描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '实体ID列表', type: [String] })
  @IsArray()
  @IsNotEmpty()
  entityIds: string[];

  @ApiPropertyOptional({ description: '目标状态（状态更新时使用）', enum: ChangeOrderStatus })
  @IsEnum(ChangeOrderStatus)
  @IsOptional()
  targetStatus?: ChangeOrderStatus;

  @ApiPropertyOptional({ description: '分配给的用户ID（分配时使用）' })
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}
