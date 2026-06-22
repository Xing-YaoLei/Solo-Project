import { IsString, IsOptional, IsUUID, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadAttachmentDto {
  @ApiProperty({ description: '证据ID' })
  @IsUUID('4', { message: '证据ID格式不正确' })
  evidenceId: string;

  @ApiPropertyOptional({ description: '附件描述' })
  @IsString({ message: '附件描述必须为字符串' })
  @MaxLength(500, { message: '描述长度不能超过500个字符' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '是否是补附件', default: false })
  @IsBoolean({ message: '是否补附件必须为布尔值' })
  @IsOptional()
  isSupplement?: boolean;

  @ApiPropertyOptional({ description: '关联的补附件请求ID', required: false })
  @IsUUID('4', { message: '补附件请求ID格式不正确' })
  @IsOptional()
  supplementRequestId?: string;
}
