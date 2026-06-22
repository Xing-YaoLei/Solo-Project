import { Module } from '@nestjs/common';
import { SamplingsService } from './samplings.service';
import { SamplingsController } from './samplings.controller';

@Module({
  controllers: [SamplingsController],
  providers: [SamplingsService],
  exports: [SamplingsService],
})
export class SamplingsModule {}
