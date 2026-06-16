import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  const store1 = await prisma.store.upsert({
    where: { code: 'STORE-001' },
    update: {},
    create: { id: 'store-1', name: '仁济大药房·总店', code: 'STORE-001', address: '上海市黄浦区南京东路100号' },
  });

  const store2 = await prisma.store.upsert({
    where: { code: 'STORE-002' },
    update: {},
    create: { id: 'store-2', name: '仁济大药房·徐汇店', code: 'STORE-002', address: '上海市徐汇区漕溪北路50号' },
  });

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { id: 'user-admin', username: 'admin', password: passwordHash, name: '系统管理员', role: 'ADMIN', storeId: store1.id, storeName: store1.name },
  });

  const manager = await prisma.user.upsert({
    where: { username: 'zhangwei' },
    update: {},
    create: { id: 'user-mgr', username: 'zhangwei', password: passwordHash, name: '张伟', role: 'MANAGER', storeId: store1.id, storeName: store1.name },
  });

  const pharmacist1 = await prisma.user.upsert({
    where: { username: 'lina' },
    update: {},
    create: { id: 'user-pharm1', username: 'lina', password: passwordHash, name: '李娜', role: 'PHARMACIST', storeId: store1.id, storeName: store1.name },
  });

  const pharmacist2 = await prisma.user.upsert({
    where: { username: 'wangfang' },
    update: {},
    create: { id: 'user-pharm2', username: 'wangfang', password: passwordHash, name: '王芳', role: 'PHARMACIST', storeId: store2.id, storeName: store2.name },
  });

  const clerk = await prisma.user.upsert({
    where: { username: 'liuming' },
    update: {},
    create: { id: 'user-clerk', username: 'liuming', password: passwordHash, name: '刘明', role: 'CLERK', storeId: store1.id, storeName: store1.name },
  });

  const order1 = await prisma.replenishmentOrder.create({
    data: {
      id: 'order-1',
      orderNo: 'BH-2026-0001',
      storeId: store1.id,
      drugName: '阿莫西林胶囊',
      drugSpec: '0.5g×24粒/盒',
      manufacturer: '华北制药股份有限公司',
      quantity: 200,
      unitPrice: 12.5,
      totalAmount: 2500.0,
      orderDate: new Date('2026-06-10'),
      status: 'RECEIVED',
    },
  });

  const order2 = await prisma.replenishmentOrder.create({
    data: {
      id: 'order-2',
      orderNo: 'BH-2026-0002',
      storeId: store2.id,
      drugName: '布洛芬缓释胶囊',
      drugSpec: '0.3g×20粒/盒',
      manufacturer: '中美天津史克制药有限公司',
      quantity: 150,
      unitPrice: 18.0,
      totalAmount: 2700.0,
      orderDate: new Date('2026-06-11'),
      status: 'RECEIVED',
    },
  });

  const order3 = await prisma.replenishmentOrder.create({
    data: {
      id: 'order-3',
      orderNo: 'BH-2026-0003',
      storeId: store1.id,
      drugName: '硝苯地平控释片',
      drugSpec: '30mg×7片/盒',
      manufacturer: '拜耳医药保健有限公司',
      quantity: 100,
      unitPrice: 35.0,
      totalAmount: 3500.0,
      orderDate: new Date('2026-06-12'),
      status: 'PENDING',
    },
  });

  const order4 = await prisma.replenishmentOrder.create({
    data: {
      id: 'order-4',
      orderNo: 'BH-2026-0004',
      storeId: store2.id,
      drugName: '阿托伐他汀钙片',
      drugSpec: '20mg×7片/盒',
      manufacturer: '辉瑞制药有限公司',
      quantity: 80,
      unitPrice: 52.0,
      totalAmount: 4160.0,
      orderDate: new Date('2026-06-13'),
      status: 'RECEIVED',
    },
  });

  await prisma.insuranceRecord.create({
    data: {
      id: 'ins-1',
      transactionNo: 'YB-20260610-0001',
      patientName: '陈建国',
      patientId: '310101195501011234',
      insuranceType: '城镇职工基本医疗保险',
      drugName: '阿莫西林胶囊',
      quantity: 2,
      amount: 25.0,
      transactionDate: new Date('2026-06-10'),
      replenishmentOrderId: order1.id,
    },
  });

  await prisma.insuranceRecord.create({
    data: {
      id: 'ins-2',
      transactionNo: 'YB-20260611-0002',
      patientName: '赵丽华',
      patientId: '310104196203025678',
      insuranceType: '城乡居民基本医疗保险',
      drugName: '布洛芬缓释胶囊',
      quantity: 3,
      amount: 54.0,
      transactionDate: new Date('2026-06-11'),
      replenishmentOrderId: order2.id,
    },
  });

  await prisma.prescriptionPhoto.create({
    data: {
      id: 'presc-1',
      fileName: '处方_陈建国_20260610.jpg',
      fileUrl: '/uploads/prescriptions/presc_001.jpg',
      isClear: true,
      riskLevel: 'LOW',
      ocrText: '阿莫西林胶囊 0.5g×24粒 2盒 口服 每日3次 每次1粒',
      replenishmentOrderId: order1.id,
    },
  });

  await prisma.prescriptionPhoto.create({
    data: {
      id: 'presc-2',
      fileName: '处方_赵丽华_20260611.jpg',
      fileUrl: '/uploads/prescriptions/presc_002.jpg',
      isClear: false,
      riskLevel: 'HIGH',
      ocrText: '布洛芬缓释胶囊 0.3g...（部分字迹模糊）',
      replenishmentOrderId: order2.id,
    },
  });

  const task1 = await prisma.followUpTask.create({
    data: {
      id: 'task-1',
      taskNo: 'HF-2026-0001',
      replenishmentOrderId: order1.id,
      drugName: '阿莫西林胶囊',
      storeId: store1.id,
      storeName: store1.name,
      assigneeId: clerk.id,
      assigneeName: clerk.name,
      status: 'IN_PROGRESS',
      riskLevel: 'LOW',
    },
  });

  const task2 = await prisma.followUpTask.create({
    data: {
      id: 'task-2',
      taskNo: 'HF-2026-0002',
      replenishmentOrderId: order2.id,
      drugName: '布洛芬缓释胶囊',
      storeId: store2.id,
      storeName: store2.name,
      assigneeId: pharmacist2.id,
      assigneeName: pharmacist2.name,
      status: 'IN_PROGRESS',
      riskLevel: 'HIGH',
    },
  });

  const task3 = await prisma.followUpTask.create({
    data: {
      id: 'task-3',
      taskNo: 'HF-2026-0003',
      replenishmentOrderId: order3.id,
      drugName: '硝苯地平控释片',
      storeId: store1.id,
      storeName: store1.name,
      assigneeId: pharmacist1.id,
      assigneeName: pharmacist1.name,
      status: 'PENDING',
      riskLevel: 'MEDIUM',
    },
  });

  const task4 = await prisma.followUpTask.create({
    data: {
      id: 'task-4',
      taskNo: 'HF-2026-0004',
      replenishmentOrderId: order4.id,
      drugName: '阿托伐他汀钙片',
      storeId: store2.id,
      storeName: store2.name,
      assigneeId: pharmacist2.id,
      assigneeName: pharmacist2.name,
      status: 'COMPLETED',
      riskLevel: 'LOW',
      completedAt: new Date('2026-06-14'),
    },
  });

  const task5 = await prisma.followUpTask.create({
    data: {
      id: 'task-5',
      taskNo: 'HF-2026-0005',
      replenishmentOrderId: order1.id,
      drugName: '阿莫西林胶囊',
      storeId: store1.id,
      storeName: store1.name,
      assigneeId: clerk.id,
      assigneeName: clerk.name,
      status: 'ESCALATED',
      riskLevel: 'HIGH',
    },
  });

  await prisma.pharmacistOpinion.create({
    data: {
      id: 'po-1',
      followUpTaskId: task1.id,
      pharmacistId: pharmacist1.id,
      pharmacistName: pharmacist1.name,
      opinion: '用药方案合理，阿莫西林用量符合标准，建议患者餐后服用以减少胃肠不适。',
      isApproved: true,
      reviewedAt: new Date('2026-06-12'),
    },
  });

  await prisma.batchExpiryRecord.create({
    data: {
      id: 'be-1',
      followUpTaskId: task1.id,
      batchNo: 'HB20260301',
      productionDate: new Date('2026-03-01'),
      expiryDate: new Date('2028-03-01'),
      shelfLife: '24个月',
      verifiedBy: pharmacist1.name,
      verifiedAt: new Date('2026-06-12'),
    },
  });

  await prisma.reviewNote.createMany({
    data: [
      {
        id: 'note-1',
        followUpTaskId: task1.id,
        authorId: clerk.id,
        authorName: clerk.name,
        authorRole: 'CLERK',
        type: 'COMMUNICATION',
        content: '已电话联系患者陈建国，确认用药情况正常，无明显不良反应。',
        createdAt: new Date('2026-06-11T10:30:00'),
      },
      {
        id: 'note-2',
        followUpTaskId: task1.id,
        authorId: pharmacist1.id,
        authorName: pharmacist1.name,
        authorRole: 'PHARMACIST',
        type: 'REVIEW',
        content: '复核通过，医保流水与处方信息一致，患者用药规范。',
        createdAt: new Date('2026-06-12T14:00:00'),
      },
      {
        id: 'note-3',
        followUpTaskId: task2.id,
        authorId: pharmacist2.id,
        authorName: pharmacist2.name,
        authorRole: 'PHARMACIST',
        type: 'COMMUNICATION',
        content: '处方照片字迹模糊，无法确认具体剂量，需要联系医院重新获取处方。',
        createdAt: new Date('2026-06-12T09:00:00'),
      },
      {
        id: 'note-4',
        followUpTaskId: task2.id,
        authorId: manager.id,
        authorName: manager.name,
        authorRole: 'MANAGER',
        type: 'REVIEW',
        content: '处方不清属高风险事项，请尽快联系开具医院核实处方内容，务必在3个工作日内完成。',
        createdAt: new Date('2026-06-12T11:00:00'),
      },
      {
        id: 'note-5',
        followUpTaskId: task5.id,
        authorId: clerk.id,
        authorName: clerk.name,
        authorRole: 'CLERK',
        type: 'COMMUNICATION',
        content: '患者反馈服药后出现皮疹，已建议停药并就医。',
        createdAt: new Date('2026-06-13T16:00:00'),
      },
    ],
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
