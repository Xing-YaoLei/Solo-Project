import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import {
  generateMockFunnelData,
  generateMockDispatchDurationData,
  getRouteList as generateMockRoutes,
  getMockSystemConfig as generateMockSystemConfig,
} from '@/lib/mockData'
import type {
  FunnelResponse,
  FunnelDataPoint,
  DispatchDurationResponse,
  DispatchDurationPoint,
  SystemConfig,
} from '@/types'

interface OrderWhereClause extends Prisma.OrderWhereInput {
  createdAt: {
    gte: Date
    lte: Date
  }
  routeId?: string
  dispatchDuration?: Prisma.IntFilter | number | null
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }
  if (typeof value === 'object' && value !== null) {
    const v = value as { toNumber?: () => number }
    if (typeof v.toNumber === 'function') {
      try {
        return v.toNumber()
      } catch {
        return 0
      }
    }
  }
  return 0
}

export class FunnelService {
  static async getFunnelData(params: {
    startDate: string
    endDate: string
    routeId?: string
  }): Promise<FunnelResponse> {
    const { startDate, endDate, routeId } = params

    try {
      const where: OrderWhereClause = {
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

      const totalBudget = orders.reduce((sum: number, o: {
        subsidyRule?: { baseSubsidy?: unknown } | null
      }) => {
        return sum + toNumber(o.subsidyRule?.baseSubsidy)
      }, 0)

      const appealedOrders = orders.filter((o: { appeal?: unknown | null }) => !!o.appeal)
      const appealedAmount = appealedOrders.reduce((sum: number, o: {
        subsidyAmount?: unknown
      }) => {
        return sum + toNumber(o.subsidyAmount)
      }, 0)

      const settledPayments = orders.filter((o: {
        payment?: { status?: string } | null
      }) => o.payment?.status === 'success')
      const settledAmount = settledPayments.reduce((sum: number, o: {
        payment?: { settlementAmount?: unknown } | null
      }) => {
        return sum + toNumber(o.payment?.settlementAmount)
      }, 0)

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
          conversionRate:
            appealedOrders.length > 0
              ? settledPayments.length / appealedOrders.length
              : 0,
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
    } catch (error) {
      return generateMockFunnelData({ startDate, endDate, routeId })
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

    try {
      const where: OrderWhereClause = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate + 'T23:59:59'),
        },
        dispatchDuration: { not: 0 },
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

      let threshold = 1800
      try {
        const config = await prisma.systemConfig.findFirst()
        threshold = config?.dispatchDurationThreshold ?? 1800
      } catch {
        threshold = 1800
      }

      const groupedData = new Map<
        string,
        {
          durations: number[]
          count: number
          timeoutCount: number
        }
      >()

      for (const order of orders) {
        const duration = toNumber(order.dispatchDuration)
        if (!duration) continue

        const date = new Date(order.createdAt as string | Date)
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
        group.durations.push(duration)
        group.count++
        if (duration > threshold) {
          group.timeoutCount++
        }
      }

      const data: DispatchDurationPoint[] = Array.from(groupedData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, group]) => ({
          date,
          avgDuration: Math.round(
            group.durations.reduce((a: number, b: number) => a + b, 0) / group.count
          ),
          maxDuration: Math.max(...group.durations),
          minDuration: Math.min(...group.durations),
          orderCount: group.count,
          timeoutCount: group.timeoutCount,
          routeId,
        }))

      const allDurations = orders
        .map((o: { dispatchDuration?: unknown }) => toNumber(o.dispatchDuration))
        .filter((d: number): d is number => d > 0)
      const avgOverall =
        allDurations.length > 0
          ? Math.round(
              allDurations.reduce((a: number, b: number) => a + b, 0) /
                allDurations.length
            )
          : 0
      const timeoutRate =
        allDurations.length > 0
          ? allDurations.filter((d: number) => d > threshold).length /
            allDurations.length
          : 0

      return {
        data,
        threshold,
        avgOverall,
        timeoutRate,
      }
    } catch (error) {
      return generateMockDispatchDurationData({
        startDate,
        endDate,
        routeId,
        granularity,
      })
    }
  }

  static async getRouteList(): Promise<{ id: string; name: string }[]> {
    try {
      const routes = await prisma.order.findMany({
        distinct: ['routeId', 'routeName'],
        select: {
          routeId: true,
          routeName: true,
        },
      })

      const routeMap = new Map<string, string>()
      for (const r of routes) {
        if (r.routeId && r.routeName && !routeMap.has(r.routeId)) {
          routeMap.set(r.routeId, r.routeName)
        }
      }

      return Array.from(routeMap.entries()).map(([id, name]) => ({ id, name }))
    } catch (error) {
      return generateMockRoutes()
    }
  }

  static async getSystemConfig(): Promise<SystemConfig> {
    try {
      const config = await prisma.systemConfig.findFirst()
      if (!config) {
        const created = await prisma.systemConfig.create({
          data: {
            dispatchDurationThreshold: 1800,
            autoCreateTaskOnTimeout: true,
            autoCreateTaskOnDamage: true,
          },
        })
        return created as unknown as SystemConfig
      }
      return config as unknown as SystemConfig
    } catch (error) {
      return generateMockSystemConfig()
    }
  }

  static async updateSystemConfig(data: {
    dispatchDurationThreshold?: number
    autoCreateTaskOnTimeout?: boolean
    autoCreateTaskOnDamage?: boolean
  }): Promise<SystemConfig> {
    try {
      const config = await this.getSystemConfig()
      const updated = await prisma.systemConfig.update({
        where: { id: config.id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      })
      return updated as unknown as SystemConfig
    } catch (error) {
      const current = generateMockSystemConfig()
      return {
        ...current,
        ...data,
        updatedAt: new Date(),
      }
    }
  }
}
