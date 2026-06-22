import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChecklistsService } from './checklists.service';
import {
  CreateChecklistDto,
  UpdateChecklistDto,
  ExecuteChecklistDto,
  UpdateChecklistItemResultDto,
} from './dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Roles } from '@/auth/roles.decorator';
import { Permissions } from '@/auth/permissions.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole, Permission, OperationAction } from '@prisma/client';
import { UseInterceptors } from '@nestjs/common';
import { OperationLogInterceptor, OperationLog } from '@/common/interceptors/operation-log.interceptor';

@ApiTags('检查清单')
@Controller('checklists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(OperationLogInterceptor)
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.COMPLIANCE_OFFICER)
  @Permissions(Permission.CHECKLIST_CREATE)
  @OperationLog({
    targetType: 'Checklist',
    action: OperationAction.CREATE,
    description: '创建检查清单',
  })
  @ApiOperation({ summary: '创建检查清单模板' })
  create(
    @Body() createChecklistDto: CreateChecklistDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.checklistsService.create(createChecklistDto, user.id);
  }

  @Get()
  @Permissions(Permission.CHECKLIST_VIEW)
  @ApiOperation({ summary: '获取检查清单列表' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.checklistsService.findAll(pagination, {
      category,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('executions')
  @Permissions(Permission.CHECKLIST_VIEW)
  @ApiOperation({ summary: '获取清单执行记录列表' })
  findExecutions(
    @Query() pagination: PaginationDto,
    @Query('checklistId') checklistId?: string,
    @Query('taskId') taskId?: string,
    @Query('executedById') executedById?: string,
  ) {
    return this.checklistsService.findExecutions(pagination, {
      checklistId,
      taskId,
      executedById,
    });
  }

  @Get(':id')
  @Permissions(Permission.CHECKLIST_VIEW)
  @ApiOperation({ summary: '获取检查清单详情' })
  findOne(@Param('id') id: string) {
    return this.checklistsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.COMPLIANCE_OFFICER)
  @Permissions(Permission.CHECKLIST_EDIT)
  @OperationLog({
    targetType: 'Checklist',
    action: OperationAction.UPDATE,
    targetIdField: 'id',
    description: '更新检查清单',
  })
  @ApiOperation({ summary: '更新检查清单' })
  update(@Param('id') id: string, @Body() updateChecklistDto: UpdateChecklistDto) {
    return this.checklistsService.update(id, updateChecklistDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @Permissions(Permission.CHECKLIST_EDIT)
  @OperationLog({
    targetType: 'Checklist',
    action: OperationAction.DELETE,
    targetIdField: 'id',
    description: '删除检查清单',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除检查清单' })
  remove(@Param('id') id: string) {
    return this.checklistsService.remove(id);
  }

  @Post(':id/execute')
  @Permissions(Permission.CHECKLIST_EXECUTE)
  @ApiOperation({ summary: '执行检查清单（生成执行记录）' })
  execute(
    @Param('id') id: string,
    @Body() executeDto: ExecuteChecklistDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.checklistsService.execute(id, executeDto, user.id);
  }

  @Post('result/update')
  @Permissions(Permission.CHECKLIST_EXECUTE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新检查项执行结果' })
  updateItemResult(
    @Body() updateDto: UpdateChecklistItemResultDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.checklistsService.updateItemResult(updateDto, user.id);
  }
}
