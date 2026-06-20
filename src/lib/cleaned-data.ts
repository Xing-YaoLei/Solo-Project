import prisma from "@/lib/prisma"
import {
  deduplicateOrders,
  deduplicateTransactions,
  matchCaliber,
  type CaliberMatchedRecord,
} from "@/lib/data-cleaning"
import type {
  MiniProgramOrder,
  MerchantTransaction,
  CameraStatistic,
} from "@/lib/types"

export async function getCleanedOrders(
  scenicAreaId: string
): Promise<MiniProgramOrder[]> {
  const orders = await prisma.miniProgramOrder.findMany({
    where: { scenicAreaId },
  })
  return deduplicateOrders(orders as MiniProgramOrder[])
}

export async function getCleanedTransactions(
  scenicAreaId: string
): Promise<MerchantTransaction[]> {
  const transactions = await prisma.merchantTransaction.findMany({
    where: { scenicAreaId },
  })
  return deduplicateTransactions(transactions as MerchantTransaction[])
}

export async function getCleanedCameraStats(
  scenicAreaId: string
): Promise<CameraStatistic[]> {
  const stats = await prisma.cameraStatistic.findMany({
    where: { scenicAreaId },
  })
  return stats as CameraStatistic[]
}

export async function getCaliberMatchedData(
  scenicAreaId: string
): Promise<CaliberMatchedRecord[]> {
  const [orders, cameraStats] = await Promise.all([
    prisma.miniProgramOrder.findMany({ where: { scenicAreaId } }),
    prisma.cameraStatistic.findMany({ where: { scenicAreaId } }),
  ])
  const dedupedOrders = deduplicateOrders(orders as MiniProgramOrder[])
  return matchCaliber(
    cameraStats as CameraStatistic[],
    dedupedOrders
  )
}

export async function getCleanedOrdersForRoute(
  scenicAreaId: string,
  routeId: string
): Promise<MiniProgramOrder[]> {
  const orders = await prisma.miniProgramOrder.findMany({
    where: { scenicAreaId, routeId },
  })
  return deduplicateOrders(orders as MiniProgramOrder[])
}

export async function getCleanedTransactionsForStop(
  stopId: string
): Promise<MerchantTransaction[]> {
  const transactions = await prisma.merchantTransaction.findMany({
    where: { stopId },
  })
  return deduplicateTransactions(transactions as MerchantTransaction[])
}
