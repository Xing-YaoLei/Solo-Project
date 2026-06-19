import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RoleEnum } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles(RoleEnum.MANAGER)
  @Permissions('role:manage')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @Roles(RoleEnum.MANAGER)
  @Permissions('role:read')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Roles(RoleEnum.MANAGER)
  @Permissions('role:read')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleEnum.MANAGER)
  @Permissions('role:manage')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @Roles(RoleEnum.MANAGER)
  @Permissions('role:manage')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
