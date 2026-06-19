import { Controller, Get, Put, Param, Body, Query } from '@nestjs/common';
import { MissedOrdersService } from './missed-orders.service';

@Controller('api/missed-orders')
export class MissedOrdersController {
  constructor(private readonly missedOrdersService: MissedOrdersService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.missedOrdersService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.missedOrdersService.findOne(id);
  }

  @Put(':id/resolve')
  resolve(
    @Param('id') id: string,
    @Body() data: { resolvedById: string; reason: string },
  ) {
    return this.missedOrdersService.resolve(id, data.resolvedById, data.reason);
  }
}
