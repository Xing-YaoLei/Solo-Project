import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewResult, ReviewTargetType } from '@prisma/client';

export class CreateReviewDto {
  @ApiProperty({ description: '复核目标类型', enum: ReviewTargetType, example: ReviewTargetType.EVIDENCE })
  @IsEnum(ReviewTargetType, { message: '复核目标类型不正确' })
  @IsNotEmpty({ message: '复核目标类型不能为空' })
  targetType: ReviewTargetType;

  @ApiProperty({ description: '复核目标ID' })
  @IsUUID('4', { message: '目标ID格式不正确' })
  @IsNotEmpty({ message: '目标ID不能为空' })
  targetId: string;

  @ApiProperty({ description: '复核结果', enum: ReviewResult, example: ReviewResult.APPROVED })
  @IsEnum(ReviewResult, { message: '复核结果不正确' })
  @IsNotEmpty({ message: '复核结果不能为空' })
  result: ReviewResult;

  @ApiPropertyOptional({ description: '复核意见' })
  @IsString({ message: '复核意见必须为字符串' })
  @MaxLength(2000, { message: '复核意见长度不能超过2000个字符' })
  @IsOptional()
  comment?: string;
}
