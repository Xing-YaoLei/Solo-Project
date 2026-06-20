import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { DepartmentType } from '@prisma/client';

class CreateDepartmentDto {
  name: string;
  code: string;
  type: DepartmentType;
  parentId?: string;
  sortOrder?: number;
}

class UpdateDepartmentDto {
  name?: string;
  code?: string;
  type?: DepartmentType;
  parentId?: string;
  sortOrder?: number;
}

@ApiTags('部门')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get('tree')
  @ApiOperation({ summary: '获取部门树形结构' })
  getTree() {
    return this.departmentsService.getTree();
  }

  @Get()
  @ApiOperation({ summary: '获取所有部门' })
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个部门' })
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建部门' })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新部门' })
  update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除部门' })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
