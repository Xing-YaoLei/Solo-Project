import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum SignType {
  ON_SITE = '现场',
  REMOTE = '远程',
  LEAVE = '请假',
}

export class CheckInDto {
  @ApiProperty({ description: '开庭ID' })
  @IsString()
  @IsNotEmpty()
  hearingId: string;

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

  @ApiProperty({ description: '签到方式', enum: SignType, default: SignType.ON_SITE })
  @IsEnum(SignType)
  @IsOptional()
  signType?: SignType = SignType.ON_SITE;

  @ApiProperty({ description: '座位位置', required: false })
  @IsString()
  @IsOptional()
  seatLocation?: string;

  @ApiProperty({ description: '备注', required: false })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiProperty({ description: '记录人ID', required: false })
  @IsString()
  @IsOptional()
  recordedBy?: string;
}
