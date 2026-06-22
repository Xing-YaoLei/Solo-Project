import { Injectable, UnauthorizedException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateTokens(user: { id: string; username: string; role: string }) {
    const accessTokenExpires = this.configService.get<number>('JWT_ACCESS_EXPIRES', 3600);
    const refreshTokenExpires = this.configService.get<number>('JWT_REFRESH_EXPIRES', 604800);

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET', 'default-secret-key'),
        expiresIn: accessTokenExpires,
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        type: 'refresh',
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'default-refresh-secret-key'),
        expiresIn: refreshTokenExpires,
      },
    );

    await this.redis.setUserSession(user.id, {
      id: user.id,
      username: user.username,
      role: user.role,
      refreshToken,
    }, refreshTokenExpires);

    return {
      accessToken,
      refreshToken,
      accessTokenExpires,
      refreshTokenExpires,
    };
  }

  async validateUser(loginDto: LoginDto): Promise<User> {
    const { identifier, password } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账户已被禁用');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto);
    const tokens = await this.generateTokens(user);

    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
      position: user.position,
      avatarUrl: user.avatarUrl,
    };

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: 'Bearer',
      expiresIn: tokens.accessTokenExpires,
      user: userInfo,
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: registerDto.username }, { email: registerDto.email }],
      },
    });

    if (existingUser) {
      throw new HttpException('用户名或邮箱已存在', HttpStatus.CONFLICT);
    }

    const hashedPassword = await this.hashPassword(registerDto.password);

    const user = await this.prisma.user.create({
      data: {
        ...registerDto,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        createdAt: true,
      },
    });

    this.logger.log(`用户注册成功: ${user.username}`);

    return user;
  }

  async logout(
    refreshToken: string,
    userId: string,
  ): Promise<void> {
    const accessTokenExpires = this.configService.get<number>('JWT_ACCESS_EXPIRES', 3600);

    try {
      const accessPayload = this.jwtService.decode(refreshToken);
      if (accessPayload && typeof accessPayload === 'object' && accessPayload.exp) {
        const remaining = accessPayload.exp - Math.floor(Date.now() / 1000);
        if (remaining > 0) {
          await this.redis.setBlacklistToken(refreshToken, remaining);
        }
      }
    } catch {}

    await this.redis.removeUserSession(userId);
  }

  async refreshToken(oldRefreshToken: string) {
    try {
      const payload = this.jwtService.verify(oldRefreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'default-refresh-secret-key'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      if (await this.redis.isTokenBlacklisted(oldRefreshToken)) {
        throw new UnauthorizedException('刷新令牌已失效');
      }

      const session = await this.redis.getUserSession(payload.sub);
      if (!session) {
        throw new UnauthorizedException('会话已过期，请重新登录');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('用户不存在或已被禁用');
      }

      const tokens = await this.generateTokens(user);

      try {
        const oldPayload = this.jwtService.decode(oldRefreshToken);
        if (oldPayload && typeof oldPayload === 'object' && oldPayload.exp) {
          const remaining = oldPayload.exp - Math.floor(Date.now() / 1000);
          if (remaining > 0) {
            await this.redis.setBlacklistToken(oldRefreshToken, remaining);
          }
        }
      } catch {}

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    return user;
  }
}
