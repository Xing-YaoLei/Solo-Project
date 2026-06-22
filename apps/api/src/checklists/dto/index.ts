import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean, MaxLength, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChecklistItemDto {
  @ApiProperty({ description: '检查项内容', example: '是否有银行对账单' })
  @IsString({ message: '检查项内容必须为字符串' })
  @IsNotEmpty({ message: '检查项内容不能为空' })
  @MaxLength(500, { message: '检查项内容不能超过500字符' })
  content: string;

  @ApiPropertyOptional({ description: '检查要求', example: '必须有银行盖章的对账单' })
  @IsString({ message: '检查要求必须为字符串' })
  @IsOptional()
  requirement?: string;

  @ApiPropertyOptional({ description: '是否需要证据', default: false })
  @IsBoolean({ message: '是否需要证据必须为布尔值' })
  @IsOptional()
  evidenceNeeded?: boolean;

  @ApiProperty({ description: '排序号', example: 1, minimum: 0 })
  @IsInt({ message: '排序号必须为整数' })
  @Min(0, { message: '排序号不能小于0' })
  order: number;
}

export class CreateChecklistDto {
  @ApiProperty({ description: '清单标题', example: '货币资金审计检查清单' })
  @IsString({ message: '标题必须为字符串' })
  @IsNotEmpty({ message: '标题不能为空' })
  @MaxLength(200, { message: '标题不能超过200字符' })
  title: string;

  @ApiPropertyOptional({ description: '清单描述' })
  @IsString({ message: '描述必须为字符串' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '分类', example: '财务审计' })
  @IsString({ message: '分类必须为字符串' })
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '版本号', example: '1.0' })
  @IsString({ message: '版本号必须为字符串' })
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsBoolean({ message: '是否启用必须为布尔值' })
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: '检查项列表', type: [ChecklistItemDto] })
  @IsArray({ message: '检查项必须为数组' })
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items: ChecklistItemDto[];
}

export class UpdateChecklistDto {
  @ApiPropertyOptional({ description: '清单标题' })
  @IsString({ message: '标题必须为字符串' })
  @MaxLength(200, { message: '标题不能超过200字符' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: '清单描述' })
  @IsString({ message: '描述必须为字符串' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '分类' })
  @IsString({ message: '分类必须为字符串' })
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '版本号' })
  @IsString({ message: '版本号必须为字符串' })
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean({ message: '是否启用必须为布尔值' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '检查项列表（替换）', type: [ChecklistItemDto] })
  @IsArray({ message: '检查项必须为数组' })
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  @IsOptional()
  items?: ChecklistItemDto[];
}

export class ExecuteChecklistDto {
  @ApiProperty({ description: '关联任务ID' })
  @IsString({ message: '任务ID必须为字符串' })
  @IsNotEmpty({ message: '任务ID不能为空' })
  taskId: string;
}

export class UpdateChecklistItemResultDto {
  @ApiProperty({ description: '执行结果项ID' })
  @IsString({ message: '执行结果项ID不能为空' })
  @IsNotEmpty()
  executionId: string;

  @ApiProperty({ description: '检查项ID' })
  @IsString({ message: '检查项ID不能为空' })
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ description: '是否通过' })
  @IsBoolean({ message: '是否通过必须为布尔值' })
  isPass: boolean;

  @ApiPropertyOptional({ description: '备注' })
  @IsString({ message: '备注必须为字符串' })
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({ description: '关联证据ID' })
  @IsString({ message: '证据ID必须为字符串' })
  @IsOptional()
  evidenceId?: string;
}
