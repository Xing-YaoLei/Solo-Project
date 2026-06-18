import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { AuthResponse, JwtPayload, UserWithoutPassword } from './entities/auth.entity';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('邮箱已被注册');
    }

    if (registerDto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: registerDto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('手机号已被注册');
      }
    }

    const saltRounds = this.configService.get('BCRYPT_SALT_ROUNDS', 10);
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        phone: registerDto.phone,
        role: registerDto.role,
      },
    });

    const { password, ...userWithoutPassword } = user;

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const { password, ...userWithoutPassword } = user;

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshTokenDto.refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('用户不存在或已被禁用');
      }

      const { password, ...userWithoutPassword } = user;

      const tokens = await this.generateTokens(user.id, user.email, user.role);

      return {
        ...tokens,
        user: userWithoutPassword,
      };
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效');
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = { sub: userId, email, role: role as any };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    return { accessToken, refreshToken };
  }

  async getCurrentUser(userId: string): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const { password, ...result } = user;
    return result;
  }
}
