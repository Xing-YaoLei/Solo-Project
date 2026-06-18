import { IsOptional, IsString, IsEmail, IsEnum, IsBoolean, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '张三' })
  @IsString()
  name: string;

  @ApiProperty({ example: '13800138000', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.OWNER })
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class QueryUsersDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({ enum: UserRole, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
