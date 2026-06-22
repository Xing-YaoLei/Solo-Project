import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsUUID, ArrayNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';

export class BatchUpdateDto {
  @ApiProperty({ description: '任务ID列表', type: [String] })
  @IsArray({ message: '任务ID必须为数组' })
  @ArrayNotEmpty({ message: '任务ID列表不能为空' })
  @IsUUID('4', { each: true, message: '任务ID格式不正确' })
  taskIds: string[];

  @ApiPropertyOptional({ description: '批量更新状态', enum: TaskStatus })
  @IsEnum(TaskStatus, { message: '任务状态不正确' })
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ description: '批量分派给用户ID' })
  @IsUUID('4', { message: '分派用户ID格式不正确' })
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ description: '批量设置优先级' })
  @IsOptional()
  priority?: any;
}
