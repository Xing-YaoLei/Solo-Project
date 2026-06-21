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
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { BatchRegisterDto } from './dto/batch-register.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { AttendanceStatsDto, AttendanceStatsResultDto } from './dto/attendance-stats.dto';
import { AttendanceStatus, AttendanceRecord } from '@prisma/client';
import { PaginatedResultDto } from '../../common/dto/pagination.dto';

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '到场签到' })
  @ApiResponse({ status: 201, description: '签到成功' })
  checkIn(@Body() dto: CheckInDto): Promise<AttendanceRecord> {
    return this.attendanceService.checkIn(dto);
  }

  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '到场签退' })
  @ApiResponse({ status: 200, description: '签退成功' })
  checkOut(@Body() dto: CheckOutDto): Promise<AttendanceRecord> {
    return this.attendanceService.checkOut(dto);
  }

  @Post('batch-register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '批量登记到场状态' })
  @ApiResponse({ status: 201, description: '批量登记成功' })
  batchRegister(@Body() dto: BatchRegisterDto): Promise<{ count: number; records: AttendanceRecord[] }> {
    return this.attendanceService.batchRegister(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查询签到记录列表' })
  findAll(@Query() dto: QueryAttendanceDto): Promise<PaginatedResultDto<AttendanceRecord>> {
    return this.attendanceService.findAll(dto);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取到场状态统计' })
  getStats(@Query() dto: AttendanceStatsDto): Promise<AttendanceStatsResultDto> {
    return this.attendanceService.getStats(dto);
  }

  @Get('sign-types')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取签到方式列表' })
  getSignTypes(): Promise<string[]> {
    return this.attendanceService.getSignTypes();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取单条签到记录详情' })
  findOne(@Param('id') id: string): Promise<AttendanceRecord> {
    return this.attendanceService.findOne(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新签到状态' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: AttendanceStatus,
    @Body('remark') remark?: string,
  ): Promise<AttendanceRecord> {
    return this.attendanceService.updateStatus(id, status, remark);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除签到记录' })
  remove(@Param('id') id: string): Promise<void> {
    return this.attendanceService.remove(id);
  }
}
