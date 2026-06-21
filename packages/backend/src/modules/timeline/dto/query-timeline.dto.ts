import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryTimelineDto extends PaginationDto {
  @ApiProperty({ description: '开庭ID', required: false })
  @IsString()
  @IsOptional()
  hearingId?: string;

  @ApiProperty({ description: '变更类型', required: false })
  @IsString()
  @IsOptional()
  changeType?: string;

  @ApiProperty({ description: '变更类型列表（多选）', required: false, type: [String] })
  @IsArray()
  @IsOptional()
  changeTypes?: string[];

  @ApiProperty({ description: '操作人ID', required: false })
  @IsString()
  @IsOptional()
  operatorId?: string;

  @ApiProperty({ description: '开始日期', required: false })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ description: '结束日期', required: false })
  @IsDateString()
  @IsOptional()
  endTime?: string;
}
