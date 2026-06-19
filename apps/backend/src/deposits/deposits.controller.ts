import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { DepositStatus } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('押金明细')
@ApiBearerAuth()
@Controller('deposits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Get()
  @ApiOperation({ summary: '获取押金列表' })
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('orderId') orderId?: string,
    @Query('status') status?: DepositStatus,
    @Query('keyword') keyword?: string,
    @Query('propertyId') propertyId?: string,
  ) {
    return this.depositsService.findAll(req.user, {
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      orderId: orderId ? parseInt(orderId) : undefined,
      status,
      keyword,
      propertyId: propertyId ? parseInt(propertyId) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取押金详情' })
  findOne(@Param('id') id: string) {
    return this.depositsService.findOne(parseInt(id));
  }

  @Post()
  @ApiOperation({ summary: '创建押金记录' })
  create(@Body() createDepositDto: any) {
    return this.depositsService.create(createDepositDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新押金记录' })
  update(@Param('id') id: string, @Body() updateDepositDto: any) {
    return this.depositsService.update(parseInt(id), updateDepositDto);
  }

  @Patch(':id/paid')
  @ApiOperation({ summary: '标记押金已支付' })
  markPaid(
    @Param('id') id: string,
    @Body('paidAmount') paidAmount: number,
    @Body('paymentMethod') paymentMethod?: string,
  ) {
    return this.depositsService.markPaid(parseInt(id), paidAmount, paymentMethod);
  }

  @Patch(':id/refund')
  @ApiOperation({ summary: '退还押金' })
  refund(
    @Param('id') id: string,
    @Body('refundAmount') refundAmount: number,
    @Body('remarks') remarks?: string,
  ) {
    return this.depositsService.refund(parseInt(id), refundAmount, remarks);
  }

  @Patch(':id/deduct')
  @ApiOperation({ summary: '扣除押金' })
  deduct(
    @Param('id') id: string,
    @Body('deductionReason') deductionReason: string,
    @Body('deductionAmount') deductionAmount?: number,
  ) {
    return this.depositsService.deduct(parseInt(id), deductionReason, deductionAmount);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除押金记录' })
  remove(@Param('id') id: string) {
    return this.depositsService.remove(parseInt(id));
  }
}
