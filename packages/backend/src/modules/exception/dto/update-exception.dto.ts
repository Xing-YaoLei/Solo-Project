import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  IsObject,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExceptionType, ExceptionStatus, ConflictSeverity } from '@prisma/client';
import { ImpactScopeDto, ResponsibilityDto } from './create-exception.dto';

export class UpdateExceptionDto {
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

  @ApiPropertyOptional({ description: '异常单标题' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '问题描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '严重程度', enum: ConflictSeverity })
  @IsOptional()
  @IsEnum(ConflictSeverity)
  severity?: ConflictSeverity;

  @ApiPropertyOptional({ description: '异常状态', enum: ExceptionStatus })
  @IsOptional()
  @IsEnum(ExceptionStatus)
  status?: ExceptionStatus;

  @ApiPropertyOptional({ description: '影响范围', type: ImpactScopeDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ImpactScopeDto)
  impactScope?: ImpactScopeDto;

  @ApiPropertyOptional({ description: '责任归属', type: ResponsibilityDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ResponsibilityDto)
  responsibility?: ResponsibilityDto;

  @ApiPropertyOptional({ description: '调查结果' })
  @IsOptional()
  @IsString()
  investigationResult?: string;

  @ApiPropertyOptional({ description: '处理结果' })
  @IsOptional()
  @IsString()
  handlingResult?: string;

  @ApiPropertyOptional({ description: '纠正措施' })
  @IsOptional()
  @IsString()
  correctiveAction?: string;

  @ApiPropertyOptional({ description: '预防措施' })
  @IsOptional()
  @IsString()
  preventiveMeasure?: string;

  @ApiPropertyOptional({ description: '关联冲突检测ID列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  relatedConflictIds?: string[];

  @ApiPropertyOptional({ description: '关联其他开庭ID列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  relatedHearingIds?: string[];

  @ApiPropertyOptional({ description: '预估损失金额' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  estimatedLoss?: number;

  @ApiPropertyOptional({ description: '实际损失金额' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  actualLoss?: number;

  @ApiPropertyOptional({ description: '客户满意度反馈' })
  @IsOptional()
  @IsString()
  customerSatisfaction?: string;

  @ApiPropertyOptional({ description: '处理人ID' })
  @IsOptional()
  @IsUUID()
  resolverId?: string;
}
