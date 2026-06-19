import { IsString, IsOptional, IsInt, Min, IsNumber } from 'class-validator';

export class UpdatePartDto {
  @IsString()
  @IsOptional()
  partNumber?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  specification?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsString()
  @IsOptional()
  supplierPhone?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
