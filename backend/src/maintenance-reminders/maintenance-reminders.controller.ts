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
import { MaintenanceRemindersService } from './maintenance-reminders.service';
import { CreateMaintenanceReminderDto } from './dto/create-maintenance-reminder.dto';
import { UpdateMaintenanceReminderDto } from './dto/update-maintenance-reminder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RoleEnum } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('maintenance-reminders')
export class MaintenanceRemindersController {
  constructor(private readonly maintenanceRemindersService: MaintenanceRemindersService) {}

  @Post()
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('reminder:manage')
  create(@Body() createMaintenanceReminderDto: CreateMaintenanceReminderDto) {
    return this.maintenanceRemindersService.create(createMaintenanceReminderDto);
  }

  @Get()
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN)
  @Permissions('reminder:read')
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Query('vehicleId') vehicleId?: string,
    @Query('isCompleted') isCompleted?: boolean,
  ) {
    return this.maintenanceRemindersService.findAll(+page, +pageSize, vehicleId, isCompleted);
  }

  @Get(':id')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN)
  @Permissions('reminder:read')
  findOne(@Param('id') id: string) {
    return this.maintenanceRemindersService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('reminder:manage')
  update(
    @Param('id') id: string,
    @Body() updateMaintenanceReminderDto: UpdateMaintenanceReminderDto,
  ) {
    return this.maintenanceRemindersService.update(id, updateMaintenanceReminderDto);
  }

  @Patch(':id/complete')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('reminder:manage')
  complete(@Param('id') id: string) {
    return this.maintenanceRemindersService.complete(id);
  }

  @Delete(':id')
  @Roles(RoleEnum.MANAGER)
  @Permissions('reminder:manage')
  remove(@Param('id') id: string) {
    return this.maintenanceRemindersService.remove(id);
  }
}
