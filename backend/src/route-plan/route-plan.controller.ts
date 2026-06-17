import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RoutePlanService } from './route-plan.service';

@ApiTags('路线计划')
@Controller('route-plans')
export class RoutePlanController {
  constructor(private readonly service: RoutePlanService) {}

  @Get('order/:orderId')
  @ApiOperation({ summary: '获取派单的路线计划' })
  findByOrderId(@Param('orderId') orderId: string) {
    return this.service.findByOrderId(orderId);
  }

  @Post('order/:orderId')
  @ApiOperation({ summary: '创建路线计划' })
  create(@Param('orderId') orderId: string, @Body() data: any) {
    return this.service.create(orderId, data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新路线计划' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除路线计划' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Put(':id/start')
  @ApiOperation({ summary: '开始路线' })
  startRoute(@Param('id') id: string) {
    return this.service.startRoute(id);
  }

  @Put(':id/arrive')
  @ApiOperation({ summary: '抵达目的地' })
  arriveRoute(@Param('id') id: string) {
    return this.service.arriveRoute(id);
  }

  @Post('order/:orderId/reorder')
  @ApiOperation({ summary: '重新排序路线计划' })
  reorder(@Param('orderId') orderId: string, @Body() body: { orderIds: string[] }) {
    return this.service.reorder(orderId, body.orderIds);
  }
}
