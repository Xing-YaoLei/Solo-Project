import { Controller, Get, Param, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { OccupancyTrendQueryDto, OccupancySummaryQueryDto } from './statistics.dto';

@Controller('statistics/events')
export class StatisticsController {
  constructor(private readonly service: StatisticsService) {}

  @Get('occupancy-summary')
  getOccupancySummary(@Query() query: OccupancySummaryQueryDto) {
    return this.service.getOccupancySummary(query);
  }

  @Get(':eventId/occupancy')
  getOccupancy(@Param('eventId') eventId: string) {
    return this.service.getOccupancy(eventId);
  }

  @Get(':eventId/occupancy/trend')
  getOccupancyTrend(
    @Param('eventId') eventId: string,
    @Query() query: OccupancyTrendQueryDto,
  ) {
    return this.service.getOccupancyTrend(eventId, query);
  }

  @Get(':eventId/revenue')
  getRevenue(@Param('eventId') eventId: string) {
    return this.service.getRevenue(eventId);
  }
}
