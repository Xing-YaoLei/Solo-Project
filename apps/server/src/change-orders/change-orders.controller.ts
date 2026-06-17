import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ChangeOrdersService } from './change-orders.service';
import { CreateChangeOrderDto } from './dto/create-change-order.dto';
import { UpdateChangeOrderDto } from './dto/update-change-order.dto';
import { QueryChangeOrderDto } from './dto/query-change-order.dto';
import { StatusChangeDto, BatchStatusUpdateDto } from './dto/status-change.dto';
import { CurrentUser, CurrentUserType } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('设计变更单')
@ApiBearerAuth()
@Controller('change-orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ChangeOrdersController {
  constructor(private readonly changeOrdersService: ChangeOrdersService) {}

  @Post()
  @ApiOperation({ summary: '创建设计变更单' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  create(
    @Body() createChangeOrderDto: CreateChangeOrderDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.changeOrdersService.create(createChangeOrderDto, user);
  }

  @Get()
  @ApiOperation({ summary: '分页查询设计变更单列表' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  findAll(@Query() query: QueryChangeOrderDto) {
    return this.changeOrdersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取设计变更单详情' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  findOne(@Param('id') id: string) {
    return this.changeOrdersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新设计变更单' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR)
  update(
    @Param('id') id: string,
    @Body() updateChangeOrderDto: UpdateChangeOrderDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.changeOrdersService.update(id, updateChangeOrderDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除设计变更单' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.DESIGNER, UserRole.SUPERVISOR)
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.changeOrdersService.remove(id, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '状态变更' })
  @Roles(UserRole.DESIGNER, UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  changeStatus(
    @Param('id') id: string,
    @Body() statusChangeDto: StatusChangeDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.changeOrdersService.changeStatus(id, statusChangeDto, user);
  }

  @Post('batch/status')
  @ApiOperation({ summary: '批量状态更新' })
  @Roles(UserRole.DESIGNER, UserRole.SUPERVISOR, UserRole.OWNER)
  batchUpdateStatus(
    @Body() batchStatusUpdateDto: BatchStatusUpdateDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.changeOrdersService.batchUpdateStatus(batchStatusUpdateDto, user);
  }
}
