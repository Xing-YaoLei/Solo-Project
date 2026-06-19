import { Controller, Get, Query, Param } from '@nestjs/common';
import { RecordsService } from './records.service';

@Controller('api/records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get('view')
  getRecordView(
    @Query('propertyId') propertyId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const today = new Date();
    const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return this.recordsService.getRecordView({
      propertyId,
      startDate: startDate ? new Date(startDate) : defaultStart,
      endDate: endDate ? new Date(endDate) : defaultEnd,
    });
  }

  @Get('property/:propertyId/timeline')
  getPropertyTimeline(
    @Param('propertyId') propertyId: string,
    @Query('date') date: string,
  ) {
    return this.recordsService.getPropertyTimeline(
      propertyId,
      date ? new Date(date) : new Date(),
    );
  }
}
