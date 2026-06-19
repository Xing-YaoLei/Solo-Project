import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from '@prisma/client';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() data: {
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    avatar?: string;
  }) {
    return this.usersService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: {
    name?: string;
    phone?: string;
    role?: UserRole;
    avatar?: string;
  }) {
    return this.usersService.update(id, data);
  }
}
