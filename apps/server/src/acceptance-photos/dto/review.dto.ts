import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AcceptanceStatus } from '@prisma/client';

export class ReviewDto {
  @ApiProperty({ description: '审核结果', enum: AcceptanceStatus })
  @IsEnum(AcceptanceStatus)
  status: AcceptanceStatus;

  @ApiPropertyOptional({ description: '审核备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}
