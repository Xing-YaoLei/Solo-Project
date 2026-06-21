import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ApproveRescheduleDto {
  @ApiProperty({ description: '审批人ID', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  approverId: string;

  @ApiProperty({ description: '是否批准', example: true })
  @IsBoolean()
  @IsNotEmpty()
  approved: boolean;

  @ApiPropertyOptional({ description: '审批意见', example: '同意改约，请协调新时间并通知各方' })
  @IsString()
  @IsOptional()
  approverNotes?: string;
}
