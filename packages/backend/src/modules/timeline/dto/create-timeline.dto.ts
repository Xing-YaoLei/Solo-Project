import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export enum TimelineChangeType {
  SCHEDULE = '排期',
  CONFIRM = '确认',
  START = '开始',
  COMPLETE = '完成',
  RESCHEDULE = '改约',
  CANCEL = '取消',
  POSTPONE = '延期',
  ATTENDANCE = '到场',
  EXCEPTION = '异常',
  REMINDER = '提醒',
  CONFLICT = '冲突',
  OTHER = '其他',
}

export class CreateTimelineDto {
  @ApiProperty({ description: '开庭ID' })
  @IsString()
  @IsNotEmpty()
  hearingId: string;

  @ApiProperty({ description: '变更前状态', required: false })
  @IsString()
  @IsOptional()
  previousStatus?: string;

  @ApiProperty({ description: '变更后状态' })
  @IsString()
  @IsNotEmpty()
  newStatus: string;

  @ApiProperty({ description: '变更类型', enum: TimelineChangeType })
  @IsString()
  @IsNotEmpty()
  changeType: string;

  @ApiProperty({ description: '变更说明', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '操作人ID' })
  @IsString()
  @IsNotEmpty()
  operatorId: string;

  @ApiProperty({ description: '操作人姓名' })
  @IsString()
  @IsNotEmpty()
  operatorName: string;

  @ApiProperty({ description: '变更原因', required: false })
  @IsString()
  @IsOptional()
  changeReason?: string;

  @ApiProperty({ description: '其他变更相关数据', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
