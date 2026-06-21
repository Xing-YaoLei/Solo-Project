import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class AttendanceStatsDto {
  @ApiProperty({ description: '开庭ID（不传则按时间范围统计）', required: false })
  @IsString()
  @IsOptional()
  hearingId?: string;

  @ApiProperty({ description: '开始日期', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: '结束日期', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: '到场人类型', required: false })
  @IsString()
  @IsOptional()
  attendeeType?: string;
}

export class AttendanceStatsResultDto {
  @ApiProperty({ description: '总人数' })
  total: number;

  @ApiProperty({ description: '已到场' })
  arrived: number;

  @ApiProperty({ description: '迟到' })
  late: number;

  @ApiProperty({ description: '缺席' })
  absent: number;

  @ApiProperty({ description: '请假' })
  excused: number;

  @ApiProperty({ description: '早退' })
  leaveEarly: number;

  @ApiProperty({ description: '未到场' })
  notArrived: number;

  @ApiProperty({ description: '签到方式统计' })
  signTypeStats: Record<string, number>;

  @ApiProperty({ description: '到场率（百分比）' })
  attendanceRate: number;
}
