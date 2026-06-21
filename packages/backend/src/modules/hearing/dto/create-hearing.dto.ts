import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateHearingAssignmentDto } from './create-hearing-assignment.dto';

export class CreateHearingDto {
  @ApiProperty({ description: '开庭编号' })
  @IsString()
  @IsNotEmpty()
  hearingNo: string;

  @ApiProperty({ description: '案件ID' })
  @IsString()
  @IsNotEmpty()
  caseId: string;

  @ApiProperty({ description: '法院ID' })
  @IsString()
  @IsNotEmpty()
  courtId: string;

  @ApiProperty({ description: '法庭ID' })
  @IsString()
  @IsNotEmpty()
  courtRoomId: string;

  @ApiPropertyOptional({ description: '审判长法官ID' })
  @IsOptional()
  @IsString()
  presidingJudgeId?: string;

  @ApiProperty({ description: '开始时间' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: '结束时间' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ description: '开庭类型：开庭/听证/调解/宣判/谈话/质证等' })
  @IsString()
  @IsNotEmpty()
  hearingType: string;

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

  @ApiPropertyOptional({ description: '是否为重要开庭', default: false })
  @IsOptional()
  @IsBoolean()
  isImportant?: boolean;

  @ApiPropertyOptional({ description: '优先级 1-10', default: 5, minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiProperty({ description: '创建人ID' })
  @IsString()
  @IsNotEmpty()
  creatorId: string;

  @ApiPropertyOptional({ description: '分派人员列表', type: [CreateHearingAssignmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHearingAssignmentDto)
  assignments?: CreateHearingAssignmentDto[];
}
