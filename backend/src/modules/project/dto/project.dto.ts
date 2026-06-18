import { IsOptional, IsString, IsDateString, IsNumber, IsUUID, IsDecimal } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateProjectDto {
  @ApiProperty({ example: '幸福小区精装修项目' })
  @IsString()
  name: string;

  @ApiProperty({ example: '北京市朝阳区幸福小区1号楼1单元101室' })
  @IsString()
  address: string;

  @ApiProperty({ example: '现代简约风格三室两厅装修', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'uuid-owner-id' })
  @IsString()
  @IsUUID()
  ownerId: string;

  @ApiProperty({ example: 'uuid-pm-id', required: false })
  @IsString()
  @IsOptional()
  @IsUUID()
  projectManagerId?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: '2024-06-01T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: 150000.0, required: false })
  @IsNumber()
  @IsOptional()
  totalBudget?: number;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiProperty({ example: 'IN_PROGRESS', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}

export class QueryProjectsDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsUUID()
  projectManagerId?: string;
}
