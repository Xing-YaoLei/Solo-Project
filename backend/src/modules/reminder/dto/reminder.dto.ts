import { IsOptional, IsString, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ReminderType, ReminderStatus } from '@prisma/client';

export class QueryRemindersDto extends PaginationDto {
  @ApiProperty({ enum: ReminderType, required: false })
  @IsEnum(ReminderType)
  @IsOptional()
  type?: ReminderType;

  @ApiProperty({ enum: ReminderStatus, required: false })
  @IsEnum(ReminderStatus)
  @IsOptional()
  status?: ReminderStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class CreateReminderDto {
  @ApiProperty({ example: 'uuid-user-id' })
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: ReminderType, example: ReminderType.OVERDUE })
  @IsEnum(ReminderType)
  type: ReminderType;

  @ApiProperty({ example: '任务逾期提醒' })
  @IsString()
  title: string;

  @ApiProperty({ example: '您有一个任务已逾期', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ example: 'uuid-task-id', required: false })
  @IsString()
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}
