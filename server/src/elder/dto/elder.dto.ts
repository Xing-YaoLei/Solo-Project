import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsDateString, IsArray, IsIn } from 'class-validator';

export class CreateElderDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsInt()
  age!: number;

  @ApiProperty()
  @IsString()
  @IsIn(['MALE', 'FEMALE'])
  gender!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsIn(['LEVEL_1', 'LEVEL_2', 'LEVEL_3'])
  careLevel?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  fallRiskLevel?: string;

  @ApiProperty()
  @IsString()
  roomNumber!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsIn(['ACTIVE', 'DISCHARGED', 'DECEASED'])
  status?: string;

  @ApiProperty()
  @IsDateString()
  admissionDate!: string;
}

export class UpdateElderDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  age?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsIn(['MALE', 'FEMALE'])
  gender?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsIn(['LEVEL_1', 'LEVEL_2', 'LEVEL_3'])
  careLevel?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  fallRiskLevel?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  roomNumber?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'DISCHARGED', 'DECEASED'])
  status?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  admissionDate?: string;
}
