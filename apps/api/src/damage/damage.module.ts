import { Module } from '@nestjs/common';
import { DamageController } from './damage.controller';

@Module({
  controllers: [DamageController],
})
export class DamageModule {}
