import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ConflictService } from './conflict.service';
import { CreateConflictDto } from './dto/create-conflict.dto';
import { UpdateConflictDto } from './dto/update-conflict.dto';
import { QueryConflictDto } from './dto/query-conflict.dto';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';
import { DetectConflictDto } from './dto/detect-conflict.dto';
import { ConflictCheck } from '@prisma/client';

@ApiTags('冲突检测 (Conflict)')
@Controller('conflicts')
export class ConflictController {
  constructor(private readonly conflictService: ConflictService) {}

  @Post()
  @ApiOperation({ summary: '创建冲突记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createConflictDto: CreateConflictDto): Promise<ConflictCheck> {
    return this.conflictService.create(createConflictDto);
  }

  @Get()
  @ApiOperation({ summary: '获取冲突列表（分页）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() query: QueryConflictDto) {
    return this.conflictService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取冲突统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getStats() {
    return this.conflictService.getConflictStats();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取冲突详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '冲突记录不存在' })
  findOne(@Param('id') id: string): Promise<ConflictCheck> {
    return this.conflictService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新冲突记录' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '冲突记录不存在' })
  update(
    @Param('id') id: string,
    @Body() updateConflictDto: UpdateConflictDto,
  ): Promise<ConflictCheck> {
    return this.conflictService.update(id, updateConflictDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除冲突记录' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '冲突记录不存在' })
  remove(@Param('id') id: string): Promise<void> {
    return this.conflictService.remove(id);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: '标记冲突已解决' })
  @ApiResponse({ status: 200, description: '解决成功' })
  @ApiResponse({ status: 404, description: '冲突记录不存在' })
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveConflictDto,
  ): Promise<ConflictCheck> {
    return this.conflictService.resolve(id, dto);
  }

  @Post('bulk-resolve')
  @ApiOperation({ summary: '批量标记冲突已解决' })
  @ApiResponse({ status: 200, description: '解决成功，返回处理数量' })
  bulkResolve(
    @Body() dto: ResolveConflictDto & { ids: string[] },
  ): Promise<{ count: number }> {
    const { ids, ...resolveDto } = dto;
    return this.conflictService
      .bulkResolve(ids, resolveDto)
      .then(count => ({ count }));
  }

  @Post('detect')
  @ApiOperation({ summary: '执行冲突检测' })
  @ApiResponse({ status: 200, description: '检测完成，返回检测到的冲突列表' })
  detect(@Body() dto: DetectConflictDto): Promise<ConflictCheck[]> {
    return this.conflictService.detect(dto);
  }

  @Post('hearing/:hearingId/auto-check')
  @ApiOperation({ summary: '对开庭自动执行冲突检测并入库' })
  @ApiResponse({ status: 201, description: '检测完成，返回新创建的冲突记录' })
  autoCreateConflicts(
    @Param('hearingId') hearingId: string,
    @Body() dto: DetectConflictDto,
  ): Promise<ConflictCheck[]> {
    return this.conflictService.autoCreateConflicts(hearingId, dto);
  }
}
