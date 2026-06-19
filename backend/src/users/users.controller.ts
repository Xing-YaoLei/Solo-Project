import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RoleEnum } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(RoleEnum.MANAGER)
  @Permissions('user:manage')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('user:read')
  findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 10) {
    return this.usersService.findAll(+page, +pageSize);
  }

  @Get(':id')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('user:read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleEnum.MANAGER)
  @Permissions('user:manage')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(RoleEnum.MANAGER)
  @Permissions('user:manage')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
