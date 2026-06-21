import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TimelineService } from './timeline.service';

@Controller('cases/:caseId/timeline')
@UseGuards(AuthGuard('jwt'))
export class TimelineController {
  constructor(private timelineService: TimelineService) {}

  @Get()
  findAll(
    @Param('caseId') caseId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.timelineService.findByCaseId(caseId, page, limit);
  }

  @Get(':eventId')
  findOne(
    @Param('caseId') caseId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.timelineService.findOne(caseId, eventId);
  }
}
