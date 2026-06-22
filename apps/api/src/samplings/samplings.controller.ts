import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SamplingsService } from './samplings.service';
import { CreateSamplingDto, UpdateSamplingDto } from './dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Roles } from '@/auth/roles.decorator';
import { Permissions } from '@/auth/permissions.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole, Permission, SamplingStatus } from '@prisma/client';
import { UseInterceptors } from '@nestjs/common';
import { OperationLogInterceptor, OperationLog } from '@/common/interceptors/operation-log.interceptor';

@ApiTags('抽样记录')
@Controller('samplings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(OperationLogInterceptor)
export class SamplingsController {
  constructor(private readonly samplingsService: SamplingsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.COMPLIANCE_OFFICER, UserRole.AUDITOR)
  @Permissions(Permission.SAMPLING_CREATE)
  @OperationLog({
    targetType: 'SamplingRecord',
    action: 'CREATE' as any,
    description: '创建抽样方案',
  })
  @ApiOperation({ summary: '创建抽样方案' })
  create(
    @Body() createSamplingDto: CreateSamplingDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.samplingsService.create(createSamplingDto, user.id);
  }

  @Get()
  @Permissions(Permission.SAMPLING_VIEW)
  @ApiOperation({ summary: '获取抽样记录列表' })
  @ApiQuery({ name: 'status', enum: SamplingStatus, required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: SamplingStatus,
    @Query('taskId') taskId?: string,
    @Query('createdById') createdById?: string,
  ) {
    return this.samplingsService.findAll(pagination, { status, taskId, createdById });
  }

  @Get(':id')
  @Permissions(Permission.SAMPLING_VIEW)
  @ApiOperation({ summary: '获取抽样记录详情' })
  findOne(@Param('id') id: string) {
    return this.samplingsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.COMPLIANCE_OFFICER, UserRole.AUDITOR)
  @Permissions(Permission.SAMPLING_EDIT)
  @OperationLog({
    targetType: 'SamplingRecord',
    action: 'UPDATE' as any,
    targetIdField: 'id',
    description: '更新抽样方案',
  })
  @ApiOperation({ summary: '更新抽样方案' })
  update(@Param('id') id: string, @Body() updateSamplingDto: UpdateSamplingDto) {
    return this.samplingsService.update(id, updateSamplingDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @Permissions(Permission.SAMPLING_EDIT)
  @OperationLog({
    targetType: 'SamplingRecord',
    action: 'DELETE' as any,
    targetIdField: 'id',
    description: '删除抽样方案',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除抽样方案' })
  remove(@Param('id') id: string) {
    return this.samplingsService.remove(id);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.COMPLIANCE_OFFICER)
  @Permissions(Permission.SAMPLING_APPROVE)
  @OperationLog({
    targetType: 'SamplingRecord',
    action: 'APPROVE' as any,
    targetIdField: 'id',
    description: '审批抽样方案通过',
  })
  @ApiOperation({ summary: '审批抽样方案通过' })
  approve(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.samplingsService.approve(id, user.id);
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.COMPLIANCE_OFFICER)
  @Permissions(Permission.SAMPLING_APPROVE)
  @OperationLog({
    targetType: 'SamplingRecord',
    action: 'REJECT' as any,
    targetIdField: 'id',
    description: '审批抽样方案驳回',
  })
  @ApiOperation({ summary: '审批抽样方案驳回' })
  reject(@Param('id') id: string) {
    return this.samplingsService.reject(id);
  }
}
