import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReminderType, ReminderStatus } from '@prisma/client';
import { ReminderRecipientDto } from './create-reminder.dto';

export class UpdateReminderDto {
  @ApiPropertyOptional({ description: '提醒类型', enum: ReminderType })
  @IsOptional()
  @IsEnum(ReminderType)
  reminderType?: ReminderType;

  @ApiPropertyOptional({ description: '提醒标题' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '提醒内容' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '计划发送时间' })
  @IsOptional()
  @IsDateString()
  scheduledTime?: string;

  @ApiPropertyOptional({ description: '模板编码' })
  @IsOptional()
  @IsString()
  templateCode?: string;

  @ApiPropertyOptional({ description: '提醒状态', enum: ReminderStatus })
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;

  @ApiPropertyOptional({ description: '接收人列表', type: [ReminderRecipientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReminderRecipientDto)
  recipients?: ReminderRecipientDto[];
}
