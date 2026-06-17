import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateElderDto, UpdateElderDto } from './dto/elder.dto';

@Injectable()
export class ElderService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    careLevel?: string;
    fallRiskLevel?: string;
    status?: string;
  }) {
    const { page = 1, limit = 10, careLevel, fallRiskLevel, status } = params;
    const where: Record<string, unknown> = {};
    if (careLevel) where.careLevel = careLevel;
    if (fallRiskLevel) where.fallRiskLevel = fallRiskLevel;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.elder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.elder.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    return this.prisma.elder.findUnique({
      where: { id },
      include: {
        medications: { orderBy: { scheduledTime: 'desc' } },
        fallIncidents: { orderBy: { createdAt: 'desc' } },
        visitRecords: { orderBy: { visitTime: 'desc' } },
      },
    });
  }

  async create(dto: CreateElderDto) {
    return this.prisma.elder.create({
      data: {
        name: dto.name,
        age: dto.age,
        gender: dto.gender,
        careLevel: dto.careLevel ?? 'LEVEL_3',
        fallRiskLevel: dto.fallRiskLevel ?? 'LOW',
        roomNumber: dto.roomNumber,
        allergies: dto.allergies ?? [],
        emergencyContact: dto.emergencyContact,
        emergencyPhone: dto.emergencyPhone,
        status: dto.status ?? 'ACTIVE',
        admissionDate: new Date(dto.admissionDate),
      },
    });
  }

  async update(id: string, dto: UpdateElderDto) {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.age !== undefined) data.age = dto.age;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.careLevel !== undefined) data.careLevel = dto.careLevel;
    if (dto.fallRiskLevel !== undefined) data.fallRiskLevel = dto.fallRiskLevel;
    if (dto.roomNumber !== undefined) data.roomNumber = dto.roomNumber;
    if (dto.allergies !== undefined) data.allergies = dto.allergies;
    if (dto.emergencyContact !== undefined) data.emergencyContact = dto.emergencyContact;
    if (dto.emergencyPhone !== undefined) data.emergencyPhone = dto.emergencyPhone;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.admissionDate !== undefined) data.admissionDate = new Date(dto.admissionDate);

    return this.prisma.elder.update({ where: { id }, data });
  }
}
