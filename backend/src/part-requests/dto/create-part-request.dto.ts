import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { PartRequestSource } from '@prisma/client';

export class CreatePartRequestDto {
  @IsString()
  @IsNotEmpty()
  workOrderId: string;

  @IsString()
  @IsNotEmpty()
  partId: string;

  @IsInt()
  @Min(1)
  quantity: number;

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
  requesterId?: string;
}
