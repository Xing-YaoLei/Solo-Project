import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { MaterialType } from '@legal/shared';

export class MaterialUploadDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(MaterialType)
  type: MaterialType;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsNumber()
  @IsOptional()
  pageTotal?: number;

  @IsOptional()
  missingPages?: number[];
}
