import { PrismaClient, DamageLevel, OrderStatus, TaskType, TaskPriority, TaskStatus, AppealType, AppealStatus, CsType, CsStatus } from '@prisma/client'
import { subDays, addMinutes } from 'date-fns'

const prisma = new PrismaClient()

const ROUTES = [
  { id: 'route-001', name: '朝阳区-海淀区' },
  { id: 'route-002', name: '西城区-东城区' },
  { id: 'route-003', name: '丰台区-石景山' },
  { id: 'route-004', name: '通州区-大兴区' },
]

const RIDERS = ['张三', '李四', '王五', '赵六', '钱七', '孙八']
const CUSTOMERS = ['客户A', '客户B', '客户C', '客户D', '客户E', '客户F']
const ITEMS = ['文件资料', '电子产品', '餐饮食品', '鲜花礼品', '医药用品', '日用百货']

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {
  console.log('开始播种数据...')

  await prisma.systemConfig.upsert({
    where: { id: 'config-001' },
    update: {},
    create: {
      id: 'config-001',
      dispatchDurationThreshold: 1800,
      autoCreateTaskOnTimeout: true,
      autoCreateTaskOnDamage: true,
    },
  })

  for (const route of ROUTES) {
    await prisma.subsidyRule.upsert({
      where: { id: `rule-${route.id}` },
      update: {},
      create: {
        id: `rule-${route.id}`,
        routeId: route.id,
        routeName: route.name,
        baseSubsidy: randomBetween(10, 20),
        distanceMultiplier: 0.5,
        timeMultiplier: 0.3,
        peakHourBonus: 5,
        minSubsidy: 8,
        maxSubsidy: 50,
        effectiveFrom: subDays(new Date(), 365),
        isActive: true,
      },
    })
  }

  for (let i = 0; i < 100; i++) {
    const route = randomElement(ROUTES)
    const createdAt = subDays(new Date(), randomBetween(0, 30))
    const acceptedAt = addMinutes(createdAt, randomBetween(1, 10))
    const dispatchDuration = randomBetween(600, 3600)
    const pickedAt = addMinutes(acceptedAt, Math.floor(dispatchDuration / 60))
    const deliveredAt = addMinutes(pickedAt, randomBetween(15, 45))
    const hasItemDamage = Math.random() < 0.15
    const damageLevel: DamageLevel | null = hasItemDamage
      ? randomElement([DamageLevel.minor, DamageLevel.moderate, DamageLevel.severe])
      : null

    const orderId = generateId()
    const paymentId = generateId()
    const appealId = Math.random() < 0.3 ? generateId() : null

    await prisma.order.create({
      data: {
        id: orderId,
        orderNo: `ORD${Date.now().toString(36).toUpperCase()}${i}`,
        routeId: route.id,
        routeName: route.name,
        amount: randomBetween(50, 500),
        subsidyAmount: randomBetween(10, 50),
        itemDescription: randomElement(ITEMS),
        hasItemDamage,
        itemDamageLevel: damageLevel,
        status: OrderStatus.delivered,
        createdAt,
        acceptedAt,
        pickedAt,
        deliveredAt,
        dispatchDuration,
        riderId: `rider-${randomBetween(1, 50)}`,
        riderName: randomElement(RIDERS),
        customerId: `customer-${randomBetween(1, 100)}`,
        customerName: randomElement(CUSTOMERS),
        paymentId,
        appealId,
        payment: {
          create: {
            id: paymentId,
            transactionNo: `TXN${Date.now().toString(36).toUpperCase()}`,
            amount: randomBetween(50, 500),
            subsidyAmount: randomBetween(10, 50),
            settlementAmount: randomBetween(40, 480),
            paymentMethod: '微信支付',
            status: 'success',
            paidAt: createdAt,
            settlementDate: createdAt,
          },
        },
        customerServiceRecs: {
          create: {
            id: generateId(),
            ticketNo: `CS${Date.now().toString(36).toUpperCase()}`,
            type: hasItemDamage ? CsType.damage_report : randomElement([CsType.complaint, CsType.appeal, CsType.inquiry]),
            content: hasItemDamage ? '客户反馈物品损坏，要求赔偿' : '客户咨询订单状态',
            chatHistory: {
              messages: [
                { time: createdAt.toISOString(), from: 'customer', content: '您好，我的订单有问题' },
                { time: createdAt.toISOString(), from: 'operator', content: '您好，请问有什么可以帮您？' },
                { time: createdAt.toISOString(), from: 'customer', content: hasItemDamage ? '物品收到时已经损坏了' : '为什么还没送到？' },
              ],
            },
            operatorId: 'op-001',
            operatorName: '客服小王',
            status: CsStatus.closed,
            closedAt: addMinutes(createdAt, 30),
          },
        },
        ...(appealId ? {
          appeal: {
            create: {
              id: appealId,
              type: hasItemDamage ? AppealType.damage : AppealType.late_dispatch,
              reason: hasItemDamage ? '物品损坏，申请赔偿' : '配送超时，申请补贴',
              evidenceUrls: ['https://example.com/evidence1.jpg', 'https://example.com/evidence2.jpg'],
              status: randomElement([AppealStatus.pending, AppealStatus.approved, AppealStatus.rejected]),
              reviewerId: 'reviewer-001',
              reviewComment: '情况属实，同意申请',
              reviewedAt: addMinutes(createdAt, 60),
            },
          },
        } : {}),
      },
    })

    if (hasItemDamage || dispatchDuration > 1800) {
      await prisma.task.create({
        data: {
          id: generateId(),
          orderId,
          type: hasItemDamage ? TaskType.item_damage : TaskType.dispatch_timeout,
          priority: damageLevel === DamageLevel.severe || dispatchDuration > 3000 ? TaskPriority.high : TaskPriority.medium,
          status: randomElement([TaskStatus.pending, TaskStatus.processing, TaskStatus.resolved]),
          title: hasItemDamage
            ? `物品损坏 - ${damageLevel === DamageLevel.severe ? '严重' : damageLevel === DamageLevel.moderate ? '中度' : '轻微'}`
            : `派单超时 - 超出${Math.floor((dispatchDuration - 1800) / 60)}分钟`,
          description: hasItemDamage ? '订单报告物品损坏，需要审核处理' : '派单时长超出阈值，需要核实原因',
          dispatchDuration: dispatchDuration > 1800 ? dispatchDuration : null,
          damageLevel: hasItemDamage ? damageLevel : null,
          assigneeId: Math.random() < 0.5 ? 'auditor-001' : null,
          assigneeName: Math.random() < 0.5 ? '审核员小张' : null,
        },
      })
    }
  }

  console.log('数据播种完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
