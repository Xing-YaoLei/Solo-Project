import { IsArray, IsString, IsNotEmpty, ArrayMinSize } from 'class-validator';
import { WorkOrderStatus } from '@prisma/client';

export class BatchUpdateStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  ids: string[];

  @IsString()
  @IsNotEmpty()
  status: WorkOrderStatus;

  @IsString()
  @IsNotEmpty()
  operatorId: string;
}
