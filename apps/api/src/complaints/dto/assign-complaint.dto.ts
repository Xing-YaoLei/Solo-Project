import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignComplaintDto {
  @ApiProperty()
  @IsString()
  toUserId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class ReassignComplaintDto extends AssignComplaintDto {}
