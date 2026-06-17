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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AfterSalesService } from './after-sales.service';
import { CreateAfterSalesDto } from './dto/create-after-sales.dto';
import { UpdateAfterSalesDto } from './dto/update-after-sales.dto';
import { QueryAfterSalesDto } from './dto/query-after-sales.dto';
import { StatusChangeDto, BatchStatusUpdateDto } from './dto/status-change.dto';
import { CurrentUser, CurrentUserType } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('售后工单')
@ApiBearerAuth()
@Controller('after-sales')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AfterSalesController {
  constructor(private readonly afterSalesService: AfterSalesService) {}

  @Post()
  @ApiOperation({ summary: '创建售后工单' })
  @Roles(UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  create(
    @Body() createAfterSalesDto: CreateAfterSalesDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.afterSalesService.create(createAfterSalesDto, user);
  }

  @Get()
  @ApiOperation({ summary: '分页查询售后工单列表' })
  @Roles(UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  findAll(@Query() query: QueryAfterSalesDto) {
    return this.afterSalesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取售后工单详情' })
  @Roles(UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  findOne(@Param('id') id: string) {
    return this.afterSalesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新售后工单' })
  @Roles(UserRole.FOREMAN, UserRole.SUPERVISOR)
  update(
    @Param('id') id: string,
    @Body() updateAfterSalesDto: UpdateAfterSalesDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.afterSalesService.update(id, updateAfterSalesDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除售后工单' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPERVISOR, UserRole.OWNER)
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.afterSalesService.remove(id, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '状态变更' })
  @Roles(UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  changeStatus(
    @Param('id') id: string,
    @Body() statusChangeDto: StatusChangeDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.afterSalesService.changeStatus(id, statusChangeDto, user);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: '分配处理人' })
  @Roles(UserRole.SUPERVISOR, UserRole.OWNER)
  assign(
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.afterSalesService.assign(id, assigneeId, user);
  }

  @Post('batch/status')
  @ApiOperation({ summary: '批量状态更新' })
  @Roles(UserRole.SUPERVISOR, UserRole.OWNER)
  batchUpdateStatus(
    @Body() batchStatusUpdateDto: BatchStatusUpdateDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.afterSalesService.batchUpdateStatus(batchStatusUpdateDto, user);
  }
}
