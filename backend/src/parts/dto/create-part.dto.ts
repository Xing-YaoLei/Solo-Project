import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsNumber } from 'class-validator';

export class CreatePartDto {
  @IsString()
  @IsNotEmpty()
  partNumber: string;

  @IsString()
  @IsNotEmpty()
  name: string;

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
