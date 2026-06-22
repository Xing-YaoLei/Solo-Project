import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, IsDateString, MaxLength, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvidenceCategory } from '@prisma/client';

export class CreateEvidenceDto {
  @ApiProperty({ description: '证据标题', example: '2024年1月银行对账单' })
  @IsString({ message: '标题必须为字符串' })
  @IsNotEmpty({ message: '标题不能为空' })
  @MaxLength(200, { message: '标题长度不能超过200个字符' })
  title: string;

  @ApiPropertyOptional({ description: '证据描述' })
  @IsString({ message: '描述必须为字符串' })
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '证据分类', enum: EvidenceCategory, example: EvidenceCategory.FINANCIAL })
  @IsEnum(EvidenceCategory, { message: '证据分类不正确' })
  @IsNotEmpty({ message: '证据分类不能为空' })
  category: EvidenceCategory;

  @ApiProperty({ description: '所属任务ID' })
  @IsUUID('4', { message: '任务ID格式不正确' })
  @IsNotEmpty({ message: '任务ID不能为空' })
  taskId: string;

  @ApiPropertyOptional({ description: '关联单据编号', example: 'INV-2024-001' })
  @IsString({ message: '关联单据编号必须为字符串' })
  @IsOptional()
  relatedDocumentNo?: string;

  @ApiPropertyOptional({ description: '关联单据类型', example: '发票' })
  @IsString({ message: '关联单据类型必须为字符串' })
  @IsOptional()
  relatedDocumentType?: string;

  @ApiPropertyOptional({ description: '关联单据日期', example: '2024-01-15' })
  @IsDateString({}, { message: '关联单据日期格式不正确' })
  @IsOptional()
  relatedDocumentDate?: string;

  @ApiPropertyOptional({ description: '关联单据金额', example: 12500.50 })
  @IsNumber({}, { message: '关联单据金额必须为数字' })
  @IsOptional()
  relatedDocumentAmount?: number;
}
