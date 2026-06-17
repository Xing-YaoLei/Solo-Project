import { prisma, UserRole, PropertyStatus, TaskType, TaskStatus, Priority, ContractStatus, MaintenanceStatus } from './index'

async function main() {
  console.log('Start seeding...')

  const admin = await prisma.user.upsert({
    where: { email: 'admin@rental.com' },
    update: {},
    create: {
      email: 'admin@rental.com',
      name: '系统管理员',
      phone: '13800000000',
      role: UserRole.ADMIN,
      department: '总部',
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@rental.com' },
    update: {},
    create: {
      email: 'manager@rental.com',
      name: '张管家',
      phone: '13800000001',
      role: UserRole.PROPERTY_MANAGER,
      department: '运营部',
    },
  })

  const maintenance = await prisma.user.upsert({
    where: { email: 'worker@rental.com' },
    update: {},
    create: {
      email: 'worker@rental.com',
      name: '李维修',
      phone: '13800000002',
      role: UserRole.MAINTENANCE_WORKER,
      department: '维修部',
    },
  })

  const finance = await prisma.user.upsert({
    where: { email: 'finance@rental.com' },
    update: {},
    create: {
      email: 'finance@rental.com',
      name: '王财务',
      phone: '13800000003',
      role: UserRole.FINANCE,
      department: '财务部',
    },
  })

  const frontline = await prisma.user.upsert({
    where: { email: 'frontline@rental.com' },
    update: {},
    create: {
      email: 'frontline@rental.com',
      name: '赵一线',
      phone: '13800000004',
      role: UserRole.FRONTLINE,
      department: '一线处理',
    },
  })

  const tenantUser = await prisma.user.upsert({
    where: { email: 'tenant@rental.com' },
    update: {},
    create: {
      email: 'tenant@rental.com',
      name: '陈租客',
      phone: '13900000001',
      role: UserRole.TENANT,
    },
  })

  const properties = []
  for (let i = 1; i <= 10; i++) {
    const property = await prisma.property.upsert({
      where: { propertyNo: `PROP${String(i).padStart(4, '0')}` },
      update: {},
      create: {
        propertyNo: `PROP${String(i).padStart(4, '0')}`,
        title: `精品公寓 ${i} 号房`,
        address: `朝阳区建国路${88 + i}号`,
        city: '北京',
        district: i <= 5 ? '朝阳区' : '海淀区',
        building: `${i}号楼`,
        roomNo: `${i}01室`,
        area: 45 + i * 5,
        bedrooms: i % 3 === 0 ? 2 : 1,
        bathrooms: 1,
        floor: i,
        totalFloors: 20,
        orientation: i % 2 === 0 ? '南' : '东',
        decoration: '精装修',
        monthlyRent: 3000 + i * 500,
        deposit: 6000 + i * 1000,
        status: i % 4 === 0 ? PropertyStatus.VACANT : i % 4 === 1 ? PropertyStatus.OCCUPIED : i % 4 === 2 ? PropertyStatus.LISTING : PropertyStatus.MAINTENANCE,
        description: `这是一间位于${i <= 5 ? '朝阳' : '海淀'}区的精品公寓，交通便利，配套齐全。`,
        creatorId: admin.id,
        managerId: manager.id,
      },
    })
    properties.push(property)

    for (let j = 1; j <= 5; j++) {
      await prisma.propertyPhoto.create({
        data: {
          propertyId: property.id,
          url: `https://picsum.photos/800/600?random=${i * 10 + j}`,
          thumbnail: `https://picsum.photos/200/150?random=${i * 10 + j}`,
          title: j === 1 ? '客厅' : j === 2 ? '卧室' : j === 3 ? '厨房' : j === 4 ? '卫生间' : '阳台',
          sortOrder: j,
          isCover: j === 1,
          category: j <= 2 ? 'interior' : 'other',
        },
      })
    }
  }

  const tenant = await prisma.tenant.upsert({
    where: { phone: '13900000001' },
    update: {},
    create: {
      name: '陈租客',
      idCardNo: '110101199001011234',
      phone: '13900000001',
      email: 'tenant@rental.com',
      gender: '男',
      birthday: new Date('1990-01-01'),
      occupation: '软件工程师',
      company: '科技有限公司',
      emergencyContact: '陈先生',
      emergencyPhone: '13900000002',
      userId: tenantUser.id,
      propertyId: properties[0].id,
      remarks: '优质租客，按时交租',
    },
  })

  const contract = await prisma.contract.upsert({
    where: { contractNo: 'CT20240001' },
    update: {},
    create: {
      contractNo: 'CT20240001',
      version: 1,
      versionNote: '初始版本',
      status: ContractStatus.ACTIVE,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01'),
      monthlyRent: 3500,
      deposit: 7000,
      paymentCycle: 'MONTHLY',
      paymentDay: 1,
      terms: {
        petAllowed: false,
        smokingAllowed: false,
        subletAllowed: false,
        noticePeriod: 30,
      },
      signedAt: new Date('2024-01-01'),
      propertyId: properties[0].id,
      tenantId: tenant.id,
      createdById: manager.id,
    },
  })

  const taskTypes = [
    { type: TaskType.PROPERTY_LISTING, title: '房源上架审核', desc: '待审核房源信息及照片' },
    { type: TaskType.RENT_OVERDUE, title: '租金逾期处理', desc: '租金已逾期，请及时处理' },
    { type: TaskType.MAINTENANCE, title: '维修工单处理', desc: '卫生间漏水需要维修' },
    { type: TaskType.CONTRACT_REVIEW, title: '合同续签审核', desc: '合同即将到期，待审核续签' },
    { type: TaskType.UTILITY_READING, title: '水电读数录入', desc: '本月水电读数待录入' },
  ]

  for (let i = 0; i < 8; i++) {
    const typeInfo = taskTypes[i % taskTypes.length]
    const statuses = [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.OVERDUE]
    const priorities = [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT]

    await prisma.task.create({
      data: {
        taskNo: `TASK${String(20240001 + i).padStart(8, '0')}`,
        type: typeInfo.type,
        title: `${typeInfo.title} - ${i + 1}`,
        description: typeInfo.desc,
        status: statuses[i % statuses.length],
        priority: priorities[i % priorities.length],
        dueDate: new Date(Date.now() + (i - 2) * 86400000),
        propertyId: properties[i % properties.length].id,
        assigneeId: i % 3 === 0 ? manager.id : i % 3 === 1 ? maintenance.id : finance.id,
        creatorId: admin.id,
        tenantId: i % 2 === 0 ? tenant.id : null,
        contractId: i % 2 === 0 ? contract.id : null,
      },
    })
  }

  for (let i = 0; i < 5; i++) {
    await prisma.maintenanceRecord.create({
      data: {
        propertyId: properties[i].id,
        type: i % 3 === 0 ? '水电' : i % 3 === 1 ? '家具' : '家电',
        description: `${i % 3 === 0 ? '水管漏水' : i % 3 === 1 ? '衣柜损坏' : '空调不制冷'}，需要维修`,
        cost: 200 + i * 100,
        status: i % 2 === 0 ? 'OPEN' : 'COMPLETED',
        reportedAt: new Date(Date.now() - i * 86400000),
      },
    })
  }

  const maintenanceRecords = await prisma.maintenanceRecord.findMany()
  for (let i = 0; i < Math.min(3, maintenanceRecords.length); i++) {
    const record = maintenanceRecords[i]
    await prisma.maintenanceWorkOrder.create({
      data: {
        recordId: record.id,
        workerId: maintenance.id,
        creatorId: manager.id,
        priority: i === 0 ? Priority.HIGH : Priority.MEDIUM,
        status: i === 0 ? MaintenanceStatus.IN_PROGRESS : MaintenanceStatus.COMPLETED,
        description: record.description,
        solution: i !== 0 ? '已维修完成' : null,
        cost: i !== 0 ? 200 + i * 100 : null,
        completedAt: i !== 0 ? new Date() : null,
      },
    })
  }

  for (let m = 0; m < 6; m++) {
    const isOverdue = m >= 4
    await prisma.financeRecord.create({
      data: {
        recordNo: `FIN2024${String(m + 1).padStart(6, '0')}`,
        type: 'RENT',
        amount: properties[m % properties.length].monthlyRent || 3500,
        direction: 'INCOME',
        status: isOverdue ? 'OVERDUE' : m === 3 ? 'PENDING' : 'PAID',
        dueDate: isOverdue ? new Date(Date.now() - (m - 3) * 5 * 86400000) : new Date(2024, m, 1),
        paidAt: !isOverdue && m !== 3 ? new Date(2024, m, 3) : null,
        remark: isOverdue ? `租金逾期 ${m - 3} 个月` : `${m + 1}月租金`,
        propertyId: properties[m % properties.length].id,
        tenantId: tenant.id,
        contractId: contract.id,
        createdById: finance.id,
      },
    })
  }

  for (let m = 0; m < 3; m++) {
    await prisma.financeRecord.create({
      data: {
        recordNo: `FIN2024EXP${String(m + 1).padStart(6, '0')}`,
        type: m === 0 ? 'MAINTENANCE_FEE' : m === 1 ? 'UTILITY_FEE' : 'OTHER',
        amount: 500 + m * 200,
        direction: 'EXPENSE',
        status: 'PAID',
        dueDate: new Date(2024, m, 1),
        paidAt: new Date(2024, m, 2),
        remark: m === 0 ? '维修费用' : m === 1 ? '水电费用' : '其他支出',
        propertyId: properties[m].id,
        createdById: finance.id,
      },
    })
  }

  const overdueFinanceRecords = await prisma.financeRecord.findMany({
    where: { status: 'OVERDUE' },
  })
  for (const finRecord of overdueFinanceRecords) {
    const daysOverdue = Math.floor(
      (Date.now() - (finRecord.dueDate?.getTime() || Date.now())) / (1000 * 60 * 60 * 24),
    )
    await prisma.task.updateMany({
      where: {
        type: TaskType.RENT_OVERDUE,
        tenantId: finRecord.tenantId,
        status: TaskStatus.PENDING,
      },
      data: {
        type: TaskType.RENT_OVERDUE,
      },
    })
  }

  for (let i = 0; i < 3; i++) {
    for (let m = 1; m <= 3; m++) {
      const baseReading = 100 + i * 50 + m * 10
      await prisma.utilityReading.create({
        data: {
          propertyId: properties[i].id,
          type: 'ELECTRIC',
          reading: baseReading,
          previousReading: baseReading - 30 - m * 5,
          usage: 30 + m * 5,
          readingDate: new Date(2024, m - 1, 15),
          recordedById: frontline.id,
        },
      })

      await prisma.utilityReading.create({
        data: {
          propertyId: properties[i].id,
          type: 'WATER',
          reading: 20 + i * 10 + m * 2,
          previousReading: 15 + i * 10 + m * 2,
          usage: 5 + m,
          readingDate: new Date(2024, m - 1, 15),
          recordedById: frontline.id,
        },
      })
    }
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
