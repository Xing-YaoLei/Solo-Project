import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('房源管理')
@ApiBearerAuth()
@Controller('properties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: '获取房源列表' })
  async findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ) {
    const result = await this.propertiesService.findAll(req.user, {
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      keyword,
    });
    if (!page && !pageSize) {
      return result.list;
    }
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: '获取房源详情' })
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(parseInt(id));
  }

  @Get(':id/rooms')
  @ApiOperation({ summary: '获取房源房间列表' })
  getRooms(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.propertiesService.getRooms(parseInt(id), {
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '创建房源' })
  create(@Body() createPropertyDto: any) {
    return this.propertiesService.create(createPropertyDto);
  }

  @Post(':id/rooms')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '添加房间' })
  addRoom(@Param('id') id: string, @Body() roomDto: any) {
    return this.propertiesService.addRoom(parseInt(id), roomDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '更新房源' })
  update(@Param('id') id: string, @Body() updatePropertyDto: any) {
    return this.propertiesService.update(parseInt(id), updatePropertyDto);
  }

  @Patch('rooms/:roomId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '更新房间' })
  updateRoom(@Param('roomId') roomId: string, @Body() roomDto: any) {
    return this.propertiesService.updateRoom(parseInt(roomId), roomDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '删除房源' })
  remove(@Param('id') id: string) {
    return this.propertiesService.remove(parseInt(id));
  }
}
