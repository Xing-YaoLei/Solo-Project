import type {
  MiniProgramOrder,
  MerchantTransaction,
  CameraStatistic,
} from "./types"

export function deduplicateOrders(
  orders: MiniProgramOrder[]
): MiniProgramOrder[] {
  const seen = new Set<string>()
  return orders.filter((order) => {
    if (seen.has(order.orderNo)) return false
    seen.add(order.orderNo)
    return true
  })
}

export function deduplicateTransactions(
  transactions: MerchantTransaction[]
): MerchantTransaction[] {
  const seen = new Set<string>()
  return transactions.filter((tx) => {
    if (seen.has(tx.transactionNo)) return false
    seen.add(tx.transactionNo)
    return true
  })
}

export interface CaliberMatchedRecord {
  cameraStatistic: CameraStatistic
  matchedOrders: MiniProgramOrder[]
  visitDate: Date
  visitorCount: number
  orderVisitorCount: number
}

export function matchCaliber(
  cameraStats: CameraStatistic[],
  orders: MiniProgramOrder[]
): CaliberMatchedRecord[] {
  return cameraStats.map((stat) => {
    const statDate = new Date(stat.recordedAt)
    const statDayStart = new Date(statDate.getFullYear(), statDate.getMonth(), statDate.getDate())
    const statDayEnd = new Date(statDayStart.getTime() + 86400000)

    const matchedOrders = orders.filter((order) => {
      const visitDate = new Date(order.visitDate)
      return visitDate >= statDayStart && visitDate < statDayEnd
    })

    const orderVisitorCount = matchedOrders.reduce(
      (sum, order) => sum + order.visitorCount,
      0
    )

    return {
      cameraStatistic: stat,
      matchedOrders,
      visitDate: statDayStart,
      visitorCount: stat.visitorCount,
      orderVisitorCount,
    }
  })
}

export type DataCleaningType = "order" | "transaction" | "caliber"

export interface CleaningResult<T> {
  originalCount: number
  cleanedCount: number
  data: T
}

export function cleanAndValidate(
  data: {
    orders?: MiniProgramOrder[]
    transactions?: MerchantTransaction[]
    cameraStats?: CameraStatistic[]
  },
  type: DataCleaningType
): CleaningResult<
  MiniProgramOrder[] | MerchantTransaction[] | CaliberMatchedRecord[]
> {
  switch (type) {
    case "order": {
      const orders = data.orders ?? []
      const cleaned = deduplicateOrders(orders)
      return { originalCount: orders.length, cleanedCount: cleaned.length, data: cleaned }
    }
    case "transaction": {
      const transactions = data.transactions ?? []
      const cleaned = deduplicateTransactions(transactions)
      return { originalCount: transactions.length, cleanedCount: cleaned.length, data: cleaned }
    }
    case "caliber": {
      const cameraStats = data.cameraStats ?? []
      const orders = data.orders ?? []
      const dedupedOrders = deduplicateOrders(orders)
      const result = matchCaliber(cameraStats, dedupedOrders)
      return { originalCount: cameraStats.length, cleanedCount: result.length, data: result }
    }
  }
}
