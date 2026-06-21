import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { RiskLevel, DamageStatus } from '@prisma/client';

export class CreateDamageDto {
  @IsString()
  @IsNotEmpty()
  taskId!: string;

  @IsEnum(RiskLevel)
  riskLevel!: RiskLevel;

  @IsString()
  @IsNotEmpty()
  damageType!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsArray()
  @IsOptional()
  photos?: any[];

  @IsNumber()
  @IsOptional()
  estimatedLoss?: number;
}

export class UpdateDamageDto {
  @IsEnum(DamageStatus)
  @IsOptional()
  status?: DamageStatus;

  @IsEnum(RiskLevel)
  @IsOptional()
  riskLevel?: RiskLevel;

  @IsNumber()
  @IsOptional()
  actualLoss?: number;

  @IsNumber()
  @IsOptional()
  compensation?: number;

  @IsString()
  @IsOptional()
  responsibility?: string;

  @IsString()
  @IsOptional()
  handledById?: string;
}

export class AddCommunicationDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsArray()
  @IsOptional()
  attachments?: any[];
}

export class AddReviewDto {
  @IsString()
  @IsNotEmpty()
  conclusion!: string;

  @IsString()
  @IsOptional()
  suggestion?: string;

  @IsBoolean()
  approved!: boolean;
}
