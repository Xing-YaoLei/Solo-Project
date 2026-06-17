import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChangeOrderDto {
  @ApiProperty({ description: '项目ID' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: '变更单标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '变更描述' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: '变更原因' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: '原设计说明' })
  @IsString()
  @IsOptional()
  originalDesign?: string;

  @ApiPropertyOptional({ description: '新设计说明' })
  @IsString()
  @IsOptional()
  newDesign?: string;

  @ApiPropertyOptional({ description: '对工期的影响（天）' })
  @IsNumber()
  @IsOptional()
  impactOnSchedule?: number;

  @ApiPropertyOptional({ description: '对成本的影响' })
  @IsNumber()
  @IsOptional()
  impactOnCost?: number;

  @ApiPropertyOptional({ description: '设计师ID' })
  @IsString()
  @IsOptional()
  designerId?: string;

  @ApiPropertyOptional({ description: '截止日期' })
  @IsDateString()
  @IsOptional()
  deadline?: string;
}
