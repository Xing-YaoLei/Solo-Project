import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { HearingStatus } from '@prisma/client';

export class UpdateHearingStatusDto {
  @ApiProperty({ description: '新状态', enum: HearingStatus })
  @IsEnum(HearingStatus)
  status: HearingStatus;

  @ApiProperty({ description: '操作人ID' })
  @IsString()
  @IsNotEmpty()
  operatorId: string;

  @ApiPropertyOptional({ description: '变更说明' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '变更原因' })
  @IsOptional()
  @IsString()
  changeReason?: string;
}
