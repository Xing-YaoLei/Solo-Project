import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { paginate } from '../common/utils/pagination';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createVehicleDto: CreateVehicleDto) {
    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { plateNumber: createVehicleDto.plateNumber },
    });

    if (existingVehicle) {
      throw new ConflictException('车牌号已存在');
    }

    return this.prisma.vehicle.create({
      data: createVehicleDto,
    });
  }

  async findAll(page: number, pageSize: number, keyword?: string) {
    const skip = (page - 1) * pageSize;

    const where = keyword
      ? {
          OR: [
            { plateNumber: { contains: keyword } },
            { brand: { contains: keyword } },
            { model: { contains: keyword } },
            { ownerName: { contains: keyword } },
            { ownerPhone: { contains: keyword } },
            { vin: { contains: keyword } },
          ],
        }
      : {};

    const [total, vehicles] = await Promise.all([
      this.prisma.vehicle.count({ where }),
      this.prisma.vehicle.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return paginate(vehicles, total, page, pageSize);
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        maintenanceReminders: {
          where: { isCompleted: false },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('车辆不存在');
    }

    return vehicle;
  }

  async findByPlateNumber(plateNumber: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { plateNumber },
      include: {
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('车辆不存在');
    }

    return vehicle;
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException('车辆不存在');
    }

    if (
      updateVehicleDto.plateNumber &&
      updateVehicleDto.plateNumber !== vehicle.plateNumber
    ) {
      const existingVehicle = await this.prisma.vehicle.findUnique({
        where: { plateNumber: updateVehicleDto.plateNumber },
      });

      if (existingVehicle) {
        throw new ConflictException('车牌号已存在');
      }
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: updateVehicleDto,
    });
  }

  async remove(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException('车辆不存在');
    }

    await this.prisma.vehicle.delete({
      where: { id },
    });

    return { message: '删除成功' };
  }
}
