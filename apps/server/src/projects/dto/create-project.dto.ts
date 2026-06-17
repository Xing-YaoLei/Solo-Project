import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  ownerId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  designerId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  foremanId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  supervisorId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
