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
import { EventService } from './event.service';
import { CreateEventDto, UpdateEventDto, FilterEventDto } from './event.dto';

@Controller('events')
export class EventController {
  constructor(private readonly service: EventService) {}

  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() filter: FilterEventDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
