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
import { ContractsService } from './contracts.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ContractStatus } from '@rental/db'

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  async findAll(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('status') status?: ContractStatus,
    @Query('propertyId') propertyId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.contractsService.findAll({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      status,
      propertyId,
      tenantId,
      keyword,
    })
  }

  @Get('stats')
  async getStats() {
    return this.contractsService.getStats()
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id)
  }

  @Post()
  async create(@Body() data: any, @Req() req: any) {
    return this.contractsService.create(data, req.user.userId)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.contractsService.update(id, data)
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: ContractStatus) {
    return this.contractsService.updateStatus(id, status)
  }

  @Post(':id/version')
  async createVersion(
    @Param('id') id: string,
    @Body() versionData: any,
    @Req() req: any,
  ) {
    return this.contractsService.createVersion(id, versionData, req.user.userId)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.contractsService.delete(id)
  }
}
