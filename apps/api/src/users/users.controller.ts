import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Roles } from '@/auth/roles.decorator';
import { Permissions } from '@/auth/permissions.decorator';
import { UserRole, Permission } from '@prisma/client';
import { UseInterceptors } from '@nestjs/common';
import { OperationLogInterceptor, OperationLog } from '@/common/interceptors/operation-log.interceptor';

@ApiTags('用户管理')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(OperationLogInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.USER_MANAGE)
  @OperationLog({
    targetType: 'User',
    action: 'CREATE' as any,
    description: '创建用户',
  })
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 409, description: '用户名或邮箱已存在' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @Permissions(Permission.USER_MANAGE)
  @ApiOperation({ summary: '获取用户列表' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('role') role?: UserRole,
    @Query('department') department?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.usersService.findAll(pagination, {
      role,
      department,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('departments')
  @ApiOperation({ summary: '获取部门列表' })
  getDepartments() {
    return this.usersService.getDepartments();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @Permissions(Permission.USER_MANAGE)
  @ApiOperation({ summary: '获取用户详情' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.USER_MANAGE)
  @OperationLog({
    targetType: 'User',
    action: 'UPDATE' as any,
    targetIdField: 'id',
    description: '更新用户信息',
  })
  @ApiOperation({ summary: '更新用户' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.USER_MANAGE)
  @OperationLog({
    targetType: 'User',
    action: 'DELETE' as any,
    targetIdField: 'id',
    description: '删除(禁用)用户',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除用户(禁用)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.USER_MANAGE)
  @OperationLog({
    targetType: 'User',
    action: 'UPDATE' as any,
    targetIdField: 'id',
    description: '切换用户启用状态',
  })
  @ApiOperation({ summary: '切换用户启用状态' })
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }
}
