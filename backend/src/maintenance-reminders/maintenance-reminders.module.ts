import { Module } from '@nestjs/common';
import { MaintenanceRemindersService } from './maintenance-reminders.service';
import { MaintenanceRemindersController } from './maintenance-reminders.controller';

@Module({
  controllers: [MaintenanceRemindersController],
  providers: [MaintenanceRemindersService],
  exports: [MaintenanceRemindersService],
})
export class MaintenanceRemindersModule {}
