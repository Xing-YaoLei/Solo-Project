import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class ConflictCheckDto {
  @ApiProperty({ description: '开始时间' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: '结束时间' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: '法庭ID' })
  @IsOptional()
  @IsString()
  courtRoomId?: string;

  @ApiPropertyOptional({ description: '法官ID列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  judgeIds?: string[];

  @ApiPropertyOptional({ description: '被指派用户ID列表（律师等）' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];

  @ApiPropertyOptional({ description: '案件ID（用于案件利益冲突检测）' })
  @IsOptional()
  @IsString()
  caseId?: string;

  @ApiPropertyOptional({ description: '排除的开庭ID（编辑自身时使用）' })
  @IsOptional()
  @IsString()
  excludeHearingId?: string;
}

export class ConflictItemDto {
  @ApiProperty({ description: '冲突类型' })
  conflictType: string;

  @ApiProperty({ description: '严重级别' })
  severity: string;

  @ApiProperty({ description: '冲突描述' })
  description: string;

  @ApiPropertyOptional({ description: '涉及方A ID' })
  involvedPartyA?: string;

  @ApiPropertyOptional({ description: '涉及方B ID' })
  involvedPartyB?: string;

  @ApiPropertyOptional({ description: '涉及方A类型' })
  partyAType?: string;

  @ApiPropertyOptional({ description: '涉及方B类型' })
  partyBType?: string;

  @ApiPropertyOptional({ description: '涉及方A名称' })
  partyAName?: string;

  @ApiPropertyOptional({ description: '涉及方B名称' })
  partyBName?: string;

  @ApiPropertyOptional({ description: '冲突的开庭ID' })
  conflictingHearingId?: string;

  @ApiPropertyOptional({ description: '冲突的开庭编号' })
  conflictingHearingNo?: string;
}

export class ConflictCheckResultDto {
  @ApiProperty({ description: '是否存在冲突' })
  hasConflict: boolean;

  @ApiProperty({ description: '冲突列表', type: [ConflictItemDto] })
  conflicts: ConflictItemDto[];
}
