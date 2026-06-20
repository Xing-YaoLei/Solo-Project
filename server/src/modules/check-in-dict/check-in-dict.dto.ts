import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCheckInDictDto {
  @IsString()
  code: string;

  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class UpdateCheckInDictDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class FilterCheckInDictDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class CreateCheckInRecordDto {
  @IsUUID()
  orderItemId: string;

  @IsString()
  dictCode: string;

  @IsUUID()
  checkedBy: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class FilterCheckInRecordDto {
  @IsOptional()
  @IsString()
  dictCode?: string;

  @IsOptional()
  @IsUUID()
  checkedBy?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
