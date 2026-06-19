import { IsString, IsOptional, IsInt, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class WorkOrderItemUpdateDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  itemName?: string;

  @IsString()
  @IsOptional()
  itemType?: string;

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

export class UpdateWorkOrderDto {
  @IsString()
  @IsOptional()
  vehicleId?: string;

  @IsString()
  @IsOptional()
  advisorId?: string;

  @IsString()
  @IsOptional()
  technicianId?: string;

  @IsInt()
  @IsOptional()
  mileageIn?: number;

  @IsInt()
  @IsOptional()
  mileageOut?: number;

  @IsString()
  @IsOptional()
  complaint?: string;

  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsNumber()
  @IsOptional()
  quoteAmount?: number;

  @IsNumber()
  @IsOptional()
  actualAmount?: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderItemUpdateDto)
  @IsOptional()
  items?: WorkOrderItemUpdateDto[];
}
