import { Controller, Get, Param, Query, UseGuards, Body, Put } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { UserRole } from '@rental/db'

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('role') role?: UserRole,
    @Query('keyword') keyword?: string,
  ) {
    return this.usersService.findAll({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      role,
      keyword,
    })
  }

  @Get('role/:role')
  async getByRole(@Param('role') role: UserRole) {
    return this.usersService.getUsersByRole(role)
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getStats() {
    return this.usersService.getStats()
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(id, data)
  }
}
