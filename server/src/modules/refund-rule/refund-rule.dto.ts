import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsNumber,
  IsEnum,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRefundRuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  ticketTypeId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  beforeDays?: number;

  @IsNumber()
  @Type(() => Number)
  refundPercent: number;

  @IsOptional()
  @IsObject()
  materials?: object;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class UpdateRefundRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  ticketTypeId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  beforeDays?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  refundPercent?: number;

  @IsOptional()
  @IsObject()
  materials?: object;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class FilterRefundRuleDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  ticketTypeId?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
