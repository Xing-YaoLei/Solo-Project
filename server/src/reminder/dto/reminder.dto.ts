import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsIn, IsArray } from 'class-validator';

export class CreateReminderDto {
  @ApiProperty()
  @IsString()
  elderId!: string;

  @ApiProperty()
  @IsString()
  medicationName!: string;

  @ApiProperty()
  @IsString()
  dosage!: string;

  @ApiProperty()
  @IsString()
  frequency!: string;

  @ApiProperty()
  @IsDateString()
  scheduledTime!: string;

  @ApiProperty()
  @IsString()
  @IsIn(['MORNING', 'AFTERNOON', 'EVENING'])
  shift!: string;
}

export class UpdateReminderStatusDto {
  @ApiProperty()
  @IsString()
  @IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'REFUSED', 'ADVERSE_REACTION'])
  status!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  administeredBy?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class BulkCheckDto {
  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  elderIds?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsIn(['MORNING', 'AFTERNOON', 'EVENING'])
  shift?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  date?: string;
}
