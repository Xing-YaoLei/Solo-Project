import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemInputDto {
  @IsUUID()
  ticketTypeId: string;

  @IsOptional()
  @IsUUID()
  seatId?: string;

  @IsNumber()
  @Type(() => Number)
  unitPrice: number;
}

export class CreateOrderDto {
  @IsUUID()
  eventId: string;

  @IsString()
  buyerName: string;

  @IsString()
  buyerPhone: string;

  @IsOptional()
  @IsString()
  buyerEmail?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];
}

export class UpdateOrderStatusDto {
  @IsEnum(['paid', 'cancelled', 'refunded'])
  status: string;
}

export class AssignOrderDto {
  @IsUUID()
  assigneeId: string;
}

export class FilterOrderDto {
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsEnum(['pending', 'paid', 'cancelled', 'refunded'])
  status?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

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
