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
import { PropertiesService } from './properties.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PropertyStatus } from '@prisma/client'

@Controller('properties')
@UseGuards(JwtAuthGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async findAll(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('status') status?: PropertyStatus,
    @Query('district') district?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('bedrooms') bedrooms?: string,
    @Query('keyword') keyword?: string,
    @Query('managerId') managerId?: string,
  ) {
    return this.propertiesService.findAll({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      status,
      district,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
      keyword,
      managerId,
    })
  }

  @Get('stats')
  async getStats() {
    return this.propertiesService.getStats()
  }

  @Get('filters')
  async getFilters() {
    return this.propertiesService.getFilters()
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id)
  }

  @Post()
  async create(@Body() data: any, @Req() req: any) {
    return this.propertiesService.create(data, req.user.userId)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.propertiesService.update(id, data)
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: PropertyStatus) {
    return this.propertiesService.updateStatus(id, status)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.propertiesService.delete(id)
  }

  @Post(':id/photos')
  async uploadPhoto(@Param('id') propertyId: string, @Body() photoData: any) {
    return this.propertiesService.uploadPhoto(propertyId, photoData)
  }

  @Put('photos/:photoId')
  async updatePhoto(@Param('photoId') photoId: string, @Body() data: any) {
    return this.propertiesService.updatePhoto(photoId, data)
  }

  @Delete('photos/:photoId')
  async deletePhoto(@Param('photoId') photoId: string) {
    return this.propertiesService.deletePhoto(photoId)
  }

  @Post(':id/photos/:photoId/cover')
  async setCoverPhoto(@Param('id') propertyId: string, @Param('photoId') photoId: string) {
    return this.propertiesService.setCoverPhoto(propertyId, photoId)
  }
}
