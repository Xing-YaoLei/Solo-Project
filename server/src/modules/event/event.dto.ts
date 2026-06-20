import { IsString, IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  venue: string;

  @IsDateString()
  eventDate: string;

  @IsOptional()
  @IsEnum(['draft', 'published', 'ongoing', 'ended'])
  status?: string;

  @IsUUID()
  managerId: string;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsEnum(['draft', 'published', 'ongoing', 'ended'])
  status?: string;

  @IsOptional()
  @IsUUID()
  managerId?: string;
}

export class FilterEventDto {
  @IsOptional()
  @IsEnum(['draft', 'published', 'ongoing', 'ended'])
  status?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsUUID()
  managerId?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
