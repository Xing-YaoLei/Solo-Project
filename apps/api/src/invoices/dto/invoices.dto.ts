import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '@legal/shared';

export class CreateInvoiceDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  @IsNotEmpty()
  paymentStatus: PaymentStatus;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;
}
