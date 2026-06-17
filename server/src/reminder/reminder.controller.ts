import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReminderService } from './reminder.service';
import { CreateReminderDto, UpdateReminderStatusDto, BulkCheckDto } from './dto/reminder.dto';

@ApiTags('reminders')
@Controller('reminders')
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Get()
  @ApiOperation({ summary: 'List reminders by shift and date' })
  @ApiQuery({ name: 'shift', required: false })
  @ApiQuery({ name: 'date', required: false })
  findAll(@Query('shift') shift?: string, @Query('date') date?: string) {
    return this.reminderService.findAll(shift, date);
  }

  @Post()
  @ApiOperation({ summary: 'Create reminder' })
  create(@Body() dto: CreateReminderDto) {
    return this.reminderService.create(dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update reminder status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateReminderStatusDto) {
    return this.reminderService.updateStatus(id, dto);
  }

  @Post('bulk-check')
  @ApiOperation({ summary: 'Bulk check care level vs medication mismatches' })
  bulkCheck(@Body() dto: BulkCheckDto) {
    return this.reminderService.bulkCheck(dto);
  }
}
