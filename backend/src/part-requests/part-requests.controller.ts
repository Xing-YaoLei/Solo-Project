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
import { PartRequestsService } from './part-requests.service';
import { CreatePartRequestDto } from './dto/create-part-request.dto';
import { UpdatePartRequestDto } from './dto/update-part-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RoleEnum } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('part-requests')
export class PartRequestsController {
  constructor(private readonly partRequestsService: PartRequestsService) {}

  @Post()
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN, RoleEnum.PARTS_CLERK)
  @Permissions('partrequest:create')
  create(@Body() createPartRequestDto: CreatePartRequestDto) {
    return this.partRequestsService.create(createPartRequestDto);
  }

  @Get()
  @Roles(RoleEnum.MANAGER, RoleEnum.PARTS_CLERK, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN)
  @Permissions('partrequest:read')
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Query('status') status?: string,
    @Query('workOrderId') workOrderId?: string,
  ) {
    return this.partRequestsService.findAll(+page, +pageSize, status, workOrderId);
  }

  @Get(':id')
  @Roles(RoleEnum.MANAGER, RoleEnum.PARTS_CLERK, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN)
  @Permissions('partrequest:read')
  findOne(@Param('id') id: string) {
    return this.partRequestsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleEnum.MANAGER, RoleEnum.PARTS_CLERK)
  @Permissions('partrequest:approve')
  update(@Param('id') id: string, @Body() updatePartRequestDto: UpdatePartRequestDto) {
    return this.partRequestsService.update(id, updatePartRequestDto);
  }

  @Patch(':id/status')
  @Roles(RoleEnum.MANAGER, RoleEnum.PARTS_CLERK)
  @Permissions('partrequest:approve')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('handlerId') handlerId: string,
    @Body('handlingNotes') handlingNotes?: string,
    @Body('source') source?: string,
    @Body('beforeMaterial') beforeMaterial?: string,
    @Body('afterMaterial') afterMaterial?: string,
    @Body('conclusion') conclusion?: string,
  ) {
    return this.partRequestsService.updateStatus(
      id,
      status,
      handlerId,
      handlingNotes,
      source as any,
      beforeMaterial,
      afterMaterial,
      conclusion,
    );
  }

  @Delete(':id')
  @Roles(RoleEnum.MANAGER)
  remove(@Param('id') id: string) {
    return this.partRequestsService.remove(id);
  }

  @Get(':id/histories')
  @Roles(RoleEnum.MANAGER, RoleEnum.PARTS_CLERK, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN)
  @Permissions('partrequest:read')
  getHistories(@Param('id') id: string) {
    return this.partRequestsService.getHistories(id);
  }

  @Get('kanban/stats')
  @Roles(RoleEnum.MANAGER, RoleEnum.PARTS_CLERK, RoleEnum.ADVISOR)
  @Permissions('partrequest:read')
  getKanbanStats() {
    return this.partRequestsService.getKanbanStats();
  }

  @Get('kanban/timeout')
  @Roles(RoleEnum.MANAGER, RoleEnum.PARTS_CLERK)
  @Permissions('partrequest:read')
  getTimeoutRequests(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ) {
    return this.partRequestsService.getTimeoutRequests(+page, +pageSize);
  }

  @Get('low-stock/warning')
  @Roles(RoleEnum.MANAGER, RoleEnum.PARTS_CLERK)
  @Permissions('partrequest:read')
  getLowStockParts() {
    return this.partRequestsService.getLowStockParts();
  }
}
