import { Controller, Get, Query, Param, Post, Body, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @Query('role') role?: UserRole,
    @Query('region') region?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.usersService.findAll({
      role,
      region,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  }

  @Get('operators')
  async getOperators() {
    return this.usersService.getOperators();
  }

  @Get('regions')
  async getRegions() {
    return this.usersService.getRegions();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  async create(@Body() data: { name: string; email: string; phone?: string; role: UserRole; region?: string }) {
    return this.usersService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(id, data);
  }
}
