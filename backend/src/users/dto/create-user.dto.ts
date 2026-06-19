import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsNotEmpty()
  roleId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
