import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserWithoutPassword } from '../auth/entities/auth.entity';

@ApiTags('聊天备注')
@Controller('confirmation-tasks/:taskId/chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: '发送聊天消息' })
  @ApiResponse({ status: 201, description: '发送成功' })
  async createMessage(
    @Param('taskId') taskId: string,
    @Body() createMessageDto: CreateChatMessageDto,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.chatService.createMessage(taskId, createMessageDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: '获取聊天消息列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMessages(
    @Param('taskId') taskId: string,
    @GetUser() currentUser: UserWithoutPassword,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(
      taskId,
      currentUser,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除聊天消息' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async deleteMessage(
    @Param('taskId') taskId: string,
    @Param('messageId') messageId: string,
    @GetUser() currentUser: UserWithoutPassword,
  ) {
    return this.chatService.deleteMessage(taskId, messageId, currentUser);
  }
}
