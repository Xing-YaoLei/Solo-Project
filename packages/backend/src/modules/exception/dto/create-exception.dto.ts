import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsArray,
  IsObject,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExceptionType, ExceptionStatus, ConflictSeverity } from '@prisma/client';

export class ImpactScopeDto {
  @ApiPropertyOptional({ description: '涉及案件ID列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  caseIds?: string[];

  @ApiPropertyOptional({ description: '涉及开庭ID列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  hearingIds?: string[];

  @ApiPropertyOptional({ description: '涉及人员ID列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  userIds?: string[];

  @ApiPropertyOptional({ description: '涉及客户ID列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  clientIds?: string[];

  @ApiPropertyOptional({ description: '其他影响范围说明' })
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

export class ResponsibilityDto {
  @ApiPropertyOptional({ description: '主要责任人ID' })
  @IsOptional()
  @IsUUID()
  primaryResponsibleUserId?: string;

  @ApiPropertyOptional({ description: '次要责任人ID列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  secondaryResponsibleUserIds?: string[];

  @ApiPropertyOptional({ description: '责任部门' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: '责任原因分析' })
  @IsOptional()
  @IsString()
  reasonAnalysis?: string;

  @ApiPropertyOptional({ description: '责任认定结果' })
  @IsOptional()
  @IsString()
  determination?: string;
}

export class CreateExceptionDto {
  @ApiPropertyOptional({ description: '关联开庭ID' })
  @IsOptional()
  @IsUUID()
  hearingId?: string;

  @ApiPropertyOptional({ description: '关联案件ID' })
  @IsOptional()
  @IsUUID()
  caseId?: string;

  @ApiProperty({ description: '异常类型', enum: ExceptionType })
  @IsEnum(ExceptionType)
  @IsNotEmpty()
  exceptionType: ExceptionType;

  @ApiProperty({ description: '异常单标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '问题描述' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: '严重程度', enum: ConflictSeverity })
  @IsOptional()
  @IsEnum(ConflictSeverity)
  severity?: ConflictSeverity;

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
}
