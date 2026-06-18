import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { TaskType, TaskStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateConfirmationTaskDto {
  @ApiProperty({ example: 'uuid-project-id' })
  @IsString()
  @IsUUID()
  projectId: string;

  @ApiProperty({ example: '水电节点验收' })
  @IsString()
  title: string;

  @ApiProperty({ enum: TaskType, example: TaskType.NODE_ACCEPTANCE })
  @IsEnum(TaskType)
  type: TaskType;

  @ApiProperty({ example: '水电工程已完成，请业主验收', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '水电节点', required: false })
  @IsString()
  @IsOptional()
  nodeName?: string;

  @ApiProperty({ example: '主卧卫生间', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 5000.0, required: false })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiProperty({ example: 'uuid-assignee-id', required: false })
  @IsString()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class UpdateConfirmationTaskDto extends PartialType(CreateConfirmationTaskDto) {}

export class AssignTaskDto {
  @ApiProperty({ example: 'uuid-assignee-id' })
  @IsString()
  @IsUUID()
  assignedToId: string;
}

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus, example: TaskStatus.APPROVED })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiProperty({ example: '备注说明', required: false })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class QueryTasksDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({ enum: TaskType, required: false })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @ApiProperty({ enum: TaskStatus, required: false })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsUUID()
  createdById?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class TaskImageDto {
  @ApiProperty({ example: 'BEFORE' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  url: string;

  @ApiProperty({ example: 'https://example.com/thumb.jpg', required: false })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({ example: '现场照片', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  order?: number;
}
