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
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RoleEnum } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('vehicle:manage')
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN, RoleEnum.PARTS_CLERK)
  @Permissions('vehicle:read')
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Query('keyword') keyword?: string,
  ) {
    return this.vehiclesService.findAll(+page, +pageSize, keyword);
  }

  @Get(':id')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN, RoleEnum.PARTS_CLERK)
  @Permissions('vehicle:read')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Get('plate/:plateNumber')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN, RoleEnum.PARTS_CLERK)
  @Permissions('vehicle:read')
  findByPlateNumber(@Param('plateNumber') plateNumber: string) {
    return this.vehiclesService.findByPlateNumber(plateNumber);
  }

  @Patch(':id')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('vehicle:manage')
  update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @Roles(RoleEnum.MANAGER)
  @Permissions('vehicle:manage')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}
