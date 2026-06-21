import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ConflictType } from '@prisma/client';

export class DetectConflictDto {
  @ApiPropertyOptional({ description: '开庭ID（已有开庭检测时传入）', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  hearingId?: string;

  @ApiProperty({ description: '案件ID', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  caseId: string;

  @ApiProperty({ description: '法庭ID', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  courtRoomId: string;

  @ApiProperty({ description: '开始时间', example: '2025-01-01T09:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: '结束时间', example: '2025-01-01T11:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ description: '指定检测类型，不传则检测所有类型', enum: ConflictType, isArray: true })
  @IsEnum(ConflictType, { each: true })
  @IsOptional()
  checkTypes?: ConflictType[];
}
