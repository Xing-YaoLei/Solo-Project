import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VisitService } from './visit.service';
import { CreateVisitDto } from './dto/visit.dto';

@ApiTags('visits')
@Controller('visits')
export class VisitController {
  constructor(private readonly visitService: VisitService) {}

  @Get()
  @ApiOperation({ summary: 'List visit records' })
  @ApiQuery({ name: 'elderId', required: false })
  findAll(@Query('elderId') elderId?: string) {
    return this.visitService.findAll(elderId);
  }

  @Post()
  @ApiOperation({ summary: 'Create visit record' })
  create(@Body() dto: CreateVisitDto) {
    return this.visitService.create(dto);
  }
}
