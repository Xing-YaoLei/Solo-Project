import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, IsDateString, MaxLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditType, TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty({ description: '任务标题', example: '2024Q1财务例行审计' })
  @IsString({ message: '标题必须为字符串' })
  @IsNotEmpty({ message: '标题不能为空' })
  @MaxLength(200, { message: '标题长度不能超过200个字符' })
  title: string;

  @ApiPropertyOptional({ description: '任务描述' })
  @IsString({ message: '描述必须为字符串' })
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '审计类型', enum: AuditType, example: AuditType.ROUTINE })
  @IsEnum(AuditType, { message: '审计类型不正确' })
  @IsNotEmpty({ message: '审计类型不能为空' })
  auditType: AuditType;

  @ApiPropertyOptional({ description: '优先级', enum: TaskPriority, example: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority, { message: '优先级不正确' })
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: '部门', example: '财务部' })
  @IsString({ message: '部门必须为字符串' })
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: '审计期间', example: '2024Q1' })
  @IsString({ message: '审计期间必须为字符串' })
  @IsOptional()
  auditPeriod?: string;

  @ApiPropertyOptional({ description: '分派给用户ID' })
  @IsUUID('4', { message: '分派用户ID格式不正确' })
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ description: '业务负责人ID' })
  @IsUUID('4', { message: '业务负责人ID格式不正确' })
  @IsOptional()
  businessOwnerId?: string;

  @ApiPropertyOptional({ description: '截止日期', example: '2024-06-30' })
  @IsDateString({}, { message: '截止日期格式不正确' })
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: '关联任务ID列表', type: [String] })
  @IsArray({ message: '关联任务ID必须为数组' })
  @IsOptional()
  relatedTaskIds?: string[];
}
