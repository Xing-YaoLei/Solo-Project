import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import { DepositStatus } from '@prisma/client';

@Controller('api/deposits')
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Get()
  findAll(
    @Query('status') status?: DepositStatus,
    @Query('bookingId') bookingId?: string,
  ) {
    return this.depositsService.findAll({ status, bookingId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.depositsService.findOne(id);
  }

  @Get(':id/audit-logs')
  getAuditLogs(@Param('id') id: string) {
    return this.depositsService.getAuditLogs(id);
  }

  @Post()
  create(@Body() data: {
    bookingId: string;
    amount: number;
    status?: DepositStatus;
    notes?: string;
    changedById?: string;
  }) {
    return this.depositsService.create(data);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: {
      amount?: number;
      status?: DepositStatus;
      refundAmount?: number;
      deductAmount?: number;
      deductReason?: string;
      refundedAt?: Date;
      notes?: string;
      changedById?: string;
      changeReason?: string;
    },
  ) {
    const { changedById, changeReason, ...updateData } = data;
    return this.depositsService.update(id, updateData, changedById, changeReason);
  }
}
