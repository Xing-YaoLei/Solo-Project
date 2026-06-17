import { Module } from '@nestjs/common';
import { RepairPersonController } from './repair-person.controller';
import { RepairPersonService } from './repair-person.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RepairPersonController],
  providers: [RepairPersonService],
  exports: [RepairPersonService],
})
export class RepairPersonModule {}
