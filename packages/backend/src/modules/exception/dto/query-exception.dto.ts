import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsUUID, IsDateString, IsString } from 'class-validator';
import { ExceptionType, ExceptionStatus, ConflictSeverity } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryExceptionDto extends PaginationDto {
  @ApiPropertyOptional({ description: '异常单编号（模糊搜索）' })
  @IsOptional()
  @IsString()
  exceptionNo?: string;

  @ApiPropertyOptional({ description: '关联开庭ID' })
  @IsOptional()
  @IsUUID()
  hearingId?: string;

  @ApiPropertyOptional({ description: '关联案件ID' })
  @IsOptional()
  @IsUUID()
  caseId?: string;

  @ApiPropertyOptional({ description: '异常类型', enum: ExceptionType })
  @IsOptional()
  @IsEnum(ExceptionType)
  exceptionType?: ExceptionType;

  @ApiPropertyOptional({ description: '严重程度', enum: ConflictSeverity })
  @IsOptional()
  @IsEnum(ConflictSeverity)
  severity?: ConflictSeverity;

  @ApiPropertyOptional({ description: '异常状态', enum: ExceptionStatus })
  @IsOptional()
  @IsEnum(ExceptionStatus)
  status?: ExceptionStatus;

  @ApiPropertyOptional({ description: '创建人ID' })
  @IsOptional()
  @IsUUID()
  creatorId?: string;

  @ApiPropertyOptional({ description: '处理人ID' })
  @IsOptional()
  @IsUUID()
  resolverId?: string;

  @ApiPropertyOptional({ description: '创建开始日期' })
  @IsOptional()
  @IsDateString()
  createdAtFrom?: string;

  @ApiPropertyOptional({ description: '创建结束日期' })
  @IsOptional()
  @IsDateString()
  createdAtTo?: string;

  @ApiPropertyOptional({ description: '标题关键词（模糊搜索）' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
