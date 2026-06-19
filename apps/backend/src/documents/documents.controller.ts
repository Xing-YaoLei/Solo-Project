import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { DocumentStatus } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('入住证件')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: '获取证件列表' })
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('orderId') orderId?: string,
    @Query('status') status?: DocumentStatus,
    @Query('keyword') keyword?: string,
    @Query('propertyId') propertyId?: string,
  ) {
    return this.documentsService.findAll({
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      orderId: orderId ? parseInt(orderId) : undefined,
      status,
      keyword,
      propertyId: propertyId ? parseInt(propertyId) : undefined,
    });
  }

  @Get('pending-count')
  @ApiOperation({ summary: '获取待审核证件数量' })
  getPendingCount(@Query('propertyId') propertyId?: string) {
    return this.documentsService.getPendingCount(
      propertyId ? parseInt(propertyId) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取证件详情' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(parseInt(id));
  }

  @Post()
  @ApiOperation({ summary: '创建证件记录' })
  create(@Body() createDocumentDto: any) {
    return this.documentsService.create(createDocumentDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新证件记录' })
  update(@Param('id') id: string, @Body() updateDocumentDto: any) {
    return this.documentsService.update(parseInt(id), updateDocumentDto);
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: '审核证件' })
  verify(
    @Param('id') id: string,
    @Body('status') status: DocumentStatus,
    @Body('remarks') remarks: string,
    @Req() req: any,
  ) {
    return this.documentsService.verify(parseInt(id), status, req.user.userId, remarks);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除证件记录' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(parseInt(id));
  }
}
