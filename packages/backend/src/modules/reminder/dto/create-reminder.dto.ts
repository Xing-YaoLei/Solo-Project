import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReminderType } from '@prisma/client';

export class ReminderRecipientDto {
  @ApiPropertyOptional({ description: '用户ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: '客户ID' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({ description: '接收人姓名' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ description: '联系方式：邮箱/手机号等' })
  @IsString()
  @IsNotEmpty()
  recipientContact: string;

  @ApiProperty({ description: '联系方式类型：email/phone/wechat等' })
  @IsString()
  @IsNotEmpty()
  contactType: string;
}

export class CreateReminderDto {
  @ApiProperty({ description: '关联开庭ID' })
  @IsUUID()
  @IsNotEmpty()
  hearingId: string;

  @ApiProperty({ description: '提醒类型', enum: ReminderType })
  @IsEnum(ReminderType)
  @IsNotEmpty()
  reminderType: ReminderType;

  @ApiProperty({ description: '提醒标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '提醒内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '计划发送时间' })
  @IsDateString()
  @IsNotEmpty()
  scheduledTime: string;

  @ApiPropertyOptional({ description: '模板编码' })
  @IsOptional()
  @IsString()
  templateCode?: string;

  @ApiProperty({ description: '接收人列表', type: [ReminderRecipientDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReminderRecipientDto)
  recipients: ReminderRecipientDto[];
}
