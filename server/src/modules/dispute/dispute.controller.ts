import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { DisputeService } from './dispute.service';
import {
  CreateDisputeDto,
  UpdateDisputeStatusDto,
  AssignDisputeDto,
  FilterDisputeDto,
  FilterNotificationDto,
} from './dispute.dto';

@Controller('disputes')
export class DisputeController {
  constructor(private readonly service: DisputeService) {}

  @Post()
  create(@Body() dto: CreateDisputeDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() filter: FilterDisputeDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDisputeStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Put(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignDisputeDto) {
    return this.service.assign(id, dto);
  }

  @Get(':id/notifications')
  getNotifications(@Param('id') id: string) {
    return this.service.getNotifications(id);
  }
}

@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: DisputeService) {}

  @Get()
  findAll(@Query() filter: FilterNotificationDto) {
    return this.service.getUserNotifications(filter);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.service.markAsRead(id);
  }
}
