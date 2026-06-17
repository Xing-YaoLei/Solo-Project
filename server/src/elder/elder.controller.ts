import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ElderService } from './elder.service';
import { CreateElderDto, UpdateElderDto } from './dto/elder.dto';

@ApiTags('elders')
@Controller('elders')
export class ElderController {
  constructor(private readonly elderService: ElderService) {}

  @Get()
  @ApiOperation({ summary: 'List elders with pagination and filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'careLevel', required: false })
  @ApiQuery({ name: 'fallRiskLevel', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('careLevel') careLevel?: string,
    @Query('fallRiskLevel') fallRiskLevel?: string,
    @Query('status') status?: string,
  ) {
    return this.elderService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      careLevel,
      fallRiskLevel,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get elder detail with relations' })
  findOne(@Param('id') id: string) {
    return this.elderService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create elder' })
  create(@Body() dto: CreateElderDto) {
    return this.elderService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update elder' })
  update(@Param('id') id: string, @Body() dto: UpdateElderDto) {
    return this.elderService.update(id, dto);
  }
}
