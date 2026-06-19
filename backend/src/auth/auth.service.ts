import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User, Role, Permission } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const { password: _password, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role.code,
      permissions: user.role.permissions.map((p) => p.code),
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: {
          id: user.role.id,
          name: user.role.name,
          code: user.role.code,
        },
        permissions: user.role.permissions.map((p) => p.code),
      },
    };
  }

  async validateUserById(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }
}

export interface UserWithRole extends User {
  role: Role & { permissions: Permission[] };
}
