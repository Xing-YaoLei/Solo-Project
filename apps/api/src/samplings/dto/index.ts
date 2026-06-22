import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, IsInt, Min, Max, IsNumber, IsArray, ValidateNested, IsBoolean, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SamplingMethod } from '@prisma/client';

export class SamplingItemDto {
  @ApiProperty({ description: '样本编号', example: 'S001' })
  @IsString({ message: '样本编号必须为字符串' })
  @IsNotEmpty({ message: '样本编号不能为空' })
  itemNo: string;

  @ApiPropertyOptional({ description: '关联单据号' })
  @IsString({ message: '关联单据号必须为字符串' })
  @IsOptional()
  documentNo?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsString({ message: '描述必须为字符串' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '金额' })
  @IsNumber({}, { message: '金额必须为数字' })
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ description: '是否存在缺陷' })
  @IsBoolean({ message: '是否缺陷必须为布尔值' })
  @IsOptional()
  isDefect?: boolean;

  @ApiPropertyOptional({ description: '缺陷类型' })
  @IsString({ message: '缺陷类型必须为字符串' })
  @IsOptional()
  defectType?: string;

  @ApiPropertyOptional({ description: '缺陷等级: LOW/MEDIUM/HIGH/CRITICAL' })
  @IsString({ message: '缺陷等级必须为字符串' })
  @IsOptional()
  defectLevel?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString({ message: '备注必须为字符串' })
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({ description: '关联证据ID' })
  @IsUUID('4', { message: '证据ID格式不正确' })
  @IsOptional()
  evidenceId?: string;
}

export class CreateSamplingDto {
  @ApiProperty({ description: '抽样标题', example: '2024Q1销售发票抽样' })
  @IsString({ message: '标题必须为字符串' })
  @IsNotEmpty({ message: '标题不能为空' })
  @MaxLength(200, { message: '标题不能超过200字符' })
  title: string;

  @ApiProperty({ description: '关联任务ID' })
  @IsUUID('4', { message: '任务ID格式不正确' })
  @IsNotEmpty({ message: '任务ID不能为空' })
  taskId: string;

  @ApiProperty({ description: '抽样方法', enum: SamplingMethod, example: SamplingMethod.RANDOM })
  @IsEnum(SamplingMethod, { message: '抽样方法不正确' })
  @IsNotEmpty({ message: '抽样方法不能为空' })
  method: SamplingMethod;

  @ApiProperty({ description: '总体数量', example: 1000, minimum: 1 })
  @IsInt({ message: '总体数量必须为整数' })
  @Min(1, { message: '总体数量最小为1' })
  population: number;

  @ApiProperty({ description: '样本数量', example: 50, minimum: 1 })
  @IsInt({ message: '样本数量必须为整数' })
  @Min(1, { message: '样本数量最小为1' })
  sampleSize: number;

  @ApiPropertyOptional({ description: '置信水平', example: 0.95 })
  @IsNumber({}, { message: '置信水平必须为数字' })
  @IsOptional()
  confidenceLevel?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsString({ message: '备注必须为字符串' })
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({ description: '样本数据列表', type: [SamplingItemDto] })
  @IsArray({ message: '样本数据必须为数组' })
  @ValidateNested({ each: true })
  @Type(() => SamplingItemDto)
  @IsOptional()
  samples?: SamplingItemDto[];
}

export class UpdateSamplingDto {
  @ApiPropertyOptional({ description: '抽样标题' })
  @IsString({ message: '标题必须为字符串' })
  @MaxLength(200, { message: '标题不能超过200字符' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: '抽样方法', enum: SamplingMethod })
  @IsEnum(SamplingMethod, { message: '抽样方法不正确' })
  @IsOptional()
  method?: SamplingMethod;

  @ApiPropertyOptional({ description: '总体数量', minimum: 1 })
  @IsInt({ message: '总体数量必须为整数' })
  @Min(1, { message: '总体数量最小为1' })
  @IsOptional()
  population?: number;

  @ApiPropertyOptional({ description: '样本数量', minimum: 1 })
  @IsInt({ message: '样本数量必须为整数' })
  @Min(1, { message: '样本数量最小为1' })
  @IsOptional()
  sampleSize?: number;

  @ApiPropertyOptional({ description: '置信水平' })
  @IsNumber({}, { message: '置信水平必须为数字' })
  @IsOptional()
  confidenceLevel?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsString({ message: '备注必须为字符串' })
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({ description: '样本数据列表（替换）', type: [SamplingItemDto] })
  @IsArray({ message: '样本数据必须为数组' })
  @ValidateNested({ each: true })
  @Type(() => SamplingItemDto)
  @IsOptional()
  samples?: SamplingItemDto[];
}
