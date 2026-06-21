import prisma from '@/lib/prisma'
import { getMockConclusions, createMockConclusion } from '@/lib/mockData'
import type { Conclusion, ChartType } from '@/types'

export class ConclusionService {
  static async createConclusion(data: {
    orderId: string
    taskId?: string
    chartPointId: string
    chartType: ChartType
    content: string
    authorId: string
    authorName: string
    attachments?: string[]
  }): Promise<Conclusion> {
    try {
      const conclusion = await prisma.conclusion.create({
        data: {
          orderId: data.orderId,
          taskId: data.taskId,
          chartPointId: data.chartPointId,
          chartType: data.chartType,
          content: data.content,
          authorId: data.authorId,
          authorName: data.authorName,
          attachments: data.attachments || [],
        },
      })
      return conclusion as unknown as Conclusion
    } catch (error) {
      return createMockConclusion(data)
    }
  }

  static async getConclusionsByChartPoint(
    chartPointId: string,
    chartType: ChartType
  ): Promise<Conclusion[]> {
    try {
      const conclusions = await prisma.conclusion.findMany({
        where: {
          chartPointId,
          chartType,
        },
        orderBy: { createdAt: 'desc' },
      })
      return conclusions as unknown as Conclusion[]
    } catch (error) {
      return getMockConclusions({ chartPointId, chartType })
    }
  }

  static async getConclusionsByOrder(orderId: string): Promise<Conclusion[]> {
    try {
      const conclusions = await prisma.conclusion.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      })
      return conclusions as unknown as Conclusion[]
    } catch (error) {
      return getMockConclusions({ orderId })
    }
  }

  static async getConclusionsByTask(taskId: string): Promise<Conclusion | null> {
    try {
      const conclusion = await prisma.conclusion.findFirst({
        where: { taskId },
      })
      return conclusion as unknown as Conclusion | null
    } catch (error) {
      const list = getMockConclusions({ taskId })
      return list[0] || null
    }
  }

  static async updateConclusion(
    id: string,
    data: {
      content?: string
      attachments?: string[]
    }
  ): Promise<Conclusion | null> {
    try {
      const conclusion = await prisma.conclusion.update({
        where: { id },
        data,
      })
      return conclusion as unknown as Conclusion
    } catch (error) {
      const list = getMockConclusions({})
      const found = list.find((c: Conclusion) => c.id === id)
      if (found) {
        Object.assign(found, data)
      }
      return found || null
    }
  }

  static async deleteConclusion(id: string): Promise<boolean> {
    try {
      await prisma.conclusion.delete({ where: { id } })
      return true
    } catch {
      return false
    }
  }

  static async getRecentConclusions(limit: number = 10): Promise<Conclusion[]> {
    try {
      const conclusions = await prisma.conclusion.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderNo: true,
              routeName: true,
            },
          },
        },
      })
      return conclusions as unknown as Conclusion[]
    } catch (error) {
      return getMockConclusions({}).slice(0, limit)
    }
  }
}
