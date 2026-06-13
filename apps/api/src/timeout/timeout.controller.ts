import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { TimeoutService } from './timeout.service';

@Controller('timeout')
export class TimeoutController {
  constructor(private readonly timeoutService: TimeoutService) {}

  @Get('stats')
  async getStats() {
    return this.timeoutService.getQueueStats();
  }

  @Post('sync')
  async syncDeadlines() {
    await this.timeoutService.syncDeadlinesToRedis();
    return { success: true };
  }

  @Post('check')
  async checkTimeouts() {
    await this.timeoutService.checkTimeouts();
    return { success: true };
  }

  @Post(':id/update-deadline')
  async updateDeadline(@Param('id') id: string, @Body() data: { newDeadline: Date }) {
    await this.timeoutService.updateDeadline(id, new Date(data.newDeadline));
    return { success: true };
  }
}
