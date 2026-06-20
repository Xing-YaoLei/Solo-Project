import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { AssignComplaintDto, ReassignComplaintDto } from './dto/assign-complaint.dto';
import { QueryComplaintDto } from './dto/query-complaint.dto';
import { VisitResultDto } from './dto/visit-result.dto';
import { SupplementMaterialDto, RejectComplaintDto, UpgradeComplaintDto } from './dto/supplement-material.dto';

@ApiTags('投诉工单')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  @ApiOperation({ summary: '分页查询投诉工单' })
  findAll(@Query() query: QueryComplaintDto, @CurrentUser() user: any) {
    return this.complaintsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取投诉工单详情' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.complaintsService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: '创建投诉工单' })
  create(@Body() createComplaintDto: CreateComplaintDto, @CurrentUser() user: any) {
    return this.complaintsService.create(createComplaintDto, user);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新投诉工单' })
  update(
    @Param('id') id: string,
    @Body() updateComplaintDto: UpdateComplaintDto,
    @CurrentUser() user: any,
  ) {
    return this.complaintsService.update(id, updateComplaintDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除投诉工单' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.complaintsService.remove(id, user);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: '分派投诉工单' })
  assign(
    @Param('id') id: string,
    @Body() assignDto: AssignComplaintDto,
    @CurrentUser() user: any,
  ) {
    return this.complaintsService.assign(id, assignDto, user);
  }

  @Post(':id/reassign')
  @ApiOperation({ summary: '转派投诉工单' })
  reassign(
    @Param('id') id: string,
    @Body() reassignDto: ReassignComplaintDto,
    @CurrentUser() user: any,
  ) {
    return this.complaintsService.reassign(id, reassignDto, user);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '驳回投诉工单' })
  reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectComplaintDto,
    @CurrentUser() user: any,
  ) {
    return this.complaintsService.reject(id, rejectDto, user);
  }

  @Post(':id/upgrade')
  @ApiOperation({ summary: '升级投诉工单' })
  upgrade(
    @Param('id') id: string,
    @Body() upgradeDto: UpgradeComplaintDto,
    @CurrentUser() user: any,
  ) {
    return this.complaintsService.upgrade(id, upgradeDto, user);
  }

  @Post(':id/supplement')
  @ApiOperation({ summary: '补充投诉材料' })
  supplement(
    @Param('id') id: string,
    @Body() supplementDto: SupplementMaterialDto,
    @CurrentUser() user: any,
  ) {
    return this.complaintsService.supplement(id, supplementDto, user);
  }

  @Post(':id/visit')
  @ApiOperation({ summary: '回访投诉工单' })
  visit(
    @Param('id') id: string,
    @Body() visitResultDto: VisitResultDto,
    @CurrentUser() user: any,
  ) {
    return this.complaintsService.visit(id, visitResultDto, user);
  }

  @Post(':id/close')
  @ApiOperation({ summary: '关闭投诉工单' })
  close(@Param('id') id: string, @CurrentUser() user: any) {
    return this.complaintsService.close(id, user);
  }
}
