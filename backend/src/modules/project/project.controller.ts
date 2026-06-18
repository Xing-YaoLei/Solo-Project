import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto, QueryProjectsDto } from './dto/project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { UserWithoutPassword } from '../auth/entities/auth.entity';

@ApiTags('项目管理')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: '创建项目' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.projectService.create(createProjectDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: '获取项目列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query() queryProjectsDto: QueryProjectsDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.projectService.findAll(queryProjectsDto, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取项目详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '项目不存在' })
  async findOne(
    @Param('id') id: string,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.projectService.findOne(id, currentUser);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: '获取项目统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getProjectStats(
    @Param('id') id: string,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.projectService.getProjectStats(id, currentUser);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: '更新项目' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '项目不存在' })
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.projectService.update(id, updateProjectDto, currentUser);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除项目' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '项目不存在' })
  async remove(
    @Param('id') id: string,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.projectService.remove(id, currentUser);
  }
}
