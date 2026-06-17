import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RepairPersonService } from './repair-person.service';

@ApiTags('维修人员')
@Controller('repair-persons')
export class RepairPersonController {
  constructor(private readonly service: RepairPersonService) {}

  @Get()
  @ApiOperation({ summary: '获取维修人员列表' })
  findAll(@Query('status') status?: string, @Query('skill') skill?: string) {
    return this.service.findAll({ status, skill });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取维修人员详情' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: '获取维修人员统计数据' })
  getStats(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getStats(id, startDate, endDate);
  }

  @Post()
  @ApiOperation({ summary: '创建维修人员' })
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新维修人员' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除维修人员' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
