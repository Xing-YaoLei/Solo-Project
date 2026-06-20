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
import { TicketTypeService } from './ticket-type.service';
import { CreateTicketTypeDto, UpdateTicketTypeDto, FilterTicketTypeDto } from './ticket-type.dto';

@Controller('ticket-types')
export class TicketTypeController {
  constructor(private readonly service: TicketTypeService) {}

  @Post()
  create(@Body() dto: CreateTicketTypeDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() filter: FilterTicketTypeDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTicketTypeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
