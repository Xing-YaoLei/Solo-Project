import { Module } from '@nestjs/common';
import { ElderController } from './elder.controller';
import { ElderService } from './elder.service';

@Module({
  controllers: [ElderController],
  providers: [ElderService],
  exports: [ElderService],
})
export class ElderModule {}
