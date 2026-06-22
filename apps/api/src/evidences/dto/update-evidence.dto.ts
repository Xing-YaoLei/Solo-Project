import { PartialType } from '@nestjs/swagger';
import { CreateEvidenceDto } from './create-evidence.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EvidenceStatus } from '@prisma/client';

export class UpdateEvidenceDto extends PartialType(CreateEvidenceDto) {
  @ApiPropertyOptional({ description: '证据状态', enum: EvidenceStatus })
  @IsEnum(EvidenceStatus, { message: '证据状态不正确' })
  @IsOptional()
  status?: EvidenceStatus;
}
