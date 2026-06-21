import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CheckOutDto {
  @ApiProperty({ description: '签到记录ID' })
  @IsString()
  @IsNotEmpty()
  attendanceRecordId: string;

  @ApiProperty({ description: '备注', required: false })
  @IsString()
  @IsOptional()
  remark?: string;
}
