import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  IsEnum,
  IsObject,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum ExportType {
  HEARING_SUMMARY = 'HEARING_SUMMARY',
  ATTENDANCE_STATS = 'ATTENDANCE_STATS',
  EXCEPTION_STATS = 'EXCEPTION_STATS',
  CONFLICT_STATS = 'CONFLICT_STATS',
  REMINDER_SUMMARY = 'REMINDER_SUMMARY',
  CASE_SUMMARY = 'CASE_SUMMARY',
}

export class ExportExcelDto {
  @ApiProperty({ description: '导出类型', enum: ExportType })
  @IsEnum(ExportType)
  @IsNotEmpty()
  exportType: ExportType;

  @ApiProperty({ description: '开始时间' })
  @IsDateString()
  @IsNotEmpty()
  startTimeRange: string;

  @ApiProperty({ description: '结束时间' })
  @IsDateString()
  @IsNotEmpty()
  endTimeRange: string;

  @ApiPropertyOptional({ description: '包含字段列表，不传则导出全部字段', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includedFields?: string[];

  @ApiPropertyOptional({ description: '筛选条件（JSON格式）' })
  @IsOptional()
  @IsObject()
  filterCriteria?: Record<string, any>;

  @ApiPropertyOptional({ description: '自定义文件名（不含扩展名）' })
  @IsOptional()
  @IsString()
  customFileName?: string;
}

export class QueryExportRecordDto extends PaginationDto {
  @ApiPropertyOptional({ description: '导出类型', enum: ExportType })
  @IsOptional()
  @IsEnum(ExportType)
  exportType?: ExportType;

  @ApiPropertyOptional({ description: '导出人ID' })
  @IsOptional()
  @IsString()
  exportedById?: string;

  @ApiPropertyOptional({ description: '导出开始日期' })
  @IsOptional()
  @IsDateString()
  createdAtFrom?: string;

  @ApiPropertyOptional({ description: '导出结束日期' })
  @IsOptional()
  @IsDateString()
  createdAtTo?: string;
}
