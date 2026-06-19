import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleEnum } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findFirst({
      where: {
        OR: [{ name: createRoleDto.name }, { code: createRoleDto.code }],
      },
    });

    if (existingRole) {
      throw new ConflictException('角色名称或编码已存在');
    }

    return this.prisma.role.create({
      data: {
        ...createRoleDto,
        permissions: {
          connect: createRoleDto.permissionIds?.map((id) => ({ id })) || [],
        },
      },
      include: {
        permissions: true,
      },
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return role;
  }

  async findByCode(code: RoleEnum) {
    return this.prisma.role.findUnique({
      where: { code },
      include: {
        permissions: true,
      },
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    const { permissionIds, ...data } = updateRoleDto;

    return this.prisma.role.update({
      where: { id },
      data: {
        ...data,
        permissions: permissionIds
          ? {
              set: permissionIds.map((permissionId) => ({ id: permissionId })),
            }
          : undefined,
      },
      include: {
        permissions: true,
      },
    });
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    if (role._count.users > 0) {
      throw new ConflictException('该角色下还有用户，无法删除');
    }

    await this.prisma.role.delete({
      where: { id },
    });

    return { message: '删除成功' };
  }
}
