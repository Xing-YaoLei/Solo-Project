import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateHearingAssignmentDto } from './create-hearing-assignment.dto';

export class UpdateHearingDto {
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

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: '开庭类型：开庭/听证/调解/宣判/谈话/质证等' })
  @IsOptional()
  @IsString()
  hearingType?: string;

  @ApiPropertyOptional({ description: '法官安排要点' })
  @IsOptional()
  @IsString()
  judgeSummary?: string;

  @ApiPropertyOptional({ description: '准备事项' })
  @IsOptional()
  @IsString()
  preparationItems?: string;

  @ApiPropertyOptional({ description: '需携带材料' })
  @IsOptional()
  @IsString()
  materials?: string;

  @ApiPropertyOptional({ description: '是否为重要开庭' })
  @IsOptional()
  @IsBoolean()
  isImportant?: boolean;

  @ApiPropertyOptional({ description: '优先级 1-10', minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({
    description: '分派人员列表（会全量替换已有分派）',
    type: [CreateHearingAssignmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHearingAssignmentDto)
  assignments?: CreateHearingAssignmentDto[];
}
