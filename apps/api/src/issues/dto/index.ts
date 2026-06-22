import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, IsDateString, MaxLength, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueSeverity, IssueStatus } from '@prisma/client';

export class CreateIssueDto {
  @ApiProperty({ description: '问题标题', example: '缺少2024年1月银行对账单' })
  @IsString({ message: '标题必须为字符串' })
  @IsNotEmpty({ message: '标题不能为空' })
  @MaxLength(200, { message: '标题不能超过200字符' })
  title: string;

  @ApiPropertyOptional({ description: '问题描述' })
  @IsString({ message: '描述必须为字符串' })
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '严重程度', enum: IssueSeverity, example: IssueSeverity.MODERATE })
  @IsEnum(IssueSeverity, { message: '严重程度不正确' })
  @IsNotEmpty({ message: '严重程度不能为空' })
  severity: IssueSeverity;

  @ApiPropertyOptional({ description: '初始状态', enum: IssueStatus, default: IssueStatus.IDENTIFIED })
  @IsEnum(IssueStatus, { message: '状态不正确' })
  @IsOptional()
  status?: IssueStatus;

  @ApiPropertyOptional({ description: '关联任务ID' })
  @IsUUID('4', { message: '任务ID格式不正确' })
  @IsOptional()
  taskId?: string;

  @ApiPropertyOptional({ description: '关联证据ID' })
  @IsUUID('4', { message: '证据ID格式不正确' })
  @IsOptional()
  evidenceId?: string;

  @ApiPropertyOptional({ description: '关联抽样项ID' })
  @IsUUID('4', { message: '抽样项ID格式不正确' })
  @IsOptional()
  samplingItemId?: string;

  @ApiPropertyOptional({ description: '父问题ID（用于复发追踪）' })
  @IsUUID('4', { message: '父问题ID格式不正确' })
  @IsOptional()
  parentIssueId?: string;

  @ApiPropertyOptional({ description: '问题分类', example: '内部控制' })
  @IsString({ message: '分类必须为字符串' })
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '问题子类', example: '单据缺失' })
  @IsString({ message: '子类必须为字符串' })
  @IsOptional()
  subCategory?: string;

  @ApiPropertyOptional({ description: '所属部门' })
  @IsString({ message: '部门必须为字符串' })
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: '发现日期', example: '2024-01-15' })
  @IsDateString({}, { message: '发现日期格式不正确' })
  @IsOptional()
  identifiedAt?: string;

  @ApiPropertyOptional({ description: '截止日期', example: '2024-02-28' })
  @IsDateString({}, { message: '截止日期格式不正确' })
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: '负责人ID' })
  @IsUUID('4', { message: '负责人ID格式不正确' })
  @IsOptional()
  ownerId?: string;
}

export class UpdateIssueDto {
  @ApiPropertyOptional({ description: '问题标题' })
  @IsString({ message: '标题必须为字符串' })
  @MaxLength(200, { message: '标题不能超过200字符' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: '问题描述' })
  @IsString({ message: '描述必须为字符串' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '严重程度', enum: IssueSeverity })
  @IsEnum(IssueSeverity, { message: '严重程度不正确' })
  @IsOptional()
  severity?: IssueSeverity;

  @ApiPropertyOptional({ description: '状态', enum: IssueStatus })
  @IsEnum(IssueStatus, { message: '状态不正确' })
  @IsOptional()
  status?: IssueStatus;

  @ApiPropertyOptional({ description: '问题分类' })
  @IsString({ message: '分类必须为字符串' })
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '问题子类' })
  @IsString({ message: '子类必须为字符串' })
  @IsOptional()
  subCategory?: string;

  @ApiPropertyOptional({ description: '所属部门' })
  @IsString({ message: '部门必须为字符串' })
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: '截止日期' })
  @IsDateString({}, { message: '截止日期格式不正确' })
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: '解决日期' })
  @IsDateString({}, { message: '解决日期格式不正确' })
  @IsOptional()
  resolvedAt?: string;

  @ApiPropertyOptional({ description: '负责人ID' })
  @IsUUID('4', { message: '负责人ID格式不正确' })
  @IsOptional()
  ownerId?: string;
}

export class MarkRecurredDto {
  @ApiProperty({ description: '复发后关联的父问题ID' })
  @IsUUID('4', { message: '父问题ID格式不正确' })
  @IsNotEmpty({ message: '父问题ID不能为空' })
  parentIssueId: string;
}
