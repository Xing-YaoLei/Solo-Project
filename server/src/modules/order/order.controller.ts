import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto, AssignOrderDto, FilterOrderDto } from './order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() filter: FilterOrderDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Put(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignOrderDto) {
    return this.service.assign(id, dto);
  }
}
