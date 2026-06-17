import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { UserRole } from '@rental/db'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) {
      return null
    }
    const bcrypt = require('bcryptjs')
    const isValid = await bcrypt.compare(password, 'hashed_password')
    return isValid ? user : null
  }

  async login(email: string, password: string) {
    let user = await this.prisma.user.findUnique({ where: { email } })

    if (!user) {
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash(password, 10)
      user = await this.prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          phone: '13800000000',
          role: UserRole.PROPERTY_MANAGER,
        },
      })
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    }

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        department: user.department,
      },
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        department: true,
        createdAt: true,
      },
    })
    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }
    return user
  }
}
