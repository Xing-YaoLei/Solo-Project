import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { PerformanceService } from './performance.service';

@Controller('performances')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
    @Query('operatorId') operatorId?: string,
  ) {
    return this.performanceService.findAll({
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
      page,
      pageSize,
    });
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.performanceService.findById(id);
  }

  @Post()
  create(@Body() data: any) {
    const { operatorId, ...rest } = data;
    return this.performanceService.create(rest, operatorId ? parseInt(operatorId) : undefined);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    const { operatorId, ...rest } = data;
    return this.performanceService.update(id, rest, operatorId ? parseInt(operatorId) : undefined);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Query('operatorId') operatorId?: string) {
    return this.performanceService.remove(id, operatorId ? parseInt(operatorId) : undefined);
  }
}
