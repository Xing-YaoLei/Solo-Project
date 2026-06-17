import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsInt, IsOptional } from 'class-validator';

export class CreateVisitDto {
  @ApiProperty()
  @IsString()
  elderId!: string;

  @ApiProperty()
  @IsString()
  visitorName!: string;

  @ApiProperty()
  @IsString()
  relationship!: string;

  @ApiProperty()
  @IsDateString()
  visitTime!: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
