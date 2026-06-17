import { IsString, IsEnum, IsOptional, IsInt, IsDateString, IsArray, IsBoolean } from 'class-validator';
import { OrderSource, OrderStatus, DelayReason, ReviewTag } from '@prisma/client';

export class CreateRepairOrderDto {
  @IsEnum(OrderSource)
  source: OrderSource;

  @IsString()
  apartmentNo: string;

  @IsString()
  tenantName: string;

  @IsString()
  tenantPhone: string;

  @IsString()
  faultType: string;

  @IsString()
  faultDesc: string;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsDateString()
  planStartTime?: string;

  @IsOptional()
  @IsDateString()
  planEndTime?: string;
}

export class AssignOrderDto {
  @IsString()
  assignPersonId: string;

  @IsOptional()
  @IsDateString()
  planStartTime?: string;

  @IsOptional()
  @IsDateString()
  planEndTime?: string;
}

export class UpdateStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  operatorId?: string;
}

export class AddDelayRecordDto {
  @IsEnum(DelayReason)
  reason: DelayReason;

  @IsString()
  detail: string;

  @IsInt()
  duration: number;

  @IsString()
  reporterId: string;

  @IsOptional()
  @IsString()
  routeId?: string;
}

export class AddMaterialDto {
  @IsString()
  materialId: string;

  @IsInt()
  quantity: number;
}

export class CreateSignoffDto {
  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @IsOptional()
  @IsString()
  remark?: string;

  @IsString()
  signedBy: string;
}

export class UpdateReviewTagsDto {
  @IsArray()
  @IsEnum(ReviewTag, { each: true })
  tags: ReviewTag[];
}

export class QueryOrdersDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(OrderSource)
  source?: OrderSource;

  @IsOptional()
  @IsString()
  assignPersonId?: string;

  @IsOptional()
  @IsInt()
  page?: number;

  @IsOptional()
  @IsInt()
  pageSize?: number;

  @IsOptional()
  @IsString()
  keyword?: string;
}

export class CloseOrderDto {
  @IsOptional()
  @IsString()
  closeRemark?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ReviewTag, { each: true })
  reviewTags?: ReviewTag[];
}
