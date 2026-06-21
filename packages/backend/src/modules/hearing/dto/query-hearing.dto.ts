import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { HearingStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryHearingDto extends PaginationDto {
  @ApiPropertyOptional({ description: '开始时间范围（日历查询起始）' })
  @IsOptional()
  @IsDateString()
  startTimeFrom?: string;

  @ApiPropertyOptional({ description: '结束时间范围（日历查询结束）' })
  @IsOptional()
  @IsDateString()
  startTimeTo?: string;

  @ApiPropertyOptional({ description: '案件ID' })
  @IsOptional()
  @IsString()
  caseId?: string;

  @ApiPropertyOptional({ description: '法院ID' })
  @IsOptional()
  @IsString()
  courtId?: string;

  @ApiPropertyOptional({ description: '法庭ID' })
  @IsOptional()
  @IsString()
  courtRoomId?: string;

  @ApiPropertyOptional({ description: '审判长法官ID' })
  @IsOptional()
  @IsString()
  presidingJudgeId?: string;

  @ApiPropertyOptional({ description: '开庭状态', enum: HearingStatus, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(HearingStatus, { each: true })
  statuses?: HearingStatus[];

  @ApiPropertyOptional({ description: '开庭类型' })
  @IsOptional()
  @IsString()
  hearingType?: string;

  @ApiPropertyOptional({ description: '被指派用户ID（分派查询）' })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ description: '是否仅重要开庭' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isImportant?: boolean;

  @ApiPropertyOptional({ description: '创建人ID' })
  @IsOptional()
  @IsString()
  creatorId?: string;

  @ApiPropertyOptional({ description: '关键词搜索（开庭编号、案件标题）' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '优先级最小值' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  priorityMin?: number;

  @ApiPropertyOptional({ description: '优先级最大值' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  priorityMax?: number;
}
