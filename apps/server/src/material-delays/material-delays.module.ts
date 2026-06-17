import { Module } from '@nestjs/common';
import { MaterialDelaysService } from './material-delays.service';
import { MaterialDelaysController } from './material-delays.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MaterialDelaysController],
  providers: [MaterialDelaysService],
  exports: [MaterialDelaysService],
})
export class MaterialDelaysModule {}
