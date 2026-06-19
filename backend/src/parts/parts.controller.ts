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
import { PartsService } from './parts.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RoleEnum } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('parts')
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @Post()
  @Roles(RoleEnum.MANAGER, RoleEnum.PARTS_CLERK)
  @Permissions('part:manage')
  create(@Body() createPartDto: CreatePartDto) {
    return this.partsService.create(createPartDto);
  }

  @Get()
  @Roles(RoleEnum.MANAGER, RoleEnum.PARTS_CLERK, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN)
  @Permissions('part:read')
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('lowStock') lowStock?: boolean,
  ) {
    return this.partsService.findAll(+page, +pageSize, keyword, category, lowStock);
  }

  @Get(':id')
  @Roles(RoleEnum.MANAGER, RoleEnum.PARTS_CLERK, RoleEnum.ADVISOR, RoleEnum.TECHNICIAN)
  @Permissions('part:read')
  findOne(@Param('id') id: string) {
    return this.partsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleEnum.MANAGER, RoleEnum.PARTS_CLERK)
  @Permissions('part:manage')
  update(@Param('id') id: string, @Body() updatePartDto: UpdatePartDto) {
    return this.partsService.update(id, updatePartDto);
  }

  @Delete(':id')
  @Roles(RoleEnum.MANAGER)
  @Permissions('part:manage')
  remove(@Param('id') id: string) {
    return this.partsService.remove(id);
  }
}
