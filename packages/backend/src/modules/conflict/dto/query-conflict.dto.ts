import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ConflictType, ConflictSeverity } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryConflictDto extends PaginationDto {
  @ApiPropertyOptional({ description: '开庭ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  hearingId?: string;

  @ApiPropertyOptional({ description: '冲突类型', enum: ConflictType })
  @IsEnum(ConflictType)
  @IsOptional()
  conflictType?: ConflictType;

  @ApiPropertyOptional({ description: '严重程度', enum: ConflictSeverity })
  @IsEnum(ConflictSeverity)
  @IsOptional()
  severity?: ConflictSeverity;

  @ApiPropertyOptional({ description: '是否已解决', example: false })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isResolved?: boolean;

  @ApiPropertyOptional({ description: '关联案件ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  caseId?: string;

  @ApiPropertyOptional({ description: 'A方客户ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  partyAClientId?: string;

  @ApiPropertyOptional({ description: 'B方客户ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  partyBClientId?: string;

  @ApiPropertyOptional({ description: '搜索关键字（冲突描述/涉及方）' })
  @IsString()
  @IsOptional()
  keyword?: string;
}
