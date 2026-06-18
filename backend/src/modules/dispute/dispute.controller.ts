import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DisputeService } from './dispute.service';
import { CreateDisputeDto, UpdateDisputeDto, ResolveDisputeDto } from './dto/dispute.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { UserWithoutPassword } from '../auth/entities/auth.entity';

@ApiTags('争议处理')
@Controller('disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post('task/:taskId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: '创建争议' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(
    @Param('taskId') taskId: string,
    @Body() createDisputeDto: CreateDisputeDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.disputeService.create(taskId, createDisputeDto, currentUser);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: '获取任务的争议列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findByTaskId(
    @Param('taskId') taskId: string,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.disputeService.findByTaskId(taskId, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取争议详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '争议不存在' })
  async findOne(
    @Param('id') id: string,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.disputeService.findOne(id, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新争议' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '争议不存在' })
  async update(
    @Param('id') id: string,
    @Body() updateDisputeDto: UpdateDisputeDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.disputeService.update(id, updateDisputeDto, currentUser);
  }

  @Post(':id/resolve')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: '解决争议（监理处理）' })
  @ApiResponse({ status: 200, description: '处理成功' })
  async resolve(
    @Param('id') id: string,
    @Body() resolveDisputeDto: ResolveDisputeDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.disputeService.resolve(id, resolveDisputeDto, currentUser);
  }

  @Post(':id/close')
  @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: '关闭争议（监理关闭）' })
  @ApiResponse({ status: 200, description: '关闭成功' })
  async close(
    @Param('id') id: string,
    @Body() resolveDisputeDto: ResolveDisputeDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.disputeService.close(id, resolveDisputeDto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除争议' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '争议不存在' })
  async delete(
    @Param('id') id: string,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.disputeService.delete(id, currentUser);
  }
}
