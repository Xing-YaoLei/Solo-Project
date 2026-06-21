import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatCompatibleController } from './chat-compatible.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ChatController, ChatCompatibleController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
