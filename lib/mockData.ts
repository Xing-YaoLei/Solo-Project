import { subDays, addMinutes, formatISO } from 'date-fns'
import type {
  FunnelResponse,
  DispatchDurationResponse,
  Order,
  OrderDetail,
  Task,
  Conclusion,
  Payment,
  CustomerServiceRecord,
  SystemConfig,
  TaskStatus,
  TaskType,
  TaskPriority,
  DamageLevel,
  ChartType,
} from '@/types'

const ROUTES = [
  { id: 'route-001', name: '朝阳区-海淀区' },
  { id: 'route-002', name: '西城区-东城区' },
  { id: 'route-003', name: '丰台区-石景山' },
  { id: 'route-004', name: '通州区-大兴区' },
]

const RIDERS = ['张三', '李四', '王五', '赵六', '钱七', '孙八']
const CUSTOMERS = ['客户A', '客户B', '客户C', '客户D', '客户E', '客户F']
const ITEMS = ['文件资料', '电子产品', '餐饮食品', '鲜花礼品', '医药用品', '日用百货']

let mockSystemConfig: SystemConfig = {
  id: 'config-001',
  dispatchDurationThreshold: 1800,
  autoCreateTaskOnTimeout: true,
  autoCreateTaskOnDamage: true,
  updatedAt: new Date(),
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateMockFunnelData(params: {
  startDate: string
  endDate: string
  routeId?: string
}): FunnelResponse {
  const totalOrders = randomBetween(800, 1200)
  const appealOrders = Math.floor(totalOrders * randomBetween(0.25, 0.4))
  const settledOrders = Math.floor(appealOrders * randomBetween(0.6, 0.85))

  const totalBudget = totalOrders * randomBetween(15, 25)
  const appealedAmount = appealOrders * randomBetween(15, 25)
  const settledAmount = settledOrders * randomBetween(12, 22)

  const overallConversion = totalBudget > 0 ? settledAmount / totalBudget : 0

  return {
    data: [
      {
        stage: 'subsidy_rules',
        stageLabel: '补贴规则',
        count: totalOrders,
        amount: totalBudget,
        conversionRate: 1,
        date: params.startDate,
        routeId: params.routeId,
      },
      {
        stage: 'appeals',
        stageLabel: '申诉证据',
        count: appealOrders,
        amount: appealedAmount,
        conversionRate: totalOrders > 0 ? appealOrders / totalOrders : 0,
        date: params.startDate,
        routeId: params.routeId,
      },
      {
        stage: 'settlements',
        stageLabel: '结算明细',
        count: settledOrders,
        amount: settledAmount,
        conversionRate: appealOrders > 0 ? settledOrders / appealOrders : 0,
        date: params.startDate,
        routeId: params.routeId,
      },
    ],
    summary: {
      totalBudget,
      appealedAmount,
      settledAmount,
      overallConversion,
    },
  }
}

export function generateMockDispatchDurationData(params: {
  startDate: string
  endDate: string
  routeId?: string
  granularity?: 'hour' | 'day' | 'week'
}): DispatchDurationResponse {
  const threshold = mockSystemConfig.dispatchDurationThreshold
  const days = params.granularity === 'week' ? 4 : params.granularity === 'hour' ? 7 : 30
  const data = []

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const orderCount = randomBetween(20, 50)
    const avgDuration = randomBetween(900, 2400)
    const timeoutCount = Math.floor(orderCount * randomBetween(0.1, 0.35))

    data.push({
      date: formatISO(date, { representation: 'date' }),
      avgDuration,
      maxDuration: avgDuration + randomBetween(300, 900),
      minDuration: Math.max(300, avgDuration - randomBetween(300, 600)),
      orderCount,
      timeoutCount,
      routeId: params.routeId,
    })
  }

  const allDurations = data.map(d => d.avgDuration)
  const avgOverall = Math.round(allDurations.reduce((a, b) => a + b, 0) / allDurations.length)
  const totalOrders = data.reduce((a, b) => a + b.orderCount, 0)
  const totalTimeouts = data.reduce((a, b) => a + b.timeoutCount, 0)
  const timeoutRate = totalOrders > 0 ? totalTimeouts / totalOrders : 0

  return {
    data,
    threshold,
    avgOverall,
    timeoutRate,
  }
}

export function getMockSystemConfig(): SystemConfig {
  return mockSystemConfig
}

export function updateMockSystemConfig(data: Partial<SystemConfig>): SystemConfig {
  mockSystemConfig = {
    ...mockSystemConfig,
    ...data,
    updatedAt: new Date(),
  }
  return mockSystemConfig
}

function createMockOrder(index: number): Order {
  const route = randomElement(ROUTES)
  const createdAt = subDays(new Date(), randomBetween(0, 30))
  const acceptedAt = addMinutes(createdAt, randomBetween(1, 10))
  const dispatchDuration = randomBetween(600, 3600)
  const pickedAt = addMinutes(acceptedAt, Math.floor(dispatchDuration / 60))
  const deliveredAt = addMinutes(pickedAt, randomBetween(15, 45))
  const hasItemDamage = Math.random() < 0.15
  const damageLevel: DamageLevel | undefined = hasItemDamage
    ? randomElement(['minor', 'moderate', 'severe'])
    : undefined

  return {
    id: generateId(),
    orderNo: `ORD${Date.now().toString(36).toUpperCase()}${index}`,
    routeId: route.id,
    routeName: route.name,
    amount: randomBetween(50, 500),
    subsidyAmount: randomBetween(10, 50),
    itemDescription: randomElement(ITEMS),
    hasItemDamage,
    itemDamageLevel: damageLevel,
    status: 'delivered',
    createdAt,
    acceptedAt,
    pickedAt,
    deliveredAt,
    dispatchDuration,
    riderId: `rider-${randomBetween(1, 50)}`,
    riderName: randomElement(RIDERS),
    customerId: `customer-${randomBetween(1, 100)}`,
    customerName: randomElement(CUSTOMERS),
    paymentId: generateId(),
    appealId: Math.random() < 0.3 ? generateId() : undefined,
  }
}

const mockOrders: Order[] = Array.from({ length: 100 }, (_, i) => createMockOrder(i))

export function getMockOrders(params: {
  page: number
  pageSize: number
  status?: string
  routeId?: string
  hasItemDamage?: boolean
  hasDispatchTimeout?: boolean
}): { orders: Order[]; total: number } {
  let filtered = [...mockOrders]
  
  if (params.status) {
    filtered = filtered.filter(o => o.status === params.status)
  }
  if (params.routeId) {
    filtered = filtered.filter(o => o.routeId === params.routeId)
  }
  if (params.hasItemDamage !== undefined) {
    filtered = filtered.filter(o => o.hasItemDamage === params.hasItemDamage)
  }
  if (params.hasDispatchTimeout) {
    filtered = filtered.filter(o => (o.dispatchDuration || 0) > mockSystemConfig.dispatchDurationThreshold)
  }

  const total = filtered.length
  const start = (params.page - 1) * params.pageSize
  const orders = filtered.slice(start, start + params.pageSize)

  return { orders, total }
}

export function getMockOrderDetail(id: string): OrderDetail | null {
  const order = mockOrders.find(o => o.id === id) || mockOrders[0]
  if (!order) return null

  const payment: Payment = {
    id: order.paymentId || generateId(),
    orderId: order.id,
    transactionNo: `TXN${Date.now().toString(36).toUpperCase()}`,
    amount: order.amount,
    subsidyAmount: order.subsidyAmount,
    settlementAmount: order.amount - order.subsidyAmount,
    paymentMethod: '微信支付',
    status: 'success',
    paidAt: order.createdAt,
    settlementDate: order.createdAt,
    abnormalDeduction: Math.random() < 0.2 ? randomBetween(5, 30) : undefined,
    deductionReason: Math.random() < 0.2 ? '超时扣减' : undefined,
    createdAt: order.createdAt,
    updatedAt: order.createdAt,
  }

  const csRecords: CustomerServiceRecord[] = [
    {
      id: generateId(),
      orderId: order.id,
      ticketNo: `CS${Date.now().toString(36).toUpperCase()}`,
      type: order.hasItemDamage ? 'damage_report' : randomElement(['complaint', 'appeal', 'inquiry']),
      content: order.hasItemDamage ? '客户反馈物品损坏，要求赔偿' : '客户咨询订单状态',
      chatHistory: {
        messages: [
          { time: order.createdAt, from: 'customer', content: '您好，我的订单有问题' },
          { time: order.createdAt, from: 'operator', content: '您好，请问有什么可以帮您？' },
          { time: order.createdAt, from: 'customer', content: order.hasItemDamage ? '物品收到时已经损坏了' : '为什么还没送到？' },
        ],
      },
      operatorId: 'op-001',
      operatorName: '客服小王',
      createdAt: order.createdAt,
      closedAt: addMinutes(order.createdAt, 30),
      status: 'closed',
    },
  ]

  const tasks: Task[] = []
  if (order.hasItemDamage || (order.dispatchDuration || 0) > mockSystemConfig.dispatchDurationThreshold) {
    tasks.push({
      id: generateId(),
      orderId: order.id,
      type: order.hasItemDamage ? 'item_damage' : 'dispatch_timeout',
      priority: order.itemDamageLevel === 'severe' || (order.dispatchDuration || 0) > 3000 ? 'high' : 'medium',
      status: randomElement(['pending', 'processing', 'resolved']),
      title: order.hasItemDamage ? `物品损坏 - ${order.itemDamageLevel === 'severe' ? '严重' : order.itemDamageLevel === 'moderate' ? '中度' : '轻微'}` : `派单超时 - 超出${Math.floor(((order.dispatchDuration || 0) - mockSystemConfig.dispatchDurationThreshold) / 60)}分钟`,
      description: order.hasItemDamage ? '订单报告物品损坏，需要审核处理' : '派单时长超出阈值，需要核实原因',
      dispatchDuration: order.dispatchDuration,
      damageLevel: order.itemDamageLevel,
      createdAt: order.createdAt,
      resolvedAt: Math.random() < 0.5 ? order.createdAt : undefined,
      resolution: Math.random() < 0.5 ? '已核实情况，给予客户补偿' : undefined,
    })
  }

  const conclusions: Conclusion[] = [
    {
      id: generateId(),
      orderId: order.id,
      chartPointId: `funnel-appeals-${order.routeId}`,
      chartType: 'funnel',
      content: '该订单为典型的超时情况，主要原因是该时段该路线运力紧张，建议在高峰时段增加该区域骑手数量。',
      authorId: 'analyst-001',
      authorName: '分析师小李',
      createdAt: order.createdAt,
      attachments: [],
    },
  ]

  return {
    ...order,
    payment,
    appeal: order.appealId ? {
      id: order.appealId,
      orderId: order.id,
      type: order.hasItemDamage ? 'damage' : 'late_dispatch',
      reason: order.hasItemDamage ? '物品损坏，申请赔偿' : '配送超时，申请补贴',
      evidenceUrls: ['https://example.com/evidence1.jpg', 'https://example.com/evidence2.jpg'],
      status: randomElement(['pending', 'approved', 'rejected']),
      reviewerId: 'reviewer-001',
      reviewComment: '情况属实，同意申请',
      reviewedAt: addMinutes(order.createdAt, 60),
      createdAt: order.createdAt,
    } : undefined,
    customerServiceRecs: csRecords,
    tasks,
    conclusions,
  }
}

const mockTasks: Task[] = Array.from({ length: 25 }, (_, i) => {
  const order = mockOrders[i % mockOrders.length]
  const hasTimeout = (order.dispatchDuration || 0) > mockSystemConfig.dispatchDurationThreshold
  const type: TaskType = order.hasItemDamage && !hasTimeout ? 'item_damage' : 
                       !order.hasItemDamage && hasTimeout ? 'dispatch_timeout' :
                       randomElement(['item_damage', 'dispatch_timeout'])
  
  return {
    id: generateId(),
    orderId: order.id,
    type,
    priority: randomElement(['low', 'medium', 'high']),
    status: randomElement(['pending', 'pending', 'processing', 'resolved', 'closed']),
    title: type === 'item_damage' 
      ? `物品损坏 - ${order.itemDamageLevel === 'severe' ? '严重' : order.itemDamageLevel === 'moderate' ? '中度' : '轻微'}`
      : `派单超时 - 超出${Math.floor(Math.max(0, (order.dispatchDuration || 1800) - mockSystemConfig.dispatchDurationThreshold) / 60)}分钟`,
    description: type === 'item_damage' ? '订单报告物品损坏，需要审核处理' : '派单时长超出阈值，需要核实原因',
    assigneeId: Math.random() < 0.5 ? 'auditor-001' : undefined,
    assigneeName: Math.random() < 0.5 ? '审核员小张' : undefined,
    dispatchDuration: order.dispatchDuration,
    damageLevel: order.itemDamageLevel,
    createdAt: subDays(new Date(), randomBetween(0, 7)),
    resolvedAt: randomBetween(0, 1) === 0 ? undefined : subDays(new Date(), randomBetween(0, 5)),
    resolution: randomBetween(0, 1) === 0 ? undefined : '已核实情况，给予处理',
  }
})

export function getMockTasks(params: {
  page: number
  pageSize: number
  status?: TaskStatus
  type?: TaskType
  priority?: TaskPriority
}): { tasks: Task[]; total: number } {
  let filtered = [...mockTasks]
  
  if (params.status) {
    filtered = filtered.filter(t => t.status === params.status)
  }
  if (params.type) {
    filtered = filtered.filter(t => t.type === params.type)
  }
  if (params.priority) {
    filtered = filtered.filter(t => t.priority === params.priority)
  }

  const total = filtered.length
  const start = (params.page - 1) * params.pageSize
  const tasks = filtered.slice(start, start + params.pageSize)

  return { tasks, total }
}

export function getMockTaskDetail(id: string): Task | null {
  const task = mockTasks.find(t => t.id === id) || mockTasks[0]
  return task || null
}

export function updateMockTask(id: string, data: Partial<Task>): Task | null {
  const index = mockTasks.findIndex(t => t.id === id)
  if (index === -1) return null
  mockTasks[index] = { ...mockTasks[index], ...data }
  return mockTasks[index]
}

export function resolveMockTask(id: string, resolution: string): Task | null {
  const index = mockTasks.findIndex(t => t.id === id)
  if (index === -1) return null
  mockTasks[index] = {
    ...mockTasks[index],
    status: 'resolved',
    resolution,
    resolvedAt: new Date(),
  }
  return mockTasks[index]
}

export function createMockTask(data: {
  orderId: string
  type: TaskType
  priority?: TaskPriority
  title: string
  description?: string
  dispatchDuration?: number
  damageLevel?: DamageLevel
}): Task {
  const task: Task = {
    id: generateId(),
    orderId: data.orderId,
    type: data.type,
    priority: data.priority || 'medium',
    status: 'pending',
    title: data.title,
    description: data.description || null,
    dispatchDuration: data.dispatchDuration || null,
    damageLevel: data.damageLevel || null,
    assigneeId: null,
    assigneeName: null,
    resolution: null,
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  mockTasks.unshift(task)
  return task
}

const mockConclusions: Conclusion[] = Array.from({ length: 15 }, (_, i) => {
  const order = mockOrders[i % mockOrders.length]
  return {
    id: generateId(),
    orderId: order.id,
    chartPointId: `funnel-${randomElement(['subsidy_rules', 'appeals', 'settlements'])}-${order.routeId}`,
    chartType: randomElement(['funnel', 'dispatch_trend']),
    content: randomElement([
      '该区域在晚高峰时段运力不足，建议增加骑手排班。',
      '物品损坏主要发生在餐饮类订单，建议优化包装方式。',
      '派单超时与天气因素相关，雨天超时率显著上升。',
      '申诉通过率偏低，需要优化申诉流程。',
      '补贴计算规则需要调整，部分路线补贴过高。',
    ]),
    authorId: `analyst-${randomBetween(1, 5)}`,
    authorName: randomElement(['分析师小李', '分析师小王', '分析师小张']),
    createdAt: subDays(new Date(), randomBetween(0, 30)),
    attachments: [],
  }
})

export function getMockConclusions(params: {
  chartPointId?: string
  chartType?: ChartType
  orderId?: string
  taskId?: string
}): Conclusion[] {
  let filtered = [...mockConclusions]
  
  if (params.chartPointId && params.chartType) {
    filtered = filtered.filter(
      c => c.chartPointId === params.chartPointId && c.chartType === params.chartType
    )
  }
  if (params.orderId) {
    filtered = filtered.filter(c => c.orderId === params.orderId)
  }
  if (params.taskId) {
    filtered = filtered.filter(c => c.taskId === params.taskId)
  }

  return filtered.slice(0, 20)
}

export function createMockConclusion(data: Omit<Conclusion, 'id' | 'createdAt'>): Conclusion {
  const conclusion: Conclusion = {
    id: generateId(),
    createdAt: new Date(),
    ...data,
  }
  mockConclusions.unshift(conclusion)
  return conclusion
}

export function getMockPayments(orderId?: string): { data: Payment[]; total: number } {
  const payments: Payment[] = mockOrders
    .filter(o => !orderId || o.id === orderId)
    .slice(0, 50)
    .map(order => ({
      id: generateId(),
      orderId: order.id,
      transactionNo: `TXN${Date.now().toString(36).toUpperCase()}${Math.random()}`,
      amount: order.amount,
      subsidyAmount: order.subsidyAmount,
      settlementAmount: order.amount - order.subsidyAmount,
      paymentMethod: randomElement(['微信支付', '支付宝', '银行卡']),
      status: randomElement(['success', 'success', 'success', 'pending', 'refunded']),
      paidAt: order.createdAt,
      settlementDate: order.createdAt,
      abnormalDeduction: Math.random() < 0.15 ? randomBetween(5, 50) : undefined,
      deductionReason: Math.random() < 0.15 ? '异常扣减' : undefined,
      createdAt: order.createdAt,
      updatedAt: order.createdAt,
    }))

  return { data: payments, total: payments.length }
}

export function getMockCustomerServiceRecords(orderId?: string): { data: CustomerServiceRecord[]; total: number } {
  const records: CustomerServiceRecord[] = mockOrders
    .filter(o => !orderId || o.id === orderId)
    .slice(0, 30)
    .map(order => ({
      id: generateId(),
      orderId: order.id,
      ticketNo: `CS${Date.now().toString(36).toUpperCase()}${Math.random()}`,
      type: randomElement(['complaint', 'appeal', 'inquiry', 'damage_report']),
      content: randomElement([
        '客户反馈配送超时',
        '客户反馈物品损坏',
        '客户咨询订单状态',
        '客户申请补贴',
        '客户投诉骑手服务态度',
      ]),
      chatHistory: {
        messages: [
          { from: 'customer', content: '有问题需要反馈', time: order.createdAt },
          { from: 'operator', content: '您好，请详细描述问题', time: order.createdAt },
        ],
      },
      operatorId: `op-${randomBetween(1, 20)}`,
      operatorName: randomElement(['客服小王', '客服小李', '客服小张']),
      createdAt: order.createdAt,
      closedAt: Math.random() < 0.8 ? addMinutes(order.createdAt, randomBetween(10, 60)) : undefined,
      status: Math.random() < 0.8 ? 'closed' : 'open',
    }))

  return { data: records, total: records.length }
}

export function getRouteList(): { id: string; name: string }[] {
  return ROUTES
}
