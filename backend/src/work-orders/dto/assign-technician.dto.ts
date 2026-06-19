import { IsString, IsNotEmpty } from 'class-validator';

export class AssignTechnicianDto {
  @IsString()
  @IsNotEmpty()
  technicianId: string;

  @IsString()
  @IsNotEmpty()
  operatorId: string;
}
