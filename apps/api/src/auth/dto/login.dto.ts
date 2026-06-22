import { IsString, IsNotEmpty, MinLength, MaxLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: '用户名或邮箱', example: 'admin' })
  @IsString({ message: '登录标识必须为字符串' })
  @IsNotEmpty({ message: '登录标识不能为空' })
  identifier: string;

  @ApiProperty({ description: '密码', example: 'password123', minLength: 6, maxLength: 50 })
  @IsString({ message: '密码必须为字符串' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  @MaxLength(50, { message: '密码长度不能超过50位' })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}
