import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsOptional()
  vin?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  mileage?: number;

  @IsString()
  @IsOptional()
  color?: string;

  @IsInt()
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  engineNumber?: string;

  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @IsString()
  @IsNotEmpty()
  ownerPhone: string;

  @IsString()
  @IsOptional()
  ownerEmail?: string;

  @IsString()
  @IsOptional()
  ownerAddress?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
