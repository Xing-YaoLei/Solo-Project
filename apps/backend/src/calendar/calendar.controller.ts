import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('房源日历')
@ApiBearerAuth()
@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('property/:propertyId')
  @ApiOperation({ summary: '获取房源日历视图' })
  getCalendar(
    @Param('propertyId') propertyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('roomId') roomId?: string,
  ) {
    return this.calendarService.getCalendar(parseInt(propertyId), {
      startDate,
      endDate,
      year: year ? parseInt(year) : undefined,
      month: month ? parseInt(month) : undefined,
      roomId: roomId ? parseInt(roomId) : undefined,
    });
  }

  @Get('property/:propertyId/availability')
  @ApiOperation({ summary: '获取房源入住率' })
  getRoomAvailability(
    @Param('propertyId') propertyId: string,
    @Query('date') date: string,
  ) {
    return this.calendarService.getRoomAvailability(parseInt(propertyId), date);
  }

  @Patch('property/:propertyId/room/:roomId/date/:date')
  @ApiOperation({ summary: '更新单天日历' })
  updateCalendar(
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Param('date') date: string,
    @Body() data: any,
  ) {
    return this.calendarService.updateCalendar(
      parseInt(propertyId),
      parseInt(roomId),
      date,
      data,
    );
  }

  @Post('property/:propertyId/bulk-update')
  @ApiOperation({ summary: '批量更新日历' })
  bulkUpdateCalendar(
    @Param('propertyId') propertyId: string,
    @Body() data: any,
  ) {
    return this.calendarService.bulkUpdateCalendar(parseInt(propertyId), data);
  }
}
