import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDisputeDto {
  @IsUUID()
  orderId: string;

  @IsUUID()
  orderItemId: string;

  @IsOptional()
  @IsUUID()
  refundRuleId?: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsObject()
  evidence?: object;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsUUID()
  operatorId: string;
}

export class UpdateDisputeStatusDto {
  @IsEnum(['approved', 'rejected', 'closed'])
  status: string;

  @IsUUID()
  operatorId: string;
}

export class AssignDisputeDto {
  @IsUUID()
  assigneeId: string;

  @IsUUID()
  operatorId: string;
}

export class FilterDisputeDto {
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected', 'closed'])
  status?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

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

export class FilterNotificationDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRead?: boolean;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
