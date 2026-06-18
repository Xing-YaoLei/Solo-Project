import { IsOptional, IsString, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskType, TaskStatus } from '@prisma/client';

export class ReportQueryDto {
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: '2024-12-31T23:59:59.999Z', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ enum: TaskType, required: false })
  @IsEnum(TaskType)
  @IsOptional()
  taskType?: TaskType;

  @ApiProperty({ example: 'day', required: false })
  @IsString()
  @IsOptional()
  period?: string;
}

export class ConfirmationTimeReportDto {
  @ApiProperty({ example: '2024-01-01' })
  date: string;

  @ApiProperty({ example: 5 })
  totalTasks: number;

  @ApiProperty({ example: 48.5 })
  avgConfirmationTimeHours: number;

  @ApiProperty({ example: 24 })
  minConfirmationTimeHours: number;

  @ApiProperty({ example: 72 })
  maxConfirmationTimeHours: number;
}

export class ReworkReasonReportDto {
  @ApiProperty({ example: '质量不达标' })
  reason: string;

  @ApiProperty({ example: 10 })
  count: number;

  @ApiProperty({ example: 25.5 })
  percentage: number;
}

export class UnconfirmedAmountReportDto {
  @ApiProperty({ example: 'NODE_ACCEPTANCE' })
  type: string;

  @ApiProperty({ example: 15 })
  taskCount: number;

  @ApiProperty({ example: 150000 })
  totalAmount: number;
}
