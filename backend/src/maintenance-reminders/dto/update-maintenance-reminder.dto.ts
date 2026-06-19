import { IsString, IsOptional, IsInt, Min, IsBoolean, IsDateString } from 'class-validator';
import { MaintenanceType } from '@prisma/client';

export class UpdateMaintenanceReminderDto {
  @IsOptional()
  type?: MaintenanceType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  lastMileage?: number;

  @IsDateString()
  @IsOptional()
  lastDate?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  nextMileage?: number;

  @IsDateString()
  @IsOptional()
  nextDate?: string;

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @IsString()
  @IsOptional()
  responsibleId?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
