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
import { MaintenanceService } from './maintenance.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { MaintenanceStatus, Priority } from '@rental/db'

@Controller('maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('records')
  async findRecords(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: MaintenanceStatus,
    @Query('type') type?: string,
  ) {
    return this.maintenanceService.findAllRecords({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      propertyId,
      status,
      type,
    })
  }

  @Get('records/stats')
  async getStats() {
    return this.maintenanceService.getStats()
  }

  @Get('records/types')
  async getTypes() {
    return this.maintenanceService.getTypes()
  }

  @Get('records/:id')
  async findRecord(@Param('id') id: string) {
    return this.maintenanceService.findRecord(id)
  }

  @Post('records')
  async createRecord(@Body() data: any) {
    return this.maintenanceService.createRecord(data)
  }

  @Put('records/:id')
  async updateRecord(@Param('id') id: string, @Body() data: any) {
    return this.maintenanceService.updateRecord(id, data)
  }

  @Delete('records/:id')
  async deleteRecord(@Param('id') id: string) {
    return this.maintenanceService.deleteRecord(id)
  }

  @Get('workorders')
  async findWorkOrders(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('recordId') recordId?: string,
    @Query('workerId') workerId?: string,
    @Query('status') status?: MaintenanceStatus,
    @Query('priority') priority?: Priority,
  ) {
    return this.maintenanceService.findWorkOrders({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      recordId,
      workerId,
      status,
      priority,
    })
  }

  @Get('workorders/:id')
  async findWorkOrder(@Param('id') id: string) {
    return this.maintenanceService.findWorkOrder(id)
  }

  @Post('records/:recordId/workorders')
  async createWorkOrder(
    @Param('recordId') recordId: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.maintenanceService.createWorkOrder(recordId, data, req.user.userId)
  }

  @Put('workorders/:id')
  async updateWorkOrder(@Param('id') id: string, @Body() data: any) {
    return this.maintenanceService.updateWorkOrder(id, data)
  }

  @Put('workorders/:id/assign')
  async assignWorker(@Param('id') id: string, @Body('workerId') workerId: string) {
    return this.maintenanceService.assignWorker(id, workerId)
  }

  @Put('workorders/:id/complete')
  async completeWorkOrder(
    @Param('id') id: string,
    @Body('solution') solution: string,
    @Body('cost') cost?: number,
  ) {
    return this.maintenanceService.completeWorkOrder(id, solution, cost)
  }

  @Delete('workorders/:id')
  async deleteWorkOrder(@Param('id') id: string) {
    return this.maintenanceService.deleteWorkOrder(id)
  }
}
