import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { DepartmentType } from '@prisma/client';

interface CreateDepartmentDto {
  name: string;
  code: string;
  type: DepartmentType;
  parentId?: string;
  sortOrder?: number;
}

interface UpdateDepartmentDto {
  name?: string;
  code?: string;
  type?: DepartmentType;
  parentId?: string;
  sortOrder?: number;
}

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async getTree() {
    const departments = await this.prisma.department.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { users: true },
    });

    const map = new Map();
    const roots: any[] = [];

    departments.forEach((dept) => {
      map.set(dept.id, { ...dept, children: [] });
    });

    departments.forEach((dept) => {
      const node = map.get(dept.id);
      if (dept.parentId && map.has(dept.parentId)) {
        map.get(dept.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  async findAll() {
    return this.prisma.department.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { users: true },
    });
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: { users: true, children: true, parent: true },
    });
    if (!department) {
      throw new NotFoundException('部门不存在');
    }
    return department;
  }

  async create(data: CreateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new ConflictException('部门编码已存在');
    }
    return this.prisma.department.create({ data });
  }

  async update(id: string, data: UpdateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('部门不存在');
    }
    if (data.code && data.code !== existing.code) {
      const duplicate = await this.prisma.department.findUnique({ where: { code: data.code } });
      if (duplicate) {
        throw new ConflictException('部门编码已存在');
      }
    }
    return this.prisma.department.update({ where: { id }, data });
  }

  async remove(id: string) {
    const existing = await this.prisma.department.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('部门不存在');
    }
    return this.prisma.department.delete({ where: { id } });
  }
}
