import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ConflictType, ConflictSeverity } from '@prisma/client';

export class CreateConflictDto {
  @ApiProperty({ description: '开庭ID', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  hearingId: string;

  @ApiProperty({ description: '冲突类型', enum: ConflictType })
  @IsEnum(ConflictType)
  @IsNotEmpty()
  conflictType: ConflictType;

  @ApiProperty({ description: '严重程度', enum: ConflictSeverity })
  @IsEnum(ConflictSeverity)
  @IsNotEmpty()
  severity: ConflictSeverity;

  @ApiProperty({ description: '冲突描述', example: '律师在同一时间段已安排另一开庭' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: '涉及方A ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  involvedPartyA?: string;

  @ApiPropertyOptional({ description: '涉及方B ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  involvedPartyB?: string;

  @ApiPropertyOptional({ description: '涉及方A类型', example: 'LAWYER' })
  @IsString()
  @IsOptional()
  partyAType?: string;

  @ApiPropertyOptional({ description: '涉及方B类型', example: 'LAWYER' })
  @IsString()
  @IsOptional()
  partyBType?: string;

  @ApiPropertyOptional({ description: '涉及方A名称', example: '张三律师' })
  @IsString()
  @IsOptional()
  partyAName?: string;

  @ApiPropertyOptional({ description: '涉及方B名称', example: '李四律师' })
  @IsString()
  @IsOptional()
  partyBName?: string;

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
}
