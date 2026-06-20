import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTicketTypeDto {
  @IsUUID()
  eventId: string;

  @IsString()
  name: string;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsInt()
  @Type(() => Number)
  quota: number;

  @IsOptional()
  rules?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  refundable?: boolean;

  @IsOptional()
  @IsBoolean()
  transferable?: boolean;
}

export class UpdateTicketTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  quota?: number;

  @IsOptional()
  rules?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  refundable?: boolean;

  @IsOptional()
  @IsBoolean()
  transferable?: boolean;
}

export class FilterTicketTypeDto {
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
