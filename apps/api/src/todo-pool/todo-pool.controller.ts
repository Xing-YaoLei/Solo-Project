import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TodoPoolService } from './todo-pool.service';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@ApiTags('待办池')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('todo-pool')
export class TodoPoolController {
  constructor(
    private readonly todoPoolService: TodoPoolService,
    @InjectQueue('overdue') private overdueQueue: Queue,
  ) {}

  @Get('overdue')
  @ApiOperation({ summary: '获取超时工单列表' })
  getOverdue(@CurrentUser() user: any) {
    return this.todoPoolService.getOverdue(user);
  }

  @Get('supplement')
  @ApiOperation({ summary: '获取待补充材料工单列表' })
  getSupplement(@CurrentUser() user: any) {
    return this.todoPoolService.getSupplement(user);
  }

  @Get('rejected')
  @ApiOperation({ summary: '获取已驳回工单列表' })
  getRejected(@CurrentUser() user: any) {
    return this.todoPoolService.getRejected(user);
  }

  @Post('overdue/trigger')
  @ApiOperation({ summary: '手动触发超时检测' })
  async triggerOverdueCheck() {
    const job = await this.overdueQueue.add('check-overdue', {});
    return { jobId: job.id, status: 'queued' };
  }
}
