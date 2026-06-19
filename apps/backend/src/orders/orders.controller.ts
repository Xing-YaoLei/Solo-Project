import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderStatus, ChannelType } from '@prisma/client';

@ApiTags('渠道订单')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: '获取订单列表' })
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: OrderStatus,
    @Query('channel') channel?: ChannelType,
    @Query('keyword') keyword?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.ordersService.findAll(req.user, {
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      propertyId: propertyId ? parseInt(propertyId) : undefined,
      status,
      channel,
      keyword,
      dateFrom,
      dateTo,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取订单统计' })
  getStatistics(
    @Req() req: any,
    @Query('propertyId') propertyId?: string,
    @Query('date') date?: string,
  ) {
    return this.ordersService.getStatistics(req.user, {
      propertyId: propertyId ? parseInt(propertyId) : undefined,
      date,
    });
  }

  @Get('check-conflicts')
  @ApiOperation({ summary: '检查房态冲突' })
  checkConflicts(
    @Query('propertyId') propertyId: string,
    @Query('roomId') roomId: string,
    @Query('checkInDate') checkInDate: string,
    @Query('checkOutDate') checkOutDate: string,
    @Query('excludeOrderId') excludeOrderId?: string,
  ) {
    return this.ordersService.checkConflicts(
      parseInt(propertyId),
      parseInt(roomId),
      checkInDate,
      checkOutDate,
      excludeOrderId ? parseInt(excludeOrderId) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订单详情' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(parseInt(id));
  }

  @Post()
  @ApiOperation({ summary: '创建订单' })
  create(@Body() createOrderDto: any, @Req() req: any) {
    return this.ordersService.create(createOrderDto, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新订单' })
  update(@Param('id') id: string, @Body() updateOrderDto: any) {
    return this.ordersService.update(parseInt(id), updateOrderDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '更新订单状态' })
  updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.ordersService.updateStatus(parseInt(id), status);
  }

  @Delete(':id')
  @ApiOperation({ summary: '取消订单' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(parseInt(id));
  }
}
