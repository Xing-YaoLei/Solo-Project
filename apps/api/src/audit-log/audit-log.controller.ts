import { Controller, Get, Param, Patch, Query, UseGuards, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { HandleUnauthorizedDto } from '@/notifications/dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Roles } from '@/auth/roles.decorator';
import { Permissions } from '@/auth/permissions.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole, Permission, OperationAction, UnauthorizedSeverity, UnauthorizedStatus } from '@prisma/client';

@ApiTags('审计日志')
@Controller('audit-log')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('operations')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @Permissions(Permission.AUDIT_LOG_VIEW)
  @ApiOperation({ summary: '查询操作日志' })
  @ApiQuery({ name: 'targetType', required: false })
  @ApiQuery({ name: 'action', enum: OperationAction, required: false })
  findOperations(
    @Query() pagination: PaginationDto,
    @Query('targetType') targetType?: string,
    @Query('action') action?: OperationAction,
    @Query('operatorId') operatorId?: string,
    @Query('taskId') taskId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditLogService.findOperationLogs(pagination, {
      targetType,
      action,
      operatorId,
      taskId,
      startDate,
      endDate,
    });
  }

  @Get('operations/target/:targetType/:targetId')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @Permissions(Permission.AUDIT_LOG_VIEW)
  @ApiOperation({ summary: '按目标查询操作日志' })
  findOperationsByTarget(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.auditLogService.findOperationLogsByTarget(targetType, targetId, pagination);
  }

  @Get('unauthorized')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @Permissions(Permission.UNAUTHORIZED_VIEW)
  @ApiOperation({ summary: '查询越权记录' })
  @ApiQuery({ name: 'severity', enum: UnauthorizedSeverity, required: false })
  @ApiQuery({ name: 'status', enum: UnauthorizedStatus, required: false })
  findUnauthorized(
    @Query() pagination: PaginationDto,
    @Query('userId') userId?: string,
    @Query('resourceType') resourceType?: string,
    @Query('severity') severity?: UnauthorizedSeverity,
    @Query('status') status?: UnauthorizedStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditLogService.findUnauthorizedAccess(pagination, {
      userId,
      resourceType,
      severity,
      status,
      startDate,
      endDate,
    });
  }

  @Get('unauthorized/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @Permissions(Permission.UNAUTHORIZED_VIEW)
  @ApiOperation({ summary: '获取越权记录详情' })
  findOneUnauthorized(@Param('id') id: string) {
    try {
      return this.auditLogService.findOneUnauthorized(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Patch('unauthorized/:id/handle')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @Permissions(Permission.UNAUTHORIZED_VIEW)
  @ApiOperation({ summary: '处理越权记录' })
  handleUnauthorized(
    @Param('id') id: string,
    @Body() handleDto: HandleUnauthorizedDto,
    @CurrentUser() user: { id: string },
  ) {
    try {
      return this.auditLogService.handleUnauthorized(id, handleDto, user.id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
  @Permissions(Permission.AUDIT_LOG_VIEW, Permission.UNAUTHORIZED_VIEW)
  @ApiOperation({ summary: '审计统计概览' })
  getStats() {
    return this.auditLogService.getAuditStats();
  }
}
