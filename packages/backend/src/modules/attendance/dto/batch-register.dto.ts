import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsArray,
} from 'class-validator';

export enum BatchAttendanceStatus {
  ARRIVED = 'ARRIVED',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  EXCUSED = 'EXCUSED',
  LEAVE_EARLY = 'LEAVE_EARLY',
}

export class BatchAttendanceItem {
  @ApiProperty({ description: '到场人类型：律师/客户/法官/其他工作人员' })
  @IsString()
  @IsNotEmpty()
  attendeeType: string;

  @ApiProperty({ description: '用户ID（系统用户时填写）', required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: '客户ID（客户时填写）', required: false })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ description: '到场人姓名' })
  @IsString()
  @IsNotEmpty()
  personName: string;

  @ApiProperty({ description: '计划角色', required: false })
  @IsString()
  @IsOptional()
  plannedRole?: string;

  @ApiProperty({ description: '到场状态', enum: BatchAttendanceStatus, default: BatchAttendanceStatus.ARRIVED })
  @IsEnum(BatchAttendanceStatus)
  @IsOptional()
  status?: BatchAttendanceStatus = BatchAttendanceStatus.ARRIVED;

  @ApiProperty({ description: '签到方式', required: false })
  @IsString()
  @IsOptional()
  signType?: string;

  @ApiProperty({ description: '备注', required: false })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class BatchRegisterDto {
  @ApiProperty({ description: '开庭ID' })
  @IsString()
  @IsNotEmpty()
  hearingId: string;

  @ApiProperty({ description: '批量登记列表', type: [BatchAttendanceItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchAttendanceItem)
  items: BatchAttendanceItem[];

  @ApiProperty({ description: '记录人ID', required: false })
  @IsString()
  @IsOptional()
  recordedBy?: string;
}
