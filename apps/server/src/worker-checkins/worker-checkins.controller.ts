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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WorkerCheckinsService } from './worker-checkins.service';
import { CreateWorkerCheckinDto } from './dto/create-worker-checkin.dto';
import { UpdateWorkerCheckinDto } from './dto/update-worker-checkin.dto';
import { QueryWorkerCheckinDto } from './dto/query-worker-checkin.dto';
import { CurrentUser, CurrentUserType } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('工人签到')
@ApiBearerAuth()
@Controller('worker-checkins')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class WorkerCheckinsController {
  constructor(private readonly workerCheckinsService: WorkerCheckinsService) {}

  @Post()
  @ApiOperation({ summary: '工人签到' })
  @Roles(UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  create(
    @Body() createWorkerCheckinDto: CreateWorkerCheckinDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.workerCheckinsService.create(createWorkerCheckinDto, user);
  }

  @Post(':id/checkout')
  @ApiOperation({ summary: '工人签退' })
  @Roles(UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  checkout(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.workerCheckinsService.checkout(id, user);
  }

  @Get()
  @ApiOperation({ summary: '分页查询签到记录' })
  @Roles(UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  findAll(@Query() query: QueryWorkerCheckinDto) {
    return this.workerCheckinsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取签到记录详情' })
  @Roles(UserRole.FOREMAN, UserRole.SUPERVISOR, UserRole.OWNER)
  findOne(@Param('id') id: string) {
    return this.workerCheckinsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新签到记录' })
  @Roles(UserRole.FOREMAN, UserRole.SUPERVISOR)
  update(
    @Param('id') id: string,
    @Body() updateWorkerCheckinDto: UpdateWorkerCheckinDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.workerCheckinsService.update(id, updateWorkerCheckinDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除签到记录' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPERVISOR, UserRole.OWNER)
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.workerCheckinsService.remove(id, user);
  }
}
