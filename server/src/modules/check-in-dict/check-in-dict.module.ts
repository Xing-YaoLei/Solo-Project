import { Module } from '@nestjs/common';
import { CheckInDictController, CheckInRecordController } from './check-in-dict.controller';
import { CheckInDictService } from './check-in-dict.service';

@Module({
  controllers: [CheckInDictController, CheckInRecordController],
  providers: [CheckInDictService],
  exports: [CheckInDictService],
})
export class CheckInDictModule {}
