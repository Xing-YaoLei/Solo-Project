import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConfirmationVersionService } from './confirmation-version.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserWithoutPassword } from '../auth/entities/auth.entity';

@ApiTags('确认版本')
@Controller('confirmation-tasks/:taskId/versions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ConfirmationVersionController {
  constructor(private readonly confirmationVersionService: ConfirmationVersionService) {}

  @Get()
  @ApiOperation({ summary: '获取任务版本列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findByTaskId(
    @Param('taskId') taskId: string,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.confirmationVersionService.findByTaskId(taskId, currentUser);
  }

  @Get(':version')
  @ApiOperation({ summary: '获取指定版本详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '版本不存在' })
  async findOne(
    @Param('taskId') taskId: string,
    @Param('version') version: number,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.confirmationVersionService.findOne(taskId, version, currentUser);
  }

  @Get('compare')
  @ApiOperation({ summary: '比较两个版本' })
  @ApiQuery({ name: 'version1', type: Number })
  @ApiQuery({ name: 'version2', type: Number })
  async compareVersions(
    @Param('taskId') taskId: string,
    @Query('version1') version1: number,
    @Query('version2') version2: number,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.confirmationVersionService.compareVersions(
      taskId,
      Number(version1),
      Number(version2),
      currentUser,
    );
  }
}
