import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MaterialService } from './material.service';

@ApiTags('材料管理')
@Controller('materials')
export class MaterialController {
  constructor(private readonly service: MaterialService) {}

  @Get()
  @ApiOperation({ summary: '获取材料列表' })
  @ApiQuery({ name: 'isCommon', required: false, type: Boolean })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  findAll(
    @Query('isCommon') isCommon?: string,
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.service.findAll({
      isCommon: isCommon === 'true' ? true : isCommon === 'false' ? false : undefined,
      category,
      keyword,
    });
  }

  @Get('common')
  @ApiOperation({ summary: '获取常用材料列表' })
  getCommonMaterials() {
    return this.service.getCommonMaterials();
  }

  @Get('categories')
  @ApiOperation({ summary: '获取材料分类列表' })
  getCategories() {
    return this.service.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取材料详情' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建材料' })
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新材料' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除材料' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
