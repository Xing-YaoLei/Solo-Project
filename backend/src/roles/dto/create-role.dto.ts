import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { RoleEnum } from '@prisma/client';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  code: RoleEnum;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  permissionIds?: string[];
}
