import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { SeatMapService } from './seat-map.service';
import {
  CreateSeatMapDto,
  UpdateSeatMapDto,
  UpdateThresholdDto,
  FilterSeatAvailabilityDto,
  FilterSeatMapDto,
} from './seat-map.dto';

@Controller('seat-maps')
export class SeatMapController {
  constructor(private readonly service: SeatMapService) {}

  @Post()
  create(@Body() dto: CreateSeatMapDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() filter: FilterSeatMapDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSeatMapDto) {
    return this.service.update(id, dto);
  }

  @Put(':id/threshold')
  updateThreshold(@Param('id') id: string, @Body() dto: UpdateThresholdDto) {
    return this.service.updateThreshold(id, dto);
  }

  @Get(':id/availability')
  getSeatAvailability(
    @Param('id') id: string,
    @Query() filter: FilterSeatAvailabilityDto,
  ) {
    return this.service.getSeatAvailability(id, filter);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
