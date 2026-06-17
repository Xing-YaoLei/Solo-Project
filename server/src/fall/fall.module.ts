import { Module } from '@nestjs/common';
import { FallController } from './fall.controller';
import { FallService } from './fall.service';

@Module({
  controllers: [FallController],
  providers: [FallService],
  exports: [FallService],
})
export class FallModule {}
