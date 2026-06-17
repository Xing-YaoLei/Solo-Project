import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OperationLogsService } from './operation-logs.service';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('操作日志')
@ApiBearerAuth()
@Controller('operation-logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OperationLogsController {
  constructor(private readonly operationLogsService: OperationLogsService) {}

  @Get()
  @ApiOperation({ summary: '分页查询操作日志列表' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  findAll(@Query() query: QueryOperationLogDto) {
    return this.operationLogsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取操作日志统计' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  getOperationStats(@Query() query: QueryOperationLogDto) {
    return this.operationLogsService.getOperationStats(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取操作日志详情' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  findOne(@Param('id') id: string) {
    return this.operationLogsService.findOne(id);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: '按实体查询操作日志' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  getByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query() query: QueryOperationLogDto,
  ) {
    return this.operationLogsService.getByEntity(entityType, entityId, query);
  }

  @Get('operator/:operatorId')
  @ApiOperation({ summary: '按操作人查询操作日志' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  getByOperator(
    @Param('operatorId') operatorId: string,
    @Query() query: QueryOperationLogDto,
  ) {
    return this.operationLogsService.getByOperator(operatorId, query);
  }
}
