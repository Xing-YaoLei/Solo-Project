import { Controller, Get, Post, Put, Delete, Param, Body, Query, Headers } from '@nestjs/common';
import { RefundOrderService } from './refund-order.service';
import { RefundStatus, ResponsibilityParty } from '@prisma/client';
import {
  CreateRefundOrderDto,
  UpdateRefundOrderDto,
  AssignOrderDto,
  UpdateStatusDto,
  AddEvidenceDto,
  AddNoteDto,
  RetryOrderDto,
  SupplementOrderDto,
  CloseOrderDto,
} from '@solo/shared';

@Controller('refund-orders')
export class RefundOrderController {
  constructor(private readonly service: RefundOrderService) {}

  private getOperatorId(headers: any): string | undefined {
    return headers['x-operator-id'];
  }

  @Get('stats')
  async getStats() {
    return this.service.getStats();
  }

  @Get('kanban')
  async getKanban() {
    return this.service.getKanbanData();
  }

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('region') region?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('problemTag') problemTag?: string,
    @Query('responsibility') responsibility?: ResponsibilityParty,
    @Query('isTimeout') isTimeout?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.service.findAll({
      status: status ? (status.split(',') as any) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      region,
      assigneeId,
      problemTag,
      responsibility: responsibility as any,
      isTimeout: isTimeout !== undefined ? isTimeout === 'true' : undefined,
      keyword,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateRefundOrderDto, @Headers() headers: any) {
    return this.service.create(data, this.getOperatorId(headers));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateRefundOrderDto, @Headers() headers: any) {
    return this.service.update(id, data, this.getOperatorId(headers));
  }

  @Post(':id/assign')
  async assign(@Param('id') id: string, @Body() data: AssignOrderDto, @Headers() headers: any) {
    return this.service.assign(id, data, this.getOperatorId(headers));
  }

  @Post(':id/status')
  async updateStatus(@Param('id') id: string, @Body() data: UpdateStatusDto, @Headers() headers: any) {
    return this.service.updateStatus(id, data, this.getOperatorId(headers));
  }

  @Post(':id/evidences')
  async addEvidence(@Param('id') id: string, @Body() data: AddEvidenceDto, @Headers() headers: any) {
    const operatorId = this.getOperatorId(headers);
    if (!operatorId) throw new Error('Missing operator id');
    return this.service.addEvidence(id, data, operatorId);
  }

  @Delete(':id/evidences/:evidenceId')
  async deleteEvidence(@Param('id') id: string, @Param('evidenceId') evidenceId: string, @Headers() headers: any) {
    return this.service.deleteEvidence(id, evidenceId, this.getOperatorId(headers));
  }

  @Post(':id/notes')
  async addNote(@Param('id') id: string, @Body() data: AddNoteDto, @Headers() headers: any) {
    return this.service.addNote(id, data, this.getOperatorId(headers));
  }

  @Post(':id/retry')
  async retry(@Param('id') id: string, @Body() data: RetryOrderDto, @Headers() headers: any) {
    return this.service.retry(id, data, this.getOperatorId(headers));
  }

  @Post(':id/supplement')
  async supplement(@Param('id') id: string, @Body() data: SupplementOrderDto, @Headers() headers: any) {
    return this.service.supplement(id, data, this.getOperatorId(headers));
  }

  @Post(':id/close')
  async close(@Param('id') id: string, @Body() data: CloseOrderDto, @Headers() headers: any) {
    return this.service.close(id, data, this.getOperatorId(headers));
  }

  @Post(':id/reopen')
  async reopen(@Param('id') id: string, @Body() data: { reason: string }, @Headers() headers: any) {
    return this.service.reopen(id, data.reason, this.getOperatorId(headers));
  }
}
