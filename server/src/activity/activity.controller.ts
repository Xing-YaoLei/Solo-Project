import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { CreateActivityDto, CheckInDto, BulkCheckInDto, BulkCheckInIdsDto } from './dto/activity.dto';

@ApiTags('activities')
@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @ApiOperation({ summary: 'List activities with check-in status' })
  @ApiQuery({ name: 'date', required: false })
  findAll(@Query('date') date?: string) {
    return this.activityService.findAll(date);
  }

  @Post()
  @ApiOperation({ summary: 'Create activity' })
  create(@Body() dto: CreateActivityDto) {
    return this.activityService.create(dto);
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Check in activity by ID' })
  checkInById(@Param('id') id: string) {
    return this.activityService.checkIn({ id, checkedIn: true });
  }

  @Post('check-in')
  @ApiOperation({ summary: 'Check in single activity' })
  checkIn(@Body() dto: CheckInDto) {
    return this.activityService.checkIn(dto);
  }

  @Post('bulk-check-in')
  @ApiOperation({ summary: 'Bulk check in activities' })
  bulkCheckIn(@Body() dto: BulkCheckInDto | BulkCheckInIdsDto) {
    if ('ids' in dto) {
      return this.activityService.bulkCheckInByIds(dto.ids);
    }
    return this.activityService.bulkCheckIn(dto as BulkCheckInDto);
  }
}
