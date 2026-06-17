import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  private readonly selectProject = {
    id: true,
    name: true,
    address: true,
    ownerId: true,
    designerId: true,
    foremanId: true,
    supervisorId: true,
    startDate: true,
    endDate: true,
    actualEndDate: true,
    status: true,
    description: true,
    createdAt: true,
    updatedAt: true,
    owner: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    },
    designer: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    },
    foreman: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    },
    supervisor: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    },
  };

  async create(createProjectDto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        startDate: createProjectDto.startDate
          ? new Date(createProjectDto.startDate)
          : undefined,
        endDate: createProjectDto.endDate
          ? new Date(createProjectDto.endDate)
          : undefined,
      },
      select: this.selectProject,
    });
  }

  async findAll() {
    return this.prisma.project.findMany({
      select: this.selectProject,
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: this.selectProject,
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    const data: any = { ...updateProjectDto };

    if (updateProjectDto.startDate) {
      data.startDate = new Date(updateProjectDto.startDate);
    }
    if (updateProjectDto.endDate) {
      data.endDate = new Date(updateProjectDto.endDate);
    }
    if (updateProjectDto.actualEndDate) {
      data.actualEndDate = new Date(updateProjectDto.actualEndDate);
    }

    return this.prisma.project.update({
      where: { id },
      data,
      select: this.selectProject,
    });
  }

  async remove(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    return this.prisma.project.delete({
      where: { id },
      select: this.selectProject,
    });
  }
}
