import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ConfigService } from './config.service';
import { CreateVisitResultDto, CreateProblemTagDto } from '@solo/shared';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  async getAllConfig() {
    return this.configService.getAllConfig();
  }

  @Get('visit-results')
  async getVisitResults(@Query('includeInactive') includeInactive?: string) {
    return this.configService.getVisitResults(includeInactive === 'true');
  }

  @Post('visit-results')
  async createVisitResult(@Body() data: CreateVisitResultDto) {
    return this.configService.createVisitResult(data);
  }

  @Put('visit-results/:id')
  async updateVisitResult(@Param('id') id: string, @Body() data: any) {
    return this.configService.updateVisitResult(id, data);
  }

  @Delete('visit-results/:id')
  async deleteVisitResult(@Param('id') id: string) {
    return this.configService.deleteVisitResult(id);
  }

  @Get('problem-tags')
  async getProblemTags(@Query('includeInactive') includeInactive?: string) {
    return this.configService.getProblemTags(includeInactive === 'true');
  }

  @Post('problem-tags')
  async createProblemTag(@Body() data: CreateProblemTagDto) {
    return this.configService.createProblemTag(data);
  }

  @Put('problem-tags/:id')
  async updateProblemTag(@Param('id') id: string, @Body() data: any) {
    return this.configService.updateProblemTag(id, data);
  }

  @Delete('problem-tags/:id')
  async deleteProblemTag(@Param('id') id: string) {
    return this.configService.deleteProblemTag(id);
  }
}
