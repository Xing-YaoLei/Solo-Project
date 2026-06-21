import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { MaterialType, MaterialStatus } from '@legal/shared';

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(MaterialType)
  materialType: MaterialType;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsNumber()
  fileSize: number;

  @IsNumber()
  @IsOptional()
  pageTotal?: number;

  @IsOptional()
  missingPages?: number[];
}

export class UpdateMaterialDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(MaterialStatus)
  @IsOptional()
  status?: MaterialStatus;

  @IsString()
  @IsOptional()
  reviewNote?: string;

  @IsNumber()
  @IsOptional()
  pageTotal?: number;

  @IsOptional()
  missingPages?: number[];
}

export class ResubmitMaterialDto {
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  @IsOptional()
  reviewNote?: string;
}

export class MarkMissingPagesDto {
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  missingPages: number[];

  @IsString()
  @IsOptional()
  note?: string;
}

export class AddMissingMaterialDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(MaterialType)
  @IsNotEmpty()
  materialType: MaterialType;

  @IsString()
  @IsOptional()
  note?: string;
}
