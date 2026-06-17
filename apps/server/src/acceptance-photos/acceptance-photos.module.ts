import { Module } from '@nestjs/common';
import { AcceptancePhotosService } from './acceptance-photos.service';
import { AcceptancePhotosController } from './acceptance-photos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AcceptancePhotosController],
  providers: [AcceptancePhotosService],
  exports: [AcceptancePhotosService],
})
export class AcceptancePhotosModule {}
