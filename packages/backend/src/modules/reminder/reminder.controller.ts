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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReminderService } from './reminder.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { QueryReminderDto, QueryRecipientDto } from './dto/query-reminder.dto';
import { SendReminderDto, ResendRecipientDto } from './dto/send-reminder.dto';
import { ReminderStatus } from '@prisma/client';

@ApiTags('reminder')
@ApiBearerAuth()
@Controller('reminders')
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Post()
  @ApiOperation({ summary: '创建提醒' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createReminderDto: CreateReminderDto) {
    return this.reminderService.create(createReminderDto);
  }

  @Get()
  @ApiOperation({ summary: '获取提醒列表（分页）' })
  findAll(@Query() query: QueryReminderDto) {
    return this.reminderService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取提醒统计信息' })
  getStats(@Query('hearingId') hearingId?: string) {
    return this.reminderService.getReminderStats(hearingId);
  }

  @Get('recipients')
  @ApiOperation({ summary: '获取提醒接收人列表（分页）' })
  findRecipients(@Query() query: QueryRecipientDto) {
    return this.reminderService.findRecipients(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取提醒详情' })
  findOne(@Param('id') id: string) {
    return this.reminderService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新提醒' })
  update(@Param('id') id: string, @Body() updateReminderDto: UpdateReminderDto) {
    return this.reminderService.update(id, updateReminderDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除提醒' })
  remove(@Param('id') id: string) {
    return this.reminderService.remove(id);
  }

  @Post('send')
  @ApiOperation({ summary: '批量发送提醒' })
  sendReminders(@Body() sendReminderDto: SendReminderDto) {
    const mockSenderId = '00000000-0000-0000-0000-000000000000';
    return this.reminderService.sendReminders(sendReminderDto, mockSenderId);
  }

  @Post(':id/resend')
  @ApiOperation({ summary: '重发提醒' })
  resendReminder(
    @Param('id') id: string,
    @Body() resendRecipientDto: ResendRecipientDto,
  ) {
    const mockSenderId = '00000000-0000-0000-0000-000000000000';
    return this.reminderService.resendReminder(id, resendRecipientDto, mockSenderId);
  }

  @Patch('recipients/:id/status')
  @ApiOperation({ summary: '更新接收人提醒状态' })
  updateRecipientStatus(
    @Param('id') id: string,
    @Body('status') status: ReminderStatus,
  ) {
    return this.reminderService.updateRecipientStatus(id, status);
  }
}
