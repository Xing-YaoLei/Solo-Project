import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { CreateIssueDto, UpdateIssueDto, MarkRecurredDto } from './dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Roles } from '@/auth/roles.decorator';
import { Permissions } from '@/auth/permissions.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole, Permission, IssueSeverity, IssueStatus } from '@prisma/client';
import { UseInterceptors } from '@nestjs/common';
import { OperationLogInterceptor, OperationLog } from '@/common/interceptors/operation-log.interceptor';

@ApiTags('问题追踪')
@Controller('issues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(OperationLogInterceptor)
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.COMPLIANCE_OFFICER, UserRole.AUDITOR)
  @OperationLog({
    targetType: 'Issue',
    action: 'CREATE' as any,
    description: '创建问题记录',
  })
  @ApiOperation({ summary: '创建问题' })
  create(
    @Body() createDto: CreateIssueDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.issuesService.create(createDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取问题列表' })
  @ApiQuery({ name: 'severity', enum: IssueSeverity, required: false })
  @ApiQuery({ name: 'status', enum: IssueStatus, required: false })
  @ApiQuery({ name: 'isRecurred', type: Boolean, required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('severity') severity?: IssueSeverity,
    @Query('status') status?: IssueStatus,
    @Query('category') category?: string,
    @Query('subCategory') subCategory?: string,
    @Query('department') department?: string,
    @Query('taskId') taskId?: string,
    @Query('ownerId') ownerId?: string,
    @Query('isRecurred') isRecurred?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.issuesService.findAll(pagination, {
      severity,
      status,
      category,
      subCategory,
      department,
      taskId,
      ownerId,
      isRecurred: isRecurred !== undefined ? isRecurred === 'true' : undefined,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取问题详情' })
  findOne(@Param('id') id: string) {
    return this.issuesService.findOne(id);
  }

  @Get(':id/recurrence-chain')
  @ApiOperation({ summary: '查询问题复发链' })
  findRecurrenceChain(@Param('id') id: string) {
    return this.issuesService.findRecurrenceChain(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.COMPLIANCE_OFFICER)
  @OperationLog({
    targetType: 'Issue',
    action: 'UPDATE' as any,
    targetIdField: 'id',
    description: '更新问题信息',
  })
  @ApiOperation({ summary: '更新问题' })
  update(@Param('id') id: string, @Body() updateDto: UpdateIssueDto) {
    return this.issuesService.update(id, updateDto);
  }

  @Post(':id/recur')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.COMPLIANCE_OFFICER)
  @OperationLog({
    targetType: 'Issue',
    action: 'UPDATE' as any,
    targetIdField: 'id',
    description: '标记问题为复发',
  })
  @ApiOperation({ summary: '标记问题为复发（关联父问题）' })
  markRecurred(
    @Param('id') id: string,
    @Body() markDto: MarkRecurredDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.issuesService.markRecurred(id, markDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @OperationLog({
    targetType: 'Issue',
    action: 'DELETE' as any,
    targetIdField: 'id',
    description: '删除问题',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除问题' })
  remove(@Param('id') id: string) {
    return this.issuesService.remove(id);
  }
}
