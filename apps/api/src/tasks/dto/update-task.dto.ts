import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({ description: '任务状态', enum: TaskStatus })
  @IsEnum(TaskStatus, { message: '任务状态不正确' })
  @IsOptional()
  status?: TaskStatus;
}
