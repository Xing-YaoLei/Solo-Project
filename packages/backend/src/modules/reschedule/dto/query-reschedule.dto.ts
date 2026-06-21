import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { RescheduleReason } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryRescheduleDto extends PaginationDto {
  @ApiPropertyOptional({ description: '原开庭ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  originalHearingId?: string;

  @ApiPropertyOptional({ description: '改约后开庭ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  rescheduledHearingId?: string;

  @ApiPropertyOptional({ description: '改约原因', enum: RescheduleReason })
  @IsEnum(RescheduleReason)
  @IsOptional()
  reason?: RescheduleReason;

  @ApiPropertyOptional({ description: '是否已审批', example: false })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isApproved?: boolean;

  @ApiPropertyOptional({ description: '发起人ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  initiatedBy?: string;

  @ApiPropertyOptional({ description: '审批人ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  approverId?: string;

  @ApiPropertyOptional({ description: '申请开始日期', example: '2025-01-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '申请结束日期', example: '2025-01-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: '搜索关键字（原因/备注）' })
  @IsString()
  @IsOptional()
  keyword?: string;
}
