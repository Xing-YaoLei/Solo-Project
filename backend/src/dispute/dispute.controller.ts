import { Controller, Get, Post, Put, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { DisputeStatus, LogAction } from '@prisma/client';

@Controller('disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Get()
  findAll(
    @Query('orderId') orderId?: string,
    @Query('status') status?: DisputeStatus,
    @Query('handlerId') handlerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
  ) {
    return this.disputeService.findAll({
      orderId: orderId ? parseInt(orderId) : undefined,
      status,
      handlerId: handlerId ? parseInt(handlerId) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      pageSize,
    });
  }

  @Get('stats')
  getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.disputeService.getDisputeStats({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.disputeService.findById(id);
  }

  @Get(':id/logs')
  getLogs(@Param('id', ParseIntPipe) id: number) {
    return this.disputeService.getLogs(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.disputeService.create(data);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { status: DisputeStatus; operatorId?: number; remark?: string },
  ) {
    return this.disputeService.updateStatus(id, data.status, data.operatorId, data.remark);
  }

  @Put(':id/assign')
  assignHandler(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { handlerId: number; operatorId?: number },
  ) {
    return this.disputeService.assignHandler(id, data.handlerId, data.operatorId);
  }

  @Put(':id/resolve')
  resolveDispute(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { resolution: string; operatorId: number; approveRefund?: boolean },
  ) {
    return this.disputeService.resolveDispute(id, data);
  }

  @Put(':id/close')
  closeDispute(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { resolution: string; operatorId: number },
  ) {
    return this.disputeService.closeDispute(id, data);
  }

  @Post(':id/logs')
  addLog(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { action: LogAction | string; description: string; operatorId?: number },
  ) {
    return this.disputeService.addLog(id, data);
  }
}
