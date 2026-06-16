import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ReplenishmentOrdersService } from './replenishment-orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('replenishment-orders')
export class ReplenishmentOrdersController {
  constructor(private replenishmentOrdersService: ReplenishmentOrdersService) {}

  @Get()
  async findAll() {
    return this.replenishmentOrdersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.replenishmentOrdersService.findOne(id);
  }

  @Post(':id/create-follow-up')
  async createFollowUp(@Param('id') id: string) {
    return this.replenishmentOrdersService.createFollowUpTask(id);
  }
}
