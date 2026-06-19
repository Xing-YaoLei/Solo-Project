import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { VerificationService } from './verification.service';

@Controller('verifications')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get()
  findAll(
    @Query('orderId') orderId?: string,
    @Query('verifierId') verifierId?: string,
    @Query('scheduleId') scheduleId?: string,
    @Query('verifyMethod') verifyMethod?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
  ) {
    return this.verificationService.findAll({
      orderId: orderId ? parseInt(orderId) : undefined,
      verifierId: verifierId ? parseInt(verifierId) : undefined,
      scheduleId: scheduleId ? parseInt(scheduleId) : undefined,
      verifyMethod,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      pageSize,
    });
  }

  @Get('stats')
  getStats(
    @Query('scheduleId') scheduleId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.verificationService.getVerificationStats({
      scheduleId: scheduleId ? parseInt(scheduleId) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.verificationService.findById(id);
  }

  @Post()
  verify(@Body() data: any) {
    return this.verificationService.verify(data);
  }
}
