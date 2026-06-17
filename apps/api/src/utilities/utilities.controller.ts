import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common'
import { UtilitiesService } from './utilities.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('utilities')
@UseGuards(JwtAuthGuard)
export class UtilitiesController {
  constructor(private readonly utilitiesService: UtilitiesService) {}

  @Get()
  async findAll(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('propertyId') propertyId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.utilitiesService.findAll({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      propertyId,
      type,
      startDate,
      endDate,
    })
  }

  @Get('stats')
  async getStats() {
    return this.utilitiesService.getStats()
  }

  @Get('types')
  async getTypes() {
    return this.utilitiesService.getTypes()
  }

  @Get('property/:propertyId')
  async getPropertyReadings(
    @Param('propertyId') propertyId: string,
    @Query('type') type?: string,
    @Query('months') months?: string,
  ) {
    return this.utilitiesService.getPropertyReadings(
      propertyId,
      type,
      months ? parseInt(months) : undefined,
    )
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.utilitiesService.findOne(id)
  }

  @Post()
  async create(@Body() data: any, @Req() req: any) {
    return this.utilitiesService.create(data, req.user.userId)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.utilitiesService.update(id, data)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.utilitiesService.delete(id)
  }
}
