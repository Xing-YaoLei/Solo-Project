import { Module } from '@nestjs/common';
import { ExceptionService } from './exception.service';
import { ExceptionController } from './exception.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExceptionController],
  providers: [ExceptionService],
  exports: [ExceptionService],
})
export class ExceptionModule {}
