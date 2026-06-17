import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFallDto, CreateCommunicationDto, CreateReviewDto } from './dto/fall.dto';

@Injectable()
export class FallService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.fallIncident.findMany({
      include: {
        elder: { select: { id: true, name: true, fallRiskLevel: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.fallIncident.findUnique({
      where: { id },
      include: {
        elder: true,
        communications: { orderBy: { createdAt: 'asc' } },
        reviewConclusion: true,
      },
    });
  }

  async create(dto: CreateFallDto) {
    const elder = await this.prisma.elder.findUnique({ where: { id: dto.elderId } });
    return this.prisma.fallIncident.create({
      data: {
        elderId: dto.elderId,
        reportedBy: dto.reportedBy,
        riskLevel: elder?.fallRiskLevel ?? 'LOW',
        incidentTime: new Date(dto.incidentTime),
        location: dto.location,
        description: dto.description,
      },
    });
  }

  async addCommunication(incidentId: string, dto: CreateCommunicationDto) {
    return this.prisma.communication.create({
      data: {
        incidentId,
        authorId: dto.authorId,
        authorName: dto.authorName,
        content: dto.content,
        type: dto.type,
      },
    });
  }

  async submitReview(incidentId: string, dto: CreateReviewDto) {
    await this.prisma.fallIncident.update({
      where: { id: incidentId },
      data: { status: 'REVIEWED' },
    });
    return this.prisma.reviewConclusion.create({
      data: {
        incidentId,
        reviewerId: dto.reviewerId,
        reviewerName: dto.reviewerName,
        conclusion: dto.conclusion,
        actionPlan: dto.actionPlan,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
      },
    });
  }
}
