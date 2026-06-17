import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BatchOperationsService } from './batch-operations.service';
import { CreateBatchOperationDto } from './dto/create-batch-operation.dto';
import { QueryBatchOperationDto } from './dto/query-batch-operation.dto';
import { CurrentUser, CurrentUserType } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('批量操作')
@ApiBearerAuth()
@Controller('batch-operations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BatchOperationsController {
  constructor(private readonly batchOperationsService: BatchOperationsService) {}

  @Post()
  @ApiOperation({ summary: '创建批量操作' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  create(
    @Body() createBatchOperationDto: CreateBatchOperationDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.batchOperationsService.create(createBatchOperationDto, user);
  }

  @Get()
  @ApiOperation({ summary: '分页查询批量操作列表' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  findAll(@Query() query: QueryBatchOperationDto) {
    return this.batchOperationsService.findAll(query);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: '获取批量操作进度' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  getProgress(@Param('id') id: string) {
    return this.batchOperationsService.getProgress(id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取批量操作详情' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  findOne(@Param('id') id: string) {
    return this.batchOperationsService.findOne(id);
  }

  @Get(':batchId/items/:itemId')
  @ApiOperation({ summary: '获取批量操作单条详情' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  getItemDetails(
    @Param('batchId') batchId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.batchOperationsService.getItemDetails(batchId, itemId);
  }

  @Get(':id/failed')
  @ApiOperation({ summary: '获取批量操作失败列表' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  getFailedItems(@Param('id') id: string) {
    return this.batchOperationsService.getFailedItems(id);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: '重试批量操作失败项' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  retryFailed(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.batchOperationsService.retryFailed(id, user);
  }
}
