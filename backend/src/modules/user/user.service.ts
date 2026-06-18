import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto/user.dto';
import { UserWithoutPassword } from '../auth/entities/auth.entity';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('邮箱已存在');
    }

    if (createUserDto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: createUserDto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('手机号已存在');
      }
    }

    const saltRounds = this.configService.get('BCRYPT_SALT_ROUNDS', 10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async findAll(queryUsersDto: QueryUsersDto): Promise<{ data: UserWithoutPassword[]; total: number }> {
    const { page = 1, limit = 10, keyword, role, isActive } = queryUsersDto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { phone: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map((user) => {
      const { password, ...result } = user;
      return result;
    });

    return { data, total };
  }

  async findOne(id: string): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const { password, ...result } = user;
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('邮箱已存在');
      }
    }

    if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: updateUserDto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('手机号已存在');
      }
    }

    let hashedPassword: string | undefined;
    if (updateUserDto.password) {
      const saltRounds = this.configService.get('BCRYPT_SALT_ROUNDS', 10);
      hashedPassword = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        password: hashedPassword,
      },
    });

    const { password, ...result } = updatedUser;
    return result;
  }

  async remove(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findByRole(role: string): Promise<UserWithoutPassword[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: role as any,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return users.map((user) => {
      const { password, ...result } = user;
      return result;
    });
  }
}
