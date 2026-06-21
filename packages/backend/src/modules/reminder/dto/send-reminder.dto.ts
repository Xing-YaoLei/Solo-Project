import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID, ArrayMinSize } from 'class-validator';

export class SendReminderDto {
  @ApiProperty({ description: '提醒ID列表' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  reminderIds: string[];
}

export class ResendRecipientDto {
  @ApiPropertyOptional({ description: '接收人ID列表，不传则重发全部失败的' })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  recipientIds?: string[];
}
