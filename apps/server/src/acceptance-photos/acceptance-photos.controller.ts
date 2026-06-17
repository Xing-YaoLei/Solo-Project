import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AcceptancePhotosService } from './acceptance-photos.service';
import { CreateAcceptancePhotoDto } from './dto/create-acceptance-photo.dto';
import { UpdateAcceptancePhotoDto } from './dto/update-acceptance-photo.dto';
import { ReviewDto } from './dto/review.dto';
import { CurrentUser, CurrentUserType } from '../auth/current-user.decorator';
import { AcceptanceStatus } from '@prisma/client';

@ApiTags('验收照片')
@Controller('acceptance-photos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class AcceptancePhotosController {
  constructor(private readonly acceptancePhotosService: AcceptancePhotosService) {}

  @Post()
  @ApiOperation({ summary: '上传验收照片' })
  create(
    @Body() createAcceptancePhotoDto: CreateAcceptancePhotoDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.acceptancePhotosService.create(createAcceptancePhotoDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: '查询验收照片列表' })
  @ApiQuery({ name: 'changeOrderId', required: false, description: '变更单ID' })
  @ApiQuery({ name: 'status', required: false, description: '状态', enum: AcceptanceStatus })
  findAll(
    @Query('changeOrderId') changeOrderId?: string,
    @Query('status') status?: AcceptanceStatus,
  ) {
    return this.acceptancePhotosService.findAll(changeOrderId, status);
  }

  @Get('change-order/:changeOrderId')
  @ApiOperation({ summary: '按变更单查询验收照片' })
  @ApiParam({ name: 'changeOrderId', description: '变更单ID' })
  findByChangeOrder(@Param('changeOrderId') changeOrderId: string) {
    return this.acceptancePhotosService.findByChangeOrder(changeOrderId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取验收照片详情' })
  @ApiParam({ name: 'id', description: '验收照片ID' })
  findOne(@Param('id') id: string) {
    return this.acceptancePhotosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新验收照片' })
  @ApiParam({ name: 'id', description: '验收照片ID' })
  update(
    @Param('id') id: string,
    @Body() updateAcceptancePhotoDto: UpdateAcceptancePhotoDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.acceptancePhotosService.update(id, updateAcceptancePhotoDto, user.id);
  }

  @Post(':id/review')
  @ApiOperation({ summary: '审核验收照片' })
  @ApiParam({ name: 'id', description: '验收照片ID' })
  review(
    @Param('id') id: string,
    @Body() reviewDto: ReviewDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.acceptancePhotosService.review(id, reviewDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除验收照片' })
  @ApiParam({ name: 'id', description: '验收照片ID' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.acceptancePhotosService.remove(id, user.id);
  }
}
