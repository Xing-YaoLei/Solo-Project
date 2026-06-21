import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ResolveConflictDto {
  @ApiProperty({ description: '解决人ID', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  resolvedBy: string;

  @ApiProperty({ description: '解决方案', example: '已将另一开庭改期，冲突消除' })
  @IsString()
  @IsNotEmpty()
  resolution: string;

  @ApiProperty({ description: '冲突描述备注（可选）', required: false })
  @IsString()
  @IsOptional()
  remark?: string;
}
