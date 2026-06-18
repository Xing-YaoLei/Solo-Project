import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, QueryProjectsDto } from './dto/project.dto';
import { UserRole, User } from '@prisma/client';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, currentUser: any) {
    const owner = await this.prisma.user.findUnique({
      where: { id: createProjectDto.ownerId },
    });

    if (!owner) {
      throw new NotFoundException('业主不存在');
    }

    if (createProjectDto.projectManagerId) {
      const pm = await this.prisma.user.findUnique({
        where: { id: createProjectDto.projectManagerId },
      });
      if (!pm) {
        throw new NotFoundException('项目经理不存在');
      }
    }

    const project = await this.prisma.project.create({
      data: {
        ...createProjectDto,
        totalBudget: createProjectDto.totalBudget ? createProjectDto.totalBudget as any : undefined,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        projectManager: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return project;
  }

  async findAll(queryProjectsDto: QueryProjectsDto, currentUser: any) {
    const { page = 1, limit = 10, keyword, status, ownerId, projectManagerId } = queryProjectsDto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { address: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (projectManagerId) {
      where.projectManagerId = projectManagerId;
    }

    if (currentUser.role === UserRole.OWNER) {
      where.ownerId = currentUser.id;
    }

    if (currentUser.role === UserRole.PROJECT_MANAGER) {
      where.projectManagerId = currentUser.id;
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              role: true,
            },
          },
          projectManager: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data: projects, total };
  }

  async findOne(id: string, currentUser: any) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        projectManager: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    if (currentUser.role === UserRole.OWNER && project.ownerId !== currentUser.id) {
      throw new ForbiddenException('无权访问该项目');
    }

    if (currentUser.role === UserRole.PROJECT_MANAGER && project.projectManagerId !== currentUser.id) {
      throw new ForbiddenException('无权访问该项目');
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, currentUser: any) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.PROJECT_MANAGER
    ) {
      throw new ForbiddenException('无权修改项目');
    }

    if (currentUser.role === UserRole.PROJECT_MANAGER && project.projectManagerId !== currentUser.id) {
      throw new ForbiddenException('无权修改该项目');
    }

    if (updateProjectDto.ownerId) {
      const owner = await this.prisma.user.findUnique({
        where: { id: updateProjectDto.ownerId },
      });
      if (!owner) {
        throw new NotFoundException('业主不存在');
      }
    }

    if (updateProjectDto.projectManagerId) {
      const pm = await this.prisma.user.findUnique({
        where: { id: updateProjectDto.projectManagerId },
      });
      if (!pm) {
        throw new NotFoundException('项目经理不存在');
      }
    }

    const updateData: any = { ...updateProjectDto };
    if (updateProjectDto.totalBudget !== undefined) {
      updateData.totalBudget = updateProjectDto.totalBudget as any;
    }

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        projectManager: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return updatedProject;
  }

  async remove(id: string, currentUser: any) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('无权删除项目');
    }

    await this.prisma.project.delete({
      where: { id },
    });
  }

  async getProjectStats(id: string, currentUser: any) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    const taskStats = await this.prisma.confirmationTask.groupBy({
      by: ['status'],
      where: { projectId: id },
      _count: { status: true },
    });

    const stats: Record<string, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      DISPUTED: 0,
      OVERDUE: 0,
      total: 0,
    };

    taskStats.forEach((item: any) => {
      stats[item.status] = item._count.status;
      stats.total += item._count.status;
    });

    return {
      ...stats,
      projectId: id,
    };
  }
}
