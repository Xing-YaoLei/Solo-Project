import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsObject,
} from 'class-validator';

export class CreateTimelineDto {
  @ApiProperty({ description: '异常单ID' })
  @IsUUID()
  @IsNotEmpty()
  exceptionId: string;

  @ApiProperty({ description: '动作：创建/调查/处理/升级/关闭等' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiPropertyOptional({ description: '动作描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '操作人姓名' })
  @IsOptional()
  @IsString()
  operatorName?: string;

  @ApiPropertyOptional({ description: '操作人ID' })
  @IsOptional()
  @IsUUID()
  operatorId?: string;

  @ApiPropertyOptional({ description: '状态变更记录（如：OPEN -> INVESTIGATING）' })
  @IsOptional()
  @IsString()
  statusChange?: string;

  @ApiPropertyOptional({ description: '额外元数据（JSON格式）' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
