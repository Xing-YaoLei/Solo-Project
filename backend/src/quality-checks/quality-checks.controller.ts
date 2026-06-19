import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QualityChecksService } from './quality-checks.service';
import { CreateQualityCheckDto } from './dto/create-quality-check.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RoleEnum } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('quality-checks')
export class QualityChecksController {
  constructor(private readonly qualityChecksService: QualityChecksService) {}

  @Post()
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('quality:check')
  create(@Body() createQualityCheckDto: CreateQualityCheckDto) {
    return this.qualityChecksService.create(createQualityCheckDto);
  }

  @Get()
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN)
  @Permissions('quality:read')
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Query('workOrderId') workOrderId?: string,
  ) {
    return this.qualityChecksService.findAll(+page, +pageSize, workOrderId);
  }

  @Get(':id')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN)
  @Permissions('quality:read')
  findOne(@Param('id') id: string) {
    return this.qualityChecksService.findOne(id);
  }

  @Delete(':id')
  @Roles(RoleEnum.MANAGER)
  remove(@Param('id') id: string) {
    return this.qualityChecksService.remove(id);
  }
}
