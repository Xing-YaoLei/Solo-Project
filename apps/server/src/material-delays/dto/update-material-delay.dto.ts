import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';
import { CreateMaterialDelayDto } from './create-material-delay.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMaterialDelayDto extends PartialType(CreateMaterialDelayDto) {
  @ApiPropertyOptional({ description: '实际到货日期' })
  @IsDateString()
  @IsOptional()
  actualDate?: string;
}
