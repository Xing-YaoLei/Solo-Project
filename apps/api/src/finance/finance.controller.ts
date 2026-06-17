import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common'
import { FinanceService } from './finance.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get()
  async findAll(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('type') type?: string,
    @Query('direction') direction?: string,
    @Query('status') status?: string,
    @Query('propertyId') propertyId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('contractId') contractId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.findAll({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      type,
      direction,
      status,
      propertyId,
      tenantId,
      contractId,
      startDate,
      endDate,
    })
  }

  @Get('stats')
  async getStats() {
    return this.financeService.getStats()
  }

  @Get('types')
  async getTypes() {
    return this.financeService.getTypes()
  }

  @Get('statuses')
  async getStatuses() {
    return this.financeService.getStatuses()
  }

  @Get('tenant/:tenantId')
  async getTenantFinance(@Param('tenantId') tenantId: string) {
    return this.financeService.getTenantFinance(tenantId)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.financeService.findOne(id)
  }

  @Post()
  async create(@Body() data: any, @Req() req: any) {
    return this.financeService.create(data, req.user.userId)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.financeService.update(id, data)
  }

  @Put(':id/paid')
  async markPaid(@Param('id') id: string) {
    return this.financeService.markPaid(id)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.financeService.delete(id)
  }
}
