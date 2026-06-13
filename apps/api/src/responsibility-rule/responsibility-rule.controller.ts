import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ResponsibilityRuleService } from './responsibility-rule.service';
import { CreateResponsibilityRuleDto } from '@solo/shared';

@Controller('responsibility-rules')
export class ResponsibilityRuleController {
  constructor(private readonly ruleService: ResponsibilityRuleService) {}

  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.ruleService.findAll({
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ruleService.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateResponsibilityRuleDto) {
    return this.ruleService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.ruleService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.ruleService.delete(id);
  }

  @Post('match')
  async matchRule(
    @Body() data: { problemTags: string[]; visitResult?: string; region: string },
  ) {
    return this.ruleService.matchRule(data);
  }
}
