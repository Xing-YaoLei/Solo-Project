import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async getCurrentUser() {
    let user = await this.prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: '管理员',
          email: 'admin@homestay.com',
          phone: '13800000000',
          role: UserRole.ADMIN,
        },
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
