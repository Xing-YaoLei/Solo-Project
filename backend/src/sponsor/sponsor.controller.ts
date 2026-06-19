import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { SponsorService } from './sponsor.service';

@Controller('sponsors')
export class SponsorController {
  constructor(private readonly sponsorService: SponsorService) {}

  @Get()
  findAll(
    @Query('scheduleId') scheduleId?: string,
    @Query('level') level?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
  ) {
    return this.sponsorService.findAll({
      scheduleId: scheduleId ? parseInt(scheduleId) : undefined,
      level,
      status,
      search,
      page,
      pageSize,
    });
  }

  @Get('stats')
  getStats(@Query('scheduleId') scheduleId?: string) {
    return this.sponsorService.getSponsorStats(scheduleId ? parseInt(scheduleId) : undefined);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.sponsorService.findById(id);
  }

  @Post()
  create(@Body() data: any) {
    const { operatorId, ...rest } = data;
    return this.sponsorService.create(rest, operatorId ? parseInt(operatorId) : undefined);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    const { operatorId, ...rest } = data;
    return this.sponsorService.update(id, rest, operatorId ? parseInt(operatorId) : undefined);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Query('operatorId') operatorId?: string) {
    return this.sponsorService.remove(id, operatorId ? parseInt(operatorId) : undefined);
  }
}
