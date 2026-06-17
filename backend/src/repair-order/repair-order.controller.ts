import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RepairOrderService } from './repair-order.service';
import {
  CreateRepairOrderDto,
  AssignOrderDto,
  UpdateStatusDto,
  AddDelayRecordDto,
  AddMaterialDto,
  CreateSignoffDto,
  UpdateReviewTagsDto,
  QueryOrdersDto,
  CloseOrderDto,
} from './dto/repair-order.dto';

@ApiTags('维修派单')
@Controller('repair-orders')
export class RepairOrderController {
  constructor(private readonly service: RepairOrderService) {}

  @Post()
  @ApiOperation({ summary: '创建维修派单' })
  create(@Body() dto: CreateRepairOrderDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询派单列表' })
  findAll(@Query() query: QueryOrdersDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取派单详情' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id/assign')
  @ApiOperation({ summary: '分派维修人员' })
  assign(@Param('id') id: string, @Body() dto: AssignOrderDto) {
    return this.service.assign(id, dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新状态' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Post(':id/delay-records')
  @ApiOperation({ summary: '添加延误记录' })
  addDelayRecord(@Param('id') id: string, @Body() dto: AddDelayRecordDto) {
    return this.service.addDelayRecord(id, dto);
  }

  @Post(':id/materials')
  @ApiOperation({ summary: '添加使用材料' })
  addMaterial(@Param('id') id: string, @Body() dto: AddMaterialDto) {
    return this.service.addMaterial(id, dto);
  }

  @Delete(':id/materials/:materialId')
  @ApiOperation({ summary: '移除使用材料' })
  removeMaterial(@Param('id') orderId: string, @Param('materialId') materialId: string) {
    return this.service.removeMaterial(orderId, materialId);
  }

  @Post(':id/signoff')
  @ApiOperation({ summary: '创建签收凭证' })
  createSignoff(@Param('id') id: string, @Body() dto: CreateSignoffDto) {
    return this.service.createSignoff(id, dto);
  }

  @Put(':id/review-tags')
  @ApiOperation({ summary: '更新复盘标签' })
  updateReviewTags(@Param('id') id: string, @Body() dto: UpdateReviewTagsDto) {
    return this.service.updateReviewTags(id, dto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: '关闭派单' })
  closeOrder(@Param('id') id: string, @Body() dto: CloseOrderDto) {
    return this.service.closeOrder(id, dto);
  }

  @Get(':id/history')
  @ApiOperation({ summary: '获取历史记录' })
  getHistory(@Param('id') id: string) {
    return this.service.getHistory(id);
  }
}
