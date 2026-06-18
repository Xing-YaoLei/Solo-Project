import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChatMessageDto {
  @ApiProperty({ example: '这是一条备注消息' })
  @IsString()
  content: string;

  @ApiProperty({ example: 'TEXT', required: false })
  @IsString()
  @IsOptional()
  type?: string;
}
