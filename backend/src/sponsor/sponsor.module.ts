import { Module } from '@nestjs/common';
import { SponsorService } from './sponsor.service';
import { SponsorController } from './sponsor.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemLogModule } from '../system-log/system-log.module';

@Module({
  imports: [PrismaModule, SystemLogModule],
  controllers: [SponsorController],
  providers: [SponsorService],
  exports: [SponsorService],
})
export class SponsorModule {}
