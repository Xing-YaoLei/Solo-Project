import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { Role } from '@prisma/client';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(
    @Query('role') role?: Role,
    @Query('search') search?: string,
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
  ) {
    return this.userService.findAll({ role, search, page, pageSize });
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findById(id);
  }

  @Post()
  create(@Body() data: { username: string; name: string; email?: string; phone?: string; role: Role; avatar?: string }) {
    return this.userService.create(data);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.userService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }

  @Get('role/:role')
  getUsersByRole(@Param('role') role: Role) {
    return this.userService.getUsersByRole(role);
  }
}
