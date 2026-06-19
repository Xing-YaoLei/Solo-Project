import { IsString, IsOptional, IsArray } from 'class-validator';
import { RoleEnum } from '@prisma/client';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  code?: RoleEnum;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  permissionIds?: string[];
}
