import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAfterSalesDto {
  @ApiProperty({ description: '项目ID' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: '工单标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '工单描述' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: '优先级' })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ description: '处理人ID' })
  @IsString()
  @IsOptional()
  assigneeId?: string;
}
