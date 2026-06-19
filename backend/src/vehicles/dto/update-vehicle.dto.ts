import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  plateNumber?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

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
  @IsOptional()
  ownerName?: string;

  @IsString()
  @IsOptional()
  ownerPhone?: string;

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
