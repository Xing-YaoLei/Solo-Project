import {
  IsString,
  IsOptional,
  IsInt,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

class SeatZoneInputDto {
  @IsString()
  name: string;

  @IsString()
  area: string;

  @IsInt()
  rowCount: number;

  @IsInt()
  colCount: number;

  @IsNumber()
  price: number;
}

export class CreateSeatMapDto {
  @IsUUID()
  eventId: string;

  @IsString()
  name: string;

  @IsInt()
  totalSeats: number;

  @IsOptional()
  @IsInt()
  thresholdWarn?: number;

  @IsOptional()
  @IsInt()
  thresholdFull?: number;

  @IsOptional()
  layoutData?: Record<string, unknown>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatZoneInputDto)
  zones: SeatZoneInputDto[];
}

export class UpdateSeatMapDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  totalSeats?: number;

  @IsOptional()
  layoutData?: Record<string, unknown>;
}

export class UpdateThresholdDto {
  @IsInt()
  thresholdWarn: number;

  @IsInt()
  thresholdFull: number;
}

export class FilterSeatAvailabilityDto {
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsEnum(['available', 'sold', 'locked', 'disabled'])
  status?: string;
}
