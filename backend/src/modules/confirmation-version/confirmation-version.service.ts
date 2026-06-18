import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class ConfirmationVersionService {
  constructor(private prisma: PrismaService) {}

  async findByTaskId(taskId: string, currentUser: any) {
    const task = await this.prisma.confirmationTask.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    await this.checkAccess(task, currentUser);

    const versions = await this.prisma.confirmationVersion.findMany({
      where: { taskId },
      orderBy: { version: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return versions;
  }

  async findOne(taskId: string, version: number, currentUser: any) {
    const task = await this.prisma.confirmationTask.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    await this.checkAccess(task, currentUser);

    const versionRecord = await this.prisma.confirmationVersion.findFirst({
      where: { taskId, version },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!versionRecord) {
      throw new NotFoundException('版本不存在');
    }

    return versionRecord;
  }

  async compareVersions(taskId: string, version1: number, version2: number, currentUser: any) {
    const task = await this.prisma.confirmationTask.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    await this.checkAccess(task, currentUser);

    const [v1, v2] = await Promise.all([
      this.prisma.confirmationVersion.findFirst({
        where: { taskId, version: version1 },
        include: {
          images: {
            orderBy: { order: 'asc' },
          },
        },
      }),
      this.prisma.confirmationVersion.findFirst({
        where: { taskId, version: version2 },
        include: {
          images: {
            orderBy: { order: 'asc' },
          },
        },
      }),
    ]);

    if (!v1 || !v2) {
      throw new NotFoundException('版本不存在');
    }

    const differences: string[] = [];

    if (v1.title !== v2.title) differences.push('title');
    if (v1.description !== v2.description) differences.push('description');
    if (v1.nodeName !== v2.nodeName) differences.push('nodeName');
    if (v1.location !== v2.location) differences.push('location');
    if (v1.amount?.toString() !== v2.amount?.toString()) differences.push('amount');
    if (v1.images.length !== v2.images.length) differences.push('images');

    return {
      version1: v1,
      version2: v2,
      differences,
    };
  }

  private async checkAccess(task: any, currentUser: any) {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (currentUser.role === UserRole.OWNER && task.project?.ownerId === currentUser.id) {
      return;
    }

    if (
      currentUser.role === UserRole.PROJECT_MANAGER &&
      task.project?.projectManagerId === currentUser.id
    ) {
      return;
    }

    if (task.createdById === currentUser.id || task.assignedToId === currentUser.id) {
      return;
    }

    throw new ForbiddenException('无权访问此任务的版本');
  }
}
