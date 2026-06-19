import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { PartRequestStatus, PartRequestSource } from '@prisma/client';

export class UpdatePartRequestDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsOptional()
  status?: PartRequestStatus;

  @IsOptional()
  source?: PartRequestSource;

  @IsString()
  @IsOptional()
  beforeMaterial?: string;

  @IsString()
  @IsOptional()
  afterMaterial?: string;

  @IsString()
  @IsOptional()
  handlingNotes?: string;
}
