import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { PropertiesService } from './properties.service';

@Controller('api/properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.propertiesService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Get(':id/calendar')
  getCalendar(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.propertiesService.getCalendar(
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post()
  create(@Body() data: {
    name: string;
    address: string;
    roomNumber: string;
    type: string;
    area?: number;
    beds?: number;
    maxGuests?: number;
    status?: string;
  }) {
    return this.propertiesService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: {
    name?: string;
    address?: string;
    roomNumber?: string;
    type?: string;
    area?: number;
    beds?: number;
    maxGuests?: number;
    status?: string;
  }) {
    return this.propertiesService.update(id, data);
  }
}
