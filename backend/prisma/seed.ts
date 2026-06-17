import { PrismaClient, OrderSource, OrderStatus, DelayReason, ReviewTag } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始播种数据...');

  const repairPersons = await Promise.all([
    prisma.repairPerson.upsert({
      where: { phone: '13800138001' },
      update: {},
      create: {
        name: '张师傅',
        phone: '13800138001',
        skill: '水电维修',
        status: 'AVAILABLE',
      },
    }),
    prisma.repairPerson.upsert({
      where: { phone: '13800138002' },
      update: {},
      create: {
        name: '李师傅',
        phone: '13800138002',
        skill: '木工维修',
        status: 'AVAILABLE',
      },
    }),
    prisma.repairPerson.upsert({
      where: { phone: '13800138003' },
      update: {},
      create: {
        name: '王师傅',
        phone: '13800138003',
        skill: '管道疏通',
        status: 'AVAILABLE',
      },
    }),
    prisma.repairPerson.upsert({
      where: { phone: '13800138004' },
      update: {},
      create: {
        name: '赵师傅',
        phone: '13800138004',
        skill: '电器维修',
        status: 'AVAILABLE',
      },
    }),
  ]);

  console.log('维修人员数据已创建');

  const materials = await Promise.all([
    prisma.material.upsert({
      where: { sku: 'MAT001' },
      update: {},
      create: {
        name: '水龙头',
        sku: 'MAT001',
        unit: '个',
        price: 85.5,
        stock: 50,
        isCommon: true,
        category: '卫浴配件',
      },
    }),
    prisma.material.upsert({
      where: { sku: 'MAT002' },
      update: {},
      create: {
        name: '节能灯炮',
        sku: 'MAT002',
        unit: '只',
        price: 25.0,
        stock: 100,
        isCommon: true,
        category: '电气配件',
      },
    }),
    prisma.material.upsert({
      where: { sku: 'MAT003' },
      update: {},
      create: {
        name: 'PVC管道',
        sku: 'MAT003',
        unit: '米',
        price: 45.0,
        stock: 200,
        isCommon: true,
        category: '管道配件',
      },
    }),
    prisma.material.upsert({
      where: { sku: 'MAT004' },
      update: {},
      create: {
        name: '密封胶带',
        sku: 'MAT004',
        unit: '卷',
        price: 15.0,
        stock: 80,
        isCommon: true,
        category: '工具耗材',
      },
    }),
    prisma.material.upsert({
      where: { sku: 'MAT005' },
      update: {},
      create: {
        name: '门锁',
        sku: 'MAT005',
        unit: '套',
        price: 180.0,
        stock: 20,
        isCommon: false,
        category: '门窗配件',
      },
    }),
    prisma.material.upsert({
      where: { sku: 'MAT006' },
      update: {},
      create: {
        name: '空气开关',
        sku: 'MAT006',
        unit: '个',
        price: 65.0,
        stock: 30,
        isCommon: true,
        category: '电气配件',
      },
    }),
  ]);

  console.log('材料数据已创建');

  const today = new Date();
  
  for (let i = 0; i < 15; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - Math.floor(Math.random() * 10));
    
    const sourceValues = Object.values(OrderSource);
    const statusValues = Object.values(OrderStatus);
    
    const source = sourceValues[Math.floor(Math.random() * sourceValues.length)];
    const statusIndex = Math.floor(Math.random() * statusValues.length);
    const status = statusValues[statusIndex];
    
    const person = repairPersons[Math.floor(Math.random() * repairPersons.length)];
    
    const planStart = new Date(date);
    planStart.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);
    
    const planEnd = new Date(planStart);
    planEnd.setHours(planEnd.getHours() + 1 + Math.floor(Math.random() * 3));

    const order = await prisma.repairOrder.create({
      data: {
        orderNo: `WX${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        source,
        apartmentNo: `${Math.floor(Math.random() * 30) + 1}0${Math.floor(Math.random() * 9) + 1}`,
        tenantName: ['王先生', '李女士', '张先生', '刘女士', '陈先生', '赵女士'][Math.floor(Math.random() * 6)],
        tenantPhone: `139${Math.floor(Math.random() * 90000000) + 10000000}`,
        faultType: ['水管漏水', '电路故障', '门锁损坏', '家电维修', '墙面修补', '管道堵塞'][Math.floor(Math.random() * 6)],
        faultDesc: '报修内容描述，具体故障情况需要现场勘察确认。',
        status: status === OrderStatus.CREATED && i < 5 ? OrderStatus.CREATED : status,
        priority: Math.floor(Math.random() * 3) + 1,
        assignPersonId: status === OrderStatus.CREATED && i < 5 ? null : person.id,
        planStartTime: status === OrderStatus.CREATED && i < 5 ? null : planStart,
        planEndTime: status === OrderStatus.CREATED && i < 5 ? null : planEnd,
        actualStartTime: status === OrderStatus.CREATED || status === OrderStatus.ASSIGNED ? null : planStart,
        actualEndTime: status === OrderStatus.CLOSED || status === OrderStatus.COMPLETED ? planEnd : null,
        isOnTime: status === OrderStatus.CLOSED || status === OrderStatus.COMPLETED ? Math.random() > 0.3 : null,
        reviewTags: status === OrderStatus.CLOSED ? [ReviewTag.ON_TIME] : [],
        closeTime: status === OrderStatus.CLOSED ? planEnd : null,
        closeRemark: status === OrderStatus.CLOSED ? '维修完成，客户满意' : null,
        createdAt: date,
      },
    });

    if (status !== OrderStatus.CREATED && i < 3) {
      await prisma.statusLog.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.CREATED,
          toStatus: OrderStatus.ASSIGNED,
          operatorId: 'system',
          remark: '系统自动分派',
        },
      });

      if (status !== OrderStatus.ASSIGNED) {
        await prisma.statusLog.create({
          data: {
            orderId: order.id,
            fromStatus: OrderStatus.ASSIGNED,
            toStatus: OrderStatus.IN_PROGRESS,
            operatorId: person.id,
            remark: '开始维修',
          },
        });
      }
    }

    if (i < 5 && status !== OrderStatus.CREATED && status !== OrderStatus.ASSIGNED) {
      const material = materials[Math.floor(Math.random() * materials.length)];
      await prisma.orderMaterial.create({
        data: {
          orderId: order.id,
          materialId: material.id,
          quantity: Math.floor(Math.random() * 3) + 1,
          usedAt: new Date(),
        },
      });
    }

    if (status === OrderStatus.CLOSED && i < 8) {
      await prisma.signoffProof.create({
        data: {
          orderId: order.id,
          signature: '客户签名',
          photoUrls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
          remark: '维修完成，客户确认签收',
          signedBy: person.name,
          signedAt: planEnd,
        },
      });
    }

    if (Math.random() > 0.7 && status !== OrderStatus.CREATED) {
      const delayReasons = Object.values(DelayReason);
      const reason = delayReasons[Math.floor(Math.random() * delayReasons.length)];
      
      await prisma.delayRecord.create({
        data: {
          orderId: order.id,
          reason,
          detail: '延误原因详细描述',
          duration: Math.floor(Math.random() * 60) + 15,
          reporterId: person.id,
        },
      });
    }

    if (status !== OrderStatus.CREATED) {
      await prisma.routePlan.create({
        data: {
          orderId: order.id,
          sequence: 1,
          fromLocation: '维修中心',
          toLocation: order.apartmentNo,
          planDeparture: planStart,
          planArrival: new Date(planStart.getTime() + 30 * 60000),
          actualDeparture: status === OrderStatus.IN_PROGRESS || status === OrderStatus.COMPLETED || status === OrderStatus.CLOSED ? planStart : null,
          actualArrival: status === OrderStatus.COMPLETED || status === OrderStatus.CLOSED ? new Date(planStart.getTime() + 30 * 60000) : null,
          distanceKm: 3.5 + Math.random() * 5,
          status: status === OrderStatus.CREATED || status === OrderStatus.ASSIGNED ? 'PLANNED' : 
                  status === OrderStatus.IN_PROGRESS ? 'IN_PROGRESS' : 'COMPLETED',
        },
      });
    }
  }

  console.log('派单数据已创建');
  console.log('数据播种完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
