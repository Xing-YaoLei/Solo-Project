import { IsString, IsNotEmpty, MinLength, MaxLength, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ description: '用户名', example: 'newuser' })
  @IsString({ message: '用户名必须为字符串' })
  @MinLength(3, { message: '用户名长度不能少于3位' })
  @MaxLength(30, { message: '用户名长度不能超过30位' })
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @ApiProperty({ description: '邮箱', example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({ description: '密码', example: 'password123', minLength: 6, maxLength: 50 })
  @IsString({ message: '密码必须为字符串' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  @MaxLength(50, { message: '密码长度不能超过50位' })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;

  @ApiProperty({ description: '姓名', example: '张三' })
  @IsString({ message: '姓名必须为字符串' })
  @IsNotEmpty({ message: '姓名不能为空' })
  fullName: string;

  @ApiProperty({ description: '角色', enum: UserRole, example: UserRole.AUDITOR })
  @IsEnum(UserRole, { message: '角色类型不正确' })
  @IsNotEmpty({ message: '角色不能为空' })
  role: UserRole;

  @ApiPropertyOptional({ description: '部门', example: '审计部' })
  @IsString({ message: '部门必须为字符串' })
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: '职位', example: '高级审计员' })
  @IsString({ message: '职位必须为字符串' })
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ description: '电话', example: '13800138000' })
  @IsString({ message: '电话必须为字符串' })
  @IsOptional()
  phone?: string;
}
