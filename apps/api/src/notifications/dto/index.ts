import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, MaxLength, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, UnauthorizedSeverity, UnauthorizedStatus } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ description: '通知类型', enum: NotificationType })
  @IsEnum(NotificationType, { message: '通知类型不正确' })
  @IsNotEmpty({ message: '通知类型不能为空' })
  type: NotificationType;

  @ApiProperty({ description: '接收人ID' })
  @IsUUID('4', { message: '接收人ID格式不正确' })
  @IsNotEmpty({ message: '接收人ID不能为空' })
  recipientId: string;

  @ApiProperty({ description: '通知标题' })
  @IsString({ message: '标题必须为字符串' })
  @IsNotEmpty({ message: '标题不能为空' })
  @MaxLength(200, { message: '标题不能超过200字符' })
  title: string;

  @ApiPropertyOptional({ description: '通知内容' })
  @IsString({ message: '内容必须为字符串' })
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: '关联任务ID' })
  @IsUUID('4', { message: '任务ID格式不正确' })
  @IsOptional()
  taskId?: string;

  @ApiPropertyOptional({ description: '关联证据ID' })
  @IsUUID('4', { message: '证据ID格式不正确' })
  @IsOptional()
  evidenceId?: string;

  @ApiPropertyOptional({ description: '动作类型' })
  @IsString({ message: '动作类型必须为字符串' })
  @IsOptional()
  actionType?: string;

  @ApiPropertyOptional({ description: '动作链接' })
  @IsString({ message: '动作链接必须为字符串' })
  @IsOptional()
  actionUrl?: string;
}

export class SendTemplatedNotificationDto {
  @ApiPropertyOptional({ description: '模板ID' })
  @IsUUID('4', { message: '模板ID格式不正确' })
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional({ description: '模板分类' })
  @IsString({ message: '模板分类必须为字符串' })
  @IsOptional()
  templateCategory?: string;

  @ApiProperty({ description: '接收人ID列表', type: [String] })
  @IsArray({ message: '接收人ID必须为数组' })
  @IsUUID('4', { each: true, message: '接收人ID格式不正确' })
  recipientIds: string[];

  @ApiPropertyOptional({ description: '模板变量', type: 'object', additionalProperties: true })
  @IsOptional()
  variables?: Record<string, any>;

  @ApiPropertyOptional({ description: '关联任务ID' })
  @IsUUID('4', { message: '任务ID格式不正确' })
  @IsOptional()
  taskId?: string;

  @ApiPropertyOptional({ description: '关联证据ID' })
  @IsUUID('4', { message: '证据ID格式不正确' })
  @IsOptional()
  evidenceId?: string;
}

export class MarkReadDto {
  @ApiPropertyOptional({ description: '通知ID列表（不传则全部标为已读）', type: [String] })
  @IsArray({ message: '通知ID必须为数组' })
  @IsUUID('4', { each: true, message: '通知ID格式不正确' })
  @IsOptional()
  ids?: string[];
}

export class HandleUnauthorizedDto {
  @ApiProperty({ description: '处理状态', enum: UnauthorizedStatus })
  @IsEnum(UnauthorizedStatus, { message: '处理状态不正确' })
  @IsNotEmpty({ message: '处理状态不能为空' })
  status: UnauthorizedStatus;

  @ApiPropertyOptional({ description: '严重级别', enum: UnauthorizedSeverity })
  @IsEnum(UnauthorizedSeverity, { message: '严重级别不正确' })
  @IsOptional()
  severity?: UnauthorizedSeverity;

  @ApiPropertyOptional({ description: '处理说明' })
  @IsString({ message: '处理说明必须为字符串' })
  @MaxLength(2000, { message: '处理说明不能超过2000字符' })
  @IsOptional()
  handlingNote?: string;
}

export class CreateTemplateDto {
  @ApiProperty({ description: '模板名称' })
  @IsString({ message: '模板名称必须为字符串' })
  @IsNotEmpty({ message: '模板名称不能为空' })
  @MaxLength(200, { message: '模板名称不能超过200字符' })
  name: string;

  @ApiProperty({ description: '模板分类' })
  @IsString({ message: '模板分类必须为字符串' })
  @IsNotEmpty({ message: '模板分类不能为空' })
  @MaxLength(100, { message: '模板分类不能超过100字符' })
  category: string;

  @ApiProperty({ description: '邮件/通知主题' })
  @IsString({ message: '主题必须为字符串' })
  @IsNotEmpty({ message: '主题不能为空' })
  @MaxLength(500, { message: '主题不能超过500字符' })
  subject: string;

  @ApiProperty({ description: '通知内容' })
  @IsString({ message: '内容必须为字符串' })
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @ApiPropertyOptional({ description: '变量列表', type: [String] })
  @IsArray({ message: '变量列表必须为数组' })
  @IsString({ each: true, message: '变量名必须为字符串' })
  @IsOptional()
  variables?: string[];

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean({ message: 'isActive必须为布尔值' })
  @IsOptional()
  isActive?: boolean;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: '模板名称' })
  @IsString({ message: '模板名称必须为字符串' })
  @MaxLength(200, { message: '模板名称不能超过200字符' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '模板分类' })
  @IsString({ message: '模板分类必须为字符串' })
  @MaxLength(100, { message: '模板分类不能超过100字符' })
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '邮件/通知主题' })
  @IsString({ message: '主题必须为字符串' })
  @MaxLength(500, { message: '主题不能超过500字符' })
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({ description: '通知内容' })
  @IsString({ message: '内容必须为字符串' })
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: '变量列表', type: [String] })
  @IsArray({ message: '变量列表必须为数组' })
  @IsString({ each: true, message: '变量名必须为字符串' })
  @IsOptional()
  variables?: string[];

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean({ message: 'isActive必须为布尔值' })
  @IsOptional()
  isActive?: boolean;
}
