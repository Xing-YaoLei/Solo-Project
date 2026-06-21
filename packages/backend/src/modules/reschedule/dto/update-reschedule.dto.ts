import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { RescheduleReason } from '@prisma/client';

export class UpdateRescheduleDto {
  @ApiPropertyOptional({ description: '改约原因', enum: RescheduleReason })
  @IsEnum(RescheduleReason)
  @IsOptional()
  reason?: RescheduleReason;

  @ApiPropertyOptional({ description: '具体原因说明', example: '当事人突发疾病无法出庭' })
  @IsString()
  @IsOptional()
  reasonDetail?: string;

  @ApiPropertyOptional({ description: '新开始时间', example: '2025-01-15T09:00:00Z' })
  @IsDateString()
  @IsOptional()
  newStartTime?: string;

  @ApiPropertyOptional({ description: '新结束时间', example: '2025-01-15T11:00:00Z' })
  @IsDateString()
  @IsOptional()
  newEndTime?: string;

  @ApiPropertyOptional({ description: '新开庭ID（若已创建新开庭）', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  rescheduledHearingId?: string;

  @ApiPropertyOptional({ description: '备注', example: '请尽快协调新时间' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: '通知状态', example: 'SENT' })
  @IsString()
  @IsOptional()
  notificationStatus?: string;
}
