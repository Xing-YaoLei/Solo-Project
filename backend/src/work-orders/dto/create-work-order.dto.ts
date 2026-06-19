import { IsString, IsNotEmpty, IsOptional, IsArray, IsInt, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class WorkOrderItemDto {
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsString()
  @IsNotEmpty()
  itemType: string;

  @IsNumber()
  @IsOptional()
  laborHours?: number;

  @IsNumber()
  @IsOptional()
  laborAmount?: number;

  @IsNumber()
  @IsOptional()
  partAmount?: number;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateWorkOrderDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsString()
  @IsNotEmpty()
  advisorId: string;

  @IsString()
  @IsOptional()
  technicianId?: string;

  @IsInt()
  @IsOptional()
  mileageIn?: number;

  @IsString()
  @IsOptional()
  complaint?: string;

  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsNumber()
  @IsOptional()
  quoteAmount?: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderItemDto)
  @IsOptional()
  items?: WorkOrderItemDto[];
}
