import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { DisputeStatus } from '@prisma/client';

export class CreateDisputeDto {
  @ApiProperty({ example: '水电验收争议' })
  @IsString()
  title: string;

  @ApiProperty({ example: '水电施工不符合规范要求', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '施工质量问题', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateDisputeDto extends PartialType(CreateDisputeDto) {
  @ApiProperty({ enum: DisputeStatus, required: false })
  @IsEnum(DisputeStatus)
  @IsOptional()
  status?: DisputeStatus;
}

export class ResolveDisputeDto {
  @ApiProperty({ example: '已重新整改，符合规范要求' })
  @IsString()
  resolution: string;
}
