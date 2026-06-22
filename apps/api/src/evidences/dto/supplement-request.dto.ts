import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SupplementRequestDto {
  @ApiProperty({ description: '证据ID' })
  @IsUUID('4', { message: '证据ID格式不正确' })
  @IsNotEmpty({ message: '证据ID不能为空' })
  evidenceId: string;

  @ApiProperty({ description: '补附件原因', example: '缺少原始发票扫描件' })
  @IsString({ message: '补附件原因必须为字符串' })
  @IsNotEmpty({ message: '补附件原因不能为空' })
  @MaxLength(500, { message: '原因长度不能超过500个字符' })
  reason: string;
}
