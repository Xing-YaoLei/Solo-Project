import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString } from 'class-validator';
import { QualityCheckResult } from '@prisma/client';

export class CreateQualityCheckDto {
  @IsString()
  @IsNotEmpty()
  workOrderId: string;

  @IsString()
  @IsNotEmpty()
  inspectorId: string;

  @IsNotEmpty()
  result: QualityCheckResult;

  @IsArray()
  @IsOptional()
  photos?: string[];

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsDateString()
  checkDate: string;
}
