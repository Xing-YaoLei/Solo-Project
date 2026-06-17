import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MaterialDelaysService } from './material-delays.service';
import { CreateMaterialDelayDto } from './dto/create-material-delay.dto';
import { UpdateMaterialDelayDto } from './dto/update-material-delay.dto';
import { QueryMaterialDelayDto } from './dto/query-material-delay.dto';
import { CurrentUser, CurrentUserType } from '../auth/current-user.decorator';
import { MaterialDelayStatus } from '@prisma/client';

@ApiTags('材料延期管理')
@Controller('material-delays')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class MaterialDelaysController {
  constructor(private readonly materialDelaysService: MaterialDelaysService) {}

  @Post()
  @ApiOperation({ summary: '创建材料延期记录' })
  create(
    @Body() createMaterialDelayDto: CreateMaterialDelayDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.materialDelaysService.create(createMaterialDelayDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: '分页查询材料延期记录' })
  findAll(@Query() queryDto: QueryMaterialDelayDto) {
    return this.materialDelaysService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取材料延期详情' })
  @ApiParam({ name: 'id', description: '材料延期记录ID' })
  findOne(@Param('id') id: string) {
    return this.materialDelaysService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新材料延期记录' })
  @ApiParam({ name: 'id', description: '材料延期记录ID' })
  update(
    @Param('id') id: string,
    @Body() updateMaterialDelayDto: UpdateMaterialDelayDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.materialDelaysService.update(id, updateMaterialDelayDto, user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '更新材料延期状态' })
  @ApiParam({ name: 'id', description: '材料延期记录ID' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: MaterialDelayStatus,
    @Body('remark') remark?: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.materialDelaysService.updateStatus(id, status, user.id, remark);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除材料延期记录' })
  @ApiParam({ name: 'id', description: '材料延期记录ID' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.materialDelaysService.remove(id, user.id);
  }
}
