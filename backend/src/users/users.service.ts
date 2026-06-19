import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { paginate } from '../common/utils/pagination';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: createUserDto.username },
          { email: createUserDto.email },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('用户名或邮箱已存在');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      include: {
        role: true,
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async findAll(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const [total, users] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip,
        take: pageSize,
        include: {
          role: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    return paginate(usersWithoutPassword, total, page, pageSize);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const { password, ...result } = user;
    return result;
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const data: any = { ...updateUserDto };
    delete data.password;

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
      },
    });

    const { password, ...result } = updatedUser;
    return result;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: '删除成功' };
  }
}
