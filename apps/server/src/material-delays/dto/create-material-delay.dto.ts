import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaterialDelayDto {
  @ApiProperty({ description: '项目ID' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: '材料名称' })
  @IsString()
  @IsNotEmpty()
  materialName: string;

  @ApiPropertyOptional({ description: '规格' })
  @IsString()
  @IsOptional()
  specification?: string;

  @ApiPropertyOptional({ description: '数量' })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({ description: '原定到货日期' })
  @IsDateString()
  @IsNotEmpty()
  originalDate: string;

  @ApiPropertyOptional({ description: '预计到货日期' })
  @IsDateString()
  @IsOptional()
  estimatedDate?: string;

  @ApiProperty({ description: '延期原因' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: '影响说明' })
  @IsString()
  @IsOptional()
  impact?: string;

  @ApiPropertyOptional({ description: '关联设计变更单ID' })
  @IsString()
  @IsOptional()
  changeOrderId?: string;
}
