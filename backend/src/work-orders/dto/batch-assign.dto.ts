import { IsArray, IsString, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class BatchAssignDto {
  @IsArray()
  @ArrayMinSize(1)
  ids: string[];

  @IsString()
  @IsNotEmpty()
  technicianId: string;

  @IsString()
  @IsNotEmpty()
  operatorId: string;
}
