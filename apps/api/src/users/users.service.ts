import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto, createPaginatedResult, PaginatedResult } from '@/common/dto/pagination.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

const userSelectFields = {
  id: true,
  username: true,
  email: true,
  fullName: true,
  role: true,
  department: true,
  position: true,
  phone: true,
  isActive: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: createUserDto.username }, { email: createUserDto.email }],
      },
    });

    if (existing) {
      throw new HttpException('用户名或邮箱已存在', HttpStatus.CONFLICT);
    }

    const hashedPassword = await this.hashPassword(createUserDto.password);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: userSelectFields,
    });

    this.logger.log(`创建用户成功: ${user.username}`);
    return user;
  }

  async findAll(
    pagination: PaginationDto,
    filters?: {
      role?: UserRole;
      department?: string;
      isActive?: boolean;
    },
  ): Promise<PaginatedResult<any>> {
    const { skip, take, keyword, sortBy, sortOrder } = pagination;

    const where: any = {};

    if (filters?.role) where.role = filters.role;
    if (filters?.department) where.department = filters.department;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    if (keyword) {
      where.OR = [
        { username: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { fullName: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: userSelectFields,
      }),
    ]);

    return createPaginatedResult(data, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelectFields,
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async findByUsernameOrEmail(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    const data: any = { ...updateUserDto };

    if (updateUserDto.password) {
      data.password = await this.hashPassword(updateUserDto.password);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: userSelectFields,
    });

    this.logger.log(`更新用户成功: ${updated.username}`);
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: '用户已禁用' };
  }

  async toggleActive(id: string) {
    const user = await this.findOne(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: userSelectFields,
    });

    return updated;
  }

  async getDepartments() {
    const result = await this.prisma.user.findMany({
      where: { department: { not: null } },
      distinct: ['department'],
      select: { department: true },
    });
    return result.map((r) => r.department).filter(Boolean);
  }
}
