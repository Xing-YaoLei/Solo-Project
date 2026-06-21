import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { TaskStatus, VerificationStep } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  orderNo!: string;

  @IsString()
  @IsNotEmpty()
  riderId!: string;

  @IsString()
  @IsNotEmpty()
  pickupAddress!: string;

  @IsString()
  @IsNotEmpty()
  deliveryAddress!: string;

  @IsString()
  @IsNotEmpty()
  itemName!: string;

  @IsNumber()
  @IsOptional()
  itemQuantity?: number;

  @IsNumber()
  @IsOptional()
  itemValue?: number;

  @IsNumber()
  @IsOptional()
  estimatedAmount?: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateTaskDto {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(VerificationStep)
  @IsOptional()
  currentStep?: VerificationStep;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  dispatchedById?: string;

  @IsArray()
  @IsOptional()
  photos?: any[];

  @IsArray()
  @IsOptional()
  evaluationTags?: string[];

  @IsBoolean()
  @IsOptional()
  addressMatched?: boolean;

  @IsString()
  @IsOptional()
  addressNote?: string;
}
