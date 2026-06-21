import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export const SYSTEM_USER_ID = 'system-user-0000-0000-0000-000000000001';
export const SYSTEM_USER_NAME = '系统';

@Injectable()
export class SystemUserInitService implements OnModuleInit {
  private readonly logger = new Logger(SystemUserInitService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureSystemUser();
  }

  private async ensureSystemUser() {
    try {
      const passwordHash = await bcrypt.hash('123456', 10);
      await this.prisma.user.upsert({
        where: { id: SYSTEM_USER_ID },
        update: {
          name: SYSTEM_USER_NAME,
          phone: 'system',
          role: UserRole.SUPERVISOR,
        },
        create: {
          id: SYSTEM_USER_ID,
          name: SYSTEM_USER_NAME,
          phone: 'system',
          passwordHash,
          role: UserRole.SUPERVISOR,
          departmentId: null,
          avatar: null,
        },
      });
      this.logger.log('系统用户已就绪');
    } catch (e) {
      this.logger.warn('系统用户初始化失败: ' + (e as Error).message);
    }
  }
}
