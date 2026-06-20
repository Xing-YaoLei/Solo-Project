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
import { RefundRuleService } from './refund-rule.service';
import { CreateRefundRuleDto, UpdateRefundRuleDto, FilterRefundRuleDto } from './refund-rule.dto';

@Controller('refund-rules')
export class RefundRuleController {
  constructor(private readonly service: RefundRuleService) {}

  @Post()
  create(@Body() dto: CreateRefundRuleDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() filter: FilterRefundRuleDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRefundRuleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
