import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkerCheckinDto {
  @ApiProperty({ description: '项目ID' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: '工人ID' })
  @IsString()
  @IsNotEmpty()
  workerId: string;

  @ApiPropertyOptional({ description: '签到时间' })
  @IsDateString()
  @IsOptional()
  checkinTime?: string;

  @ApiPropertyOptional({ description: '签到地点' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: '签到照片URL' })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional({ description: '工种' })
  @IsString()
  @IsOptional()
  workType?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}
