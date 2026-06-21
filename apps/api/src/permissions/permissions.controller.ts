import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../common/auth/roles.guard';
import { UserRole } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

class UpdateSensitiveFieldsDto {
  fields: Array<{
    name: string;
    visibleRoles: UserRole[];
    maskPattern?: string;
  }>;
}

class UpdateSingleSensitiveFieldDto {
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @IsOptional()
  @IsString()
  maskPattern?: string;
}

@ApiTags('权限管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('roles')
  @ApiOperation({ summary: '获取所有角色列表' })
  getRoles() {
    return this.permissionsService.getRoles();
  }

  @Get('sensitive-fields')
  @ApiOperation({ summary: '获取敏感字段配置' })
  @Roles(UserRole.SUPERVISOR)
  getSensitiveFields() {
    return this.permissionsService.getSensitiveFields();
  }

  @Put('sensitive-fields/:field')
  @ApiOperation({ summary: '按字段更新单个敏感字段配置' })
  @Roles(UserRole.SUPERVISOR)
  updateSensitiveField(
    @Param('field') field: string,
    @Body() dto: UpdateSingleSensitiveFieldDto,
  ) {
    return this.permissionsService.updateSensitiveField(field, {
      roles: dto.roles,
      maskPattern: dto.maskPattern,
    });
  }

  @Put('sensitive-fields')
  @ApiOperation({ summary: '批量更新敏感字段配置' })
  @Roles(UserRole.SUPERVISOR)
  updateSensitiveFields(@Body() dto: UpdateSensitiveFieldsDto) {
    return this.permissionsService.updateSensitiveFieldsBatch(dto.fields);
  }
}
