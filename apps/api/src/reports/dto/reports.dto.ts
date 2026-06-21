import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { CaseType, PaymentStatus } from '@legal/shared';

export class MonthlyReportQueryDto {
  @IsNumber()
  year: number;

  @IsNumber()
  month: number;

  @IsEnum(CaseType)
  @IsOptional()
  caseType?: CaseType;

  @IsString()
  @IsOptional()
  lawyerId?: string;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;
}
