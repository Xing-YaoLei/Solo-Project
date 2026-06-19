import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { BatchUpdateStatusDto } from './dto/batch-update-status.dto';
import { BatchAssignDto } from './dto/batch-assign.dto';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RoleEnum } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('workorder:create')
  create(@Body() createWorkOrderDto: CreateWorkOrderDto) {
    return this.workOrdersService.create(createWorkOrderDto);
  }

  @Get()
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN, RoleEnum.PARTS_CLERK)
  @Permissions('workorder:read')
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Query('status') status?: string,
    @Query('vehicleId') vehicleId?: string,
  ) {
    return this.workOrdersService.findAll(+page, +pageSize, status, vehicleId);
  }

  @Post('batch-status')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN)
  @Permissions('workorder:update')
  batchUpdateStatus(@Body() batchUpdateStatusDto: BatchUpdateStatusDto) {
    return this.workOrdersService.batchUpdateStatus(batchUpdateStatusDto);
  }

  @Post('batch-assign')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('workorder:update')
  batchAssign(@Body() batchAssignDto: BatchAssignDto) {
    return this.workOrdersService.batchAssign(batchAssignDto);
  }

  @Get('technicians/list')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('workorder:read')
  getTechnicians() {
    return this.workOrdersService.getTechnicians();
  }

  @Get('cache/stats')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('workorder:read')
  getCacheStats() {
    return this.workOrdersService.getCacheStats();
  }

  @Get(':id')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN, RoleEnum.PARTS_CLERK)
  @Permissions('workorder:read')
  findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('workorder:update')
  update(@Param('id') id: string, @Body() updateWorkOrderDto: UpdateWorkOrderDto) {
    return this.workOrdersService.update(id, updateWorkOrderDto);
  }

  @Patch(':id/status')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN)
  @Permissions('workorder:status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.workOrdersService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(RoleEnum.MANAGER)
  remove(@Param('id') id: string) {
    return this.workOrdersService.remove(id);
  }

  @Get(':id/logs')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN)
  @Permissions('workorder:read')
  getLogs(@Param('id') id: string) {
    return this.workOrdersService.getLogs(id);
  }

  @Patch(':id/assign')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('workorder:update')
  assignTechnician(
    @Param('id') id: string,
    @Body() assignTechnicianDto: AssignTechnicianDto,
  ) {
    return this.workOrdersService.assignTechnician(id, assignTechnicianDto);
  }
}
