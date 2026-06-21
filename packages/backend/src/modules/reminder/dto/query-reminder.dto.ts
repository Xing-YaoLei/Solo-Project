import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ReminderType, ReminderStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryReminderDto extends PaginationDto {
  @ApiPropertyOptional({ description: '关联开庭ID' })
  @IsOptional()
  @IsUUID()
  hearingId?: string;

  @ApiPropertyOptional({ description: '提醒类型', enum: ReminderType })
  @IsOptional()
  @IsEnum(ReminderType)
  reminderType?: ReminderType;

  @ApiPropertyOptional({ description: '提醒状态', enum: ReminderStatus })
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;

  @ApiPropertyOptional({ description: '发送人ID' })
  @IsOptional()
  @IsUUID()
  senderId?: string;

  @ApiPropertyOptional({ description: '计划发送开始时间' })
  @IsOptional()
  @IsDateString()
  scheduledTimeFrom?: string;

  @ApiPropertyOptional({ description: '计划发送结束时间' })
  @IsOptional()
  @IsDateString()
  scheduledTimeTo?: string;
}

export class QueryRecipientDto extends PaginationDto {
  @ApiPropertyOptional({ description: '提醒ID' })
  @IsOptional()
  @IsUUID()
  reminderId?: string;

  @ApiPropertyOptional({ description: '用户ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: '客户ID' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: '接收状态', enum: ReminderStatus })
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;
}
