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
} from '@nestjs/common'
import { TenantsService } from './tenants.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async findAll(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('propertyId') propertyId?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.tenantsService.findAll({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      propertyId,
      keyword,
    })
  }

  @Get('stats')
  async getStats() {
    return this.tenantsService.getStats()
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id)
  }

  @Post()
  async create(@Body() data: any) {
    return this.tenantsService.create(data)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.tenantsService.update(id, data)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.tenantsService.delete(id)
  }
}
