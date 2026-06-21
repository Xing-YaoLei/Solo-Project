import prisma from '@/lib/prisma'
import type { FunnelResponse, FunnelDataPoint, DispatchDurationResponse, DispatchDurationPoint } from '@/types'

export class FunnelService {
  static async getFunnelData(params: {
    startDate: string
    endDate: string
    routeId?: string
  }): Promise<FunnelResponse> {
    const { startDate, endDate, routeId } = params
    
    const where: any = {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59'),
      },
    }
    if (routeId) where.routeId = routeId

    const orders = await prisma.order.findMany({
      where,
      include: {
        payment: true,
        appeal: true,
        subsidyRule: true,
      },
    })

    const totalBudget = orders.reduce((sum, o) => {
      const baseSubsidy = o.subsidyRule?.baseSubsidy?.toNumber() || 0
      return sum + baseSubsidy
    }, 0)

    const appealedOrders = orders.filter(o => o.appeal)
    const appealedAmount = appealedOrders.reduce((sum, o) => sum + (o.subsidyAmount?.toNumber() || 0), 0)

    const settledPayments = orders.filter(o => o.payment?.status === 'success')
    const settledAmount = settledPayments.reduce((sum, o) => sum + (o.payment?.settlementAmount?.toNumber() || 0), 0)

    const overallConversion = totalBudget > 0 ? settledAmount / totalBudget : 0

    const stages: FunnelDataPoint[] = [
      {
        stage: 'subsidy_rules',
        stageLabel: '补贴规则',
        count: orders.length,
        amount: totalBudget,
        conversionRate: 1,
        date: startDate,
        routeId,
      },
      {
        stage: 'appeals',
        stageLabel: '申诉证据',
        count: appealedOrders.length,
        amount: appealedAmount,
        conversionRate: orders.length > 0 ? appealedOrders.length / orders.length : 0,
        date: startDate,
        routeId,
      },
      {
        stage: 'settlements',
        stageLabel: '结算明细',
        count: settledPayments.length,
        amount: settledAmount,
        conversionRate: appealedOrders.length > 0 ? settledPayments.length / appealedOrders.length : 0,
        date: startDate,
        routeId,
      },
    ]

    return {
      data: stages,
      summary: {
        totalBudget,
        appealedAmount,
        settledAmount,
        overallConversion,
      },
    }
  }

  static async getDispatchDurationData(params: {
    startDate: string
    endDate: string
    routeId?: string
    granularity?: 'hour' | 'day' | 'week'
  }): Promise<DispatchDurationResponse> {
    const { startDate, endDate, routeId } = params
    const granularity = params.granularity || 'day'

    const where: any = {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59'),
      },
      dispatchDuration: { not: null },
    }
    if (routeId) where.routeId = routeId

    const orders = await prisma.order.findMany({
      where,
      select: {
        createdAt: true,
        dispatchDuration: true,
        routeId: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const config = await prisma.systemConfig.findFirst()
    const threshold = config?.dispatchDurationThreshold || 1800

    const groupedData = new Map<string, {
      durations: number[]
      count: number
      timeoutCount: number
    }>()

    for (const order of orders) {
      if (!order.dispatchDuration) continue
      
      const date = new Date(order.createdAt)
      let key: string
      
      if (granularity === 'hour') {
        key = date.toISOString().substring(0, 13) + ':00:00'
      } else if (granularity === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
      } else {
        key = date.toISOString().split('T')[0]
      }

      if (!groupedData.has(key)) {
        groupedData.set(key, { durations: [], count: 0, timeoutCount: 0 })
      }
      
      const group = groupedData.get(key)!
      group.durations.push(order.dispatchDuration)
      group.count++
      if (order.dispatchDuration > threshold) {
        group.timeoutCount++
      }
    }

    const data: DispatchDurationPoint[] = Array.from(groupedData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, group]) => ({
        date,
        avgDuration: Math.round(group.durations.reduce((a, b) => a + b, 0) / group.count),
        maxDuration: Math.max(...group.durations),
        minDuration: Math.min(...group.durations),
        orderCount: group.count,
        timeoutCount: group.timeoutCount,
        routeId,
      }))

    const allDurations = orders.map(o => o.dispatchDuration!).filter(Boolean)
    const avgOverall = allDurations.length > 0
      ? Math.round(allDurations.reduce((a, b) => a + b, 0) / allDurations.length)
      : 0
    const timeoutRate = allDurations.length > 0
      ? allDurations.filter(d => d > threshold).length / allDurations.length
      : 0

    return {
      data,
      threshold,
      avgOverall,
      timeoutRate,
    }
  }

  static async getRouteList(): Promise<{ id: string; name: string }[]> {
    const routes = await prisma.order.findMany({
      distinct: ['routeId', 'routeName'],
      select: {
        routeId: true,
        routeName: true,
      },
      where: {
        routeId: { not: null },
        routeName: { not: null },
      },
    })
    
    return routes.map(r => ({
      id: r.routeId,
      name: r.routeName,
    })).filter((r, i, arr) => 
      arr.findIndex(x => x.id === r.id) === i
    )
  }

  static async getSystemConfig() {
    const config = await prisma.systemConfig.findFirst()
    if (!config) {
      return prisma.systemConfig.create({
        data: {
          dispatchDurationThreshold: 1800,
          autoCreateTaskOnTimeout: true,
          autoCreateTaskOnDamage: true,
        },
      })
    }
    return config
  }

  static async updateSystemConfig(data: {
    dispatchDurationThreshold?: number
    autoCreateTaskOnTimeout?: boolean
    autoCreateTaskOnDamage?: boolean
  }) {
    const config = await this.getSystemConfig()
    return prisma.systemConfig.update({
      where: { id: config.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })
  }
}
