import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AttendanceStatus } from '@prisma/client';

export class QueryAttendanceDto extends PaginationDto {
  @ApiProperty({ description: '开庭ID', required: false })
  @IsString()
  @IsOptional()
  hearingId?: string;

  @ApiProperty({ description: '用户ID', required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: '客户ID', required: false })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ description: '到场人类型', required: false })
  @IsString()
  @IsOptional()
  attendeeType?: string;

  @ApiProperty({ description: '到场状态', enum: AttendanceStatus, required: false })
  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @ApiProperty({ description: '签到方式', required: false })
  @IsString()
  @IsOptional()
  signType?: string;
}
