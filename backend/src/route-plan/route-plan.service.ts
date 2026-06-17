import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RoutePlanService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findByOrderId(orderId: string) {
    return this.prisma.routePlan.findMany({
      where: { orderId },
      orderBy: { sequence: 'asc' },
    });
  }

  async create(orderId: string, data: any) {
    const order = await this.prisma.repairOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('派单不存在');
    }

    const existingPlans = await this.prisma.routePlan.count({
      where: { orderId },
    });

    const plan = await this.prisma.routePlan.create({
      data: {
        ...data,
        orderId,
        sequence: existingPlans + 1,
        planDeparture: new Date(data.planDeparture),
        planArrival: new Date(data.planArrival),
      },
    });

    await this.updateRouteCache(orderId);

    return plan;
  }

  async update(id: string, data: any) {
    const plan = await this.prisma.routePlan.update({
      where: { id },
      data: {
        ...data,
        planDeparture: data.planDeparture ? new Date(data.planDeparture) : undefined,
        planArrival: data.planArrival ? new Date(data.planArrival) : undefined,
      },
    });

    await this.updateRouteCache(plan.orderId);

    return plan;
  }

  async remove(id: string) {
    const plan = await this.prisma.routePlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('路线计划不存在');
    }

    await this.prisma.routePlan.delete({ where: { id } });

    await this.updateRouteCache(plan.orderId);

    return { success: true };
  }

  async startRoute(id: string) {
    const plan = await this.prisma.routePlan.update({
      where: { id },
      data: {
        actualDeparture: new Date(),
        status: 'IN_PROGRESS',
      },
    });

    await this.updateRouteCache(plan.orderId);

    return plan;
  }

  async arriveRoute(id: string) {
    const plan = await this.prisma.routePlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('路线计划不存在');
    }

    if (plan.status !== 'IN_PROGRESS') {
      throw new BadRequestException('只有进行中的路线才能抵达');
    }

    const updated = await this.prisma.routePlan.update({
      where: { id },
      data: {
        actualArrival: new Date(),
        status: 'COMPLETED',
      },
    });

    await this.updateRouteCache(plan.orderId);

    return updated;
  }

  private async updateRouteCache(orderId: string) {
    const plans = await this.findByOrderId(orderId);
    await this.redis.set(`route:${orderId}`, JSON.stringify(plans), 600);
  }

  async reorder(orderId: string, orderIds: string[]) {
    const plans = await this.prisma.routePlan.findMany({
      where: { orderId },
      orderBy: { sequence: 'asc' },
    });

    if (plans.length !== orderIds.length) {
      throw new BadRequestException('路线计划数量不匹配');
    }

    for (let i = 0; i < orderIds.length; i++) {
      await this.prisma.routePlan.update({
        where: { id: orderIds[i] },
        data: { sequence: i + 1 },
      });
    }

    await this.updateRouteCache(orderId);

    return { success: true };
  }
}
