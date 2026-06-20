import { Module } from '@nestjs/common';
import { SeatMapController } from './seat-map.controller';
import { SeatMapService } from './seat-map.service';

@Module({
  controllers: [SeatMapController],
  providers: [SeatMapService],
  exports: [SeatMapService],
})
export class SeatMapModule {}
