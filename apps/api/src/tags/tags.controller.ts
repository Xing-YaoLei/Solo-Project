import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';

class CreateTagDto {
  name: string;
  code: string;
  color: string;
  parentId?: string;
  sortOrder?: number;
}

class UpdateTagDto {
  name?: string;
  code?: string;
  color?: string;
  parentId?: string;
  sortOrder?: number;
}

@ApiTags('标签')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: '获取所有标签' })
  findAll() {
    return this.tagsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个标签' })
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建标签' })
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新标签' })
  update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除标签' })
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}
