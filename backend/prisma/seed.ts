import { PrismaClient, UserRole, TaskType, TaskStatus, DisputeStatus, ReminderType, ReminderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  await prisma.reminder.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.taskImage.deleteMany();
  await prisma.quoteVersion.deleteMany();
  await prisma.confirmationVersion.deleteMany();
  await prisma.confirmationTask.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.report.deleteMany();

  console.log('创建用户...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      phone: '13800000000',
      password: hashedPassword,
      name: '系统管理员',
      role: UserRole.ADMIN,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  });

  const projectManager = await prisma.user.create({
    data: {
      email: 'chenweiming@example.com',
      phone: '13800000001',
      password: hashedPassword,
      name: '陈伟明',
      role: UserRole.PROJECT_MANAGER,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pm',
    },
  });

  const foreman = await prisma.user.create({
    data: {
      email: 'lijianguo@example.com',
      phone: '13800000002',
      password: hashedPassword,
      name: '李建国',
      role: UserRole.FOREMAN,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=foreman',
    },
  });

  const designer = await prisma.user.create({
    data: {
      email: 'wangxiaoya@example.com',
      phone: '13800000003',
      password: hashedPassword,
      name: '王小雅',
      role: UserRole.DESIGNER,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=designer',
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      email: 'zhaoziqiang@example.com',
      phone: '13800000004',
      password: hashedPassword,
      name: '赵自强',
      role: UserRole.SUPERVISOR,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=supervisor',
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: 'zhangmingyuan@example.com',
      phone: '13900000001',
      password: hashedPassword,
      name: '张明远',
      role: UserRole.OWNER,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner',
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      email: 'liuhongmei@example.com',
      phone: '13900000002',
      password: hashedPassword,
      name: '刘红梅',
      role: UserRole.OWNER,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner2',
    },
  });

  console.log('创建项目...');

  const project1 = await prisma.project.create({
    data: {
      name: '阳光花园 3栋 1802',
      address: '北京市朝阳区阳光花园3号楼1802室',
      description: '三室两厅两卫，精装修',
      ownerId: owner.id,
      projectManagerId: projectManager.id,
      status: 'IN_PROGRESS',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-07-15'),
      totalBudget: 280000,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: '翠湖天地 5栋 601',
      address: '北京市海淀区翠湖天地5号楼601室',
      description: '两室一厅一卫，简约风格',
      ownerId: owner2.id,
      projectManagerId: projectManager.id,
      status: 'IN_PROGRESS',
      startDate: new Date('2024-02-20'),
      endDate: new Date('2024-08-20'),
      totalBudget: 180000,
    },
  });

  console.log('创建确认任务...');

  const task1 = await prisma.confirmationTask.create({
    data: {
      projectId: project1.id,
      title: '水电改造节点验收',
      type: TaskType.NODE_ACCEPTANCE,
      status: TaskStatus.APPROVED,
      description: '水电改造工程已完成，请业主验收。\n\n主要工作内容：\n1. 强电线路改造\n2. 弱电线路改造\n3. 给排水管道改造\n4. 防水处理',
      nodeName: '水电验收',
      location: '全屋',
      assignedToId: owner.id,
      createdById: foreman.id,
      confirmedAt: new Date('2024-02-10'),
      confirmedById: owner.id,
      deadline: new Date('2024-02-12'),
    },
  });

  const task2 = await prisma.confirmationTask.create({
    data: {
      projectId: project1.id,
      title: '客厅吊顶设计变更',
      type: TaskType.DESIGN_CHANGE,
      status: TaskStatus.PENDING,
      description: '根据业主需求，将客厅吊顶从平顶改为悬浮吊顶，增加灯带效果。\n\n变更内容：\n1. 吊顶高度下调 5cm\n2. 增加 LED 灯带一圈\n3. 增加射灯 4 盏',
      nodeName: '木工阶段',
      location: '客厅',
      assignedToId: owner.id,
      createdById: designer.id,
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  const task3 = await prisma.confirmationTask.create({
    data: {
      projectId: project1.id,
      title: '地砖材料替换',
      type: TaskType.MATERIAL_REPLACEMENT,
      status: TaskStatus.PENDING,
      description: '原计划使用的东鹏瓷砖 800x800 抛光砖缺货，建议替换为同档次的马可波罗瓷砖。\n\n原材料：东鹏陶瓷 抛光砖 800x800 米白色\n新材料：马可波罗 全抛釉 800x800 米黄色\n价格差异：+8元/平米',
      nodeName: '瓦工阶段',
      location: '客餐厅',
      assignedToId: owner.id,
      createdById: foreman.id,
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
  });

  const task4 = await prisma.confirmationTask.create({
    data: {
      projectId: project1.id,
      title: '定制衣柜增项报价',
      type: TaskType.ADDITIONAL_QUOTE,
      status: TaskStatus.DISPUTED,
      description: '业主提出增加主卧定制衣柜，现提供报价如下：\n\n衣柜规格：\n- 宽度：2.4米\n- 高度：2.8米\n- 深度：0.6米\n- 材质：E0级颗粒板\n- 门型：平板门',
      nodeName: '定制阶段',
      location: '主卧',
      amount: 12800,
      assignedToId: owner.id,
      createdById: designer.id,
      deadline: new Date('2024-03-01'),
    },
  });

  const task5 = await prisma.confirmationTask.create({
    data: {
      projectId: project1.id,
      title: '瓦工节点验收',
      type: TaskType.NODE_ACCEPTANCE,
      status: TaskStatus.REJECTED,
      description: '瓦工施工已完成，请业主验收。\n\n完成内容：\n1. 厨房墙砖地砖铺贴\n2. 卫生间墙砖地砖铺贴\n3. 客餐厅地砖铺贴\n4. 阳台地砖铺贴',
      nodeName: '瓦工验收',
      location: '厨卫+客餐厅',
      assignedToId: owner.id,
      createdById: foreman.id,
      deadline: new Date('2024-03-10'),
      confirmedAt: new Date('2024-03-08'),
      confirmedById: owner.id,
    },
  });

  const task6 = await prisma.confirmationTask.create({
    data: {
      projectId: project2.id,
      title: '开工交底确认',
      type: TaskType.NODE_ACCEPTANCE,
      status: TaskStatus.APPROVED,
      description: '项目开工交底，确认施工方案和工期安排。',
      nodeName: '开工交底',
      location: '全屋',
      assignedToId: owner2.id,
      createdById: projectManager.id,
      confirmedAt: new Date('2024-02-25'),
      confirmedById: owner2.id,
      deadline: new Date('2024-02-26'),
    },
  });

  const task7 = await prisma.confirmationTask.create({
    data: {
      projectId: project2.id,
      title: '水电改造增项报价',
      type: TaskType.ADDITIONAL_QUOTE,
      status: TaskStatus.OVERDUE,
      description: '现场勘测后发现水电点位比原计划多，需要增加费用。\n\n增加内容：\n1. 新增插座 8 个\n2. 新增开关 3 个\n3. 新增网络点位 2 个\n4. 给水管延长 5 米',
      nodeName: '水电阶段',
      location: '全屋',
      amount: 3500,
      assignedToId: owner2.id,
      createdById: foreman.id,
      deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('创建版本记录...');

  await prisma.confirmationVersion.createMany({
    data: [
      {
        taskId: task1.id,
        version: 1,
        title: task1.title,
        description: task1.description,
        nodeName: task1.nodeName,
        location: task1.location,
        createdById: foreman.id,
      },
      {
        taskId: task2.id,
        version: 1,
        title: task2.title,
        description: task2.description,
        nodeName: task2.nodeName,
        location: task2.location,
        createdById: designer.id,
      },
      {
        taskId: task3.id,
        version: 1,
        title: task3.title,
        description: task3.description,
        nodeName: task3.nodeName,
        location: task3.location,
        createdById: foreman.id,
      },
      {
        taskId: task4.id,
        version: 1,
        title: task4.title,
        description: task4.description,
        nodeName: task4.nodeName,
        location: task4.location,
        amount: 12800,
        createdById: designer.id,
      },
      {
        taskId: task5.id,
        version: 1,
        title: task5.title,
        description: task5.description,
        nodeName: task5.nodeName,
        location: task5.location,
        createdById: foreman.id,
        changeReason: '第一次提交',
      },
      {
        taskId: task6.id,
        version: 1,
        title: task6.title,
        description: task6.description,
        nodeName: task6.nodeName,
        location: task6.location,
        createdById: projectManager.id,
      },
      {
        taskId: task7.id,
        version: 1,
        title: task7.title,
        description: task7.description,
        nodeName: task7.nodeName,
        location: task7.location,
        amount: 3500,
        createdById: foreman.id,
      },
    ],
  });

  console.log('创建报价版本...');

  await prisma.quoteVersion.createMany({
    data: [
      {
        taskId: task4.id,
        version: 1,
        amount: 12800,
        description: '主卧定制衣柜报价 V1',
        items: [
          { name: '柜体', unit: '平米', quantity: 6.72, unitPrice: 850, totalPrice: 5712 },
          { name: '柜门', unit: '平米', quantity: 6.72, unitPrice: 650, totalPrice: 4368 },
          { name: '五金配件', unit: '套', quantity: 1, unitPrice: 1200, totalPrice: 1200 },
          { name: '安装费', unit: '项', quantity: 1, unitPrice: 800, totalPrice: 800 },
          { name: '运输费', unit: '项', quantity: 1, unitPrice: 720, totalPrice: 720 },
        ] as any,
        createdById: designer.id,
      },
      {
        taskId: task7.id,
        version: 1,
        amount: 3500,
        description: '水电改造增项报价 V1',
        items: [
          { name: '新增插座', unit: '个', quantity: 8, unitPrice: 120, totalPrice: 960 },
          { name: '新增开关', unit: '个', quantity: 3, unitPrice: 80, totalPrice: 240 },
          { name: '网络点位', unit: '个', quantity: 2, unitPrice: 150, totalPrice: 300 },
          { name: '给水管延长', unit: '米', quantity: 5, unitPrice: 80, totalPrice: 400 },
          { name: '人工费用', unit: '项', quantity: 1, unitPrice: 1600, totalPrice: 1600 },
        ] as any,
        createdById: foreman.id,
      },
    ],
  });

  console.log('创建任务图片...');

  await prisma.taskImage.createMany({
    data: [
      {
        taskId: task1.id,
        type: 'BEFORE',
        url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e6?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e6?w=200',
        description: '水电改造前 - 客厅',
        order: 1,
      },
      {
        taskId: task1.id,
        type: 'AFTER',
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
        description: '水电改造后 - 客厅',
        order: 2,
      },
      {
        taskId: task2.id,
        type: 'REFERENCE',
        url: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=200',
        description: '悬浮吊顶参考图',
        order: 1,
      },
      {
        taskId: task3.id,
        type: 'BEFORE',
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
        description: '原瓷砖样品',
        order: 1,
      },
      {
        taskId: task3.id,
        type: 'AFTER',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200',
        description: '新瓷砖样品',
        order: 2,
      },
      {
        taskId: task4.id,
        type: 'REFERENCE',
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200',
        description: '衣柜样式参考',
        order: 1,
      },
      {
        taskId: task5.id,
        type: 'AFTER',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200',
        description: '客厅地砖铺贴效果',
        order: 1,
      },
      {
        taskId: task5.id,
        type: 'AFTER',
        url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=200',
        description: '卫生间瓷砖效果',
        order: 2,
      },
    ],
  });

  console.log('创建聊天记录...');

  await prisma.chatMessage.createMany({
    data: [
      {
        taskId: task2.id,
        userId: designer.id,
        content: '张哥您好，根据您上次提到的想要更有层次感的需求，我做了这个悬浮吊顶的方案，您看看怎么样？',
        type: 'TEXT',
      },
      {
        taskId: task2.id,
        userId: owner.id,
        content: '效果看起来不错，但是会不会压低层高？我家层高本来就不高。',
        type: 'TEXT',
      },
      {
        taskId: task2.id,
        userId: designer.id,
        content: '这个您放心，我们只在边缘做悬浮，中间还是原顶，视觉上反而会显得更高。',
        type: 'TEXT',
      },
      {
        taskId: task4.id,
        userId: designer.id,
        content: '张哥，这是主卧衣柜的报价，您看一下。用的是E0级板材，很环保的。',
        type: 'TEXT',
      },
      {
        taskId: task4.id,
        userId: owner.id,
        content: '价格有点贵啊，能不能便宜点？',
        type: 'TEXT',
      },
      {
        taskId: task4.id,
        userId: designer.id,
        content: '张哥，这个价格已经很实在了，我们用的都是最好的材料。要不我给您申请个95折？',
        type: 'TEXT',
      },
      {
        taskId: task5.id,
        userId: owner.id,
        content: '李工，卫生间的瓷砖我感觉贴得不太平整啊，有空鼓的声音。',
        type: 'TEXT',
      },
      {
        taskId: task5.id,
        userId: foreman.id,
        content: '张哥您说的是哪块？我过去看看。',
        type: 'TEXT',
      },
    ],
  });

  console.log('创建争议记录...');

  await prisma.dispute.create({
    data: {
      taskId: task4.id,
      title: '衣柜价格争议',
      description: '业主认为报价偏高，希望能再优惠一些。',
      reason: '价格偏高',
      status: DisputeStatus.OPEN,
      createdById: owner.id,
    },
  });

  console.log('创建提醒...');

  await prisma.reminder.createMany({
    data: [
      {
        userId: owner.id,
        taskId: task2.id,
        type: ReminderType.TASK_ASSIGNED,
        title: '新的确认任务待处理',
        content: '客厅吊顶设计变更等待您的确认',
        status: ReminderStatus.SENT,
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        userId: owner.id,
        taskId: task3.id,
        type: ReminderType.TASK_ASSIGNED,
        title: '新的确认任务待处理',
        content: '地砖材料替换等待您的确认',
        status: ReminderStatus.SENT,
        sentAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        userId: projectManager.id,
        taskId: task7.id,
        type: ReminderType.OVERDUE,
        title: '任务已逾期',
        content: '翠湖天地项目的水电改造增项报价已逾期，请跟进业主确认',
        status: ReminderStatus.SENT,
        sentAt: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        userId: projectManager.id,
        taskId: task4.id,
        type: ReminderType.DISPUTE_OPENED,
        title: '有新的争议需要处理',
        content: '阳光花园项目的衣柜增项报价有争议',
        status: ReminderStatus.READ,
        sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        readAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        userId: foreman.id,
        taskId: task5.id,
        type: ReminderType.MISSING_DOCUMENTS,
        title: '资料缺失提醒',
        content: '瓦工验收缺少闭水试验记录，请补充上传',
        status: ReminderStatus.SENT,
        sentAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('数据库初始化完成！');
  console.log('');
  console.log('演示账号：');
  console.log('  管理员:  admin@example.com / 123456');
  console.log('  项目经理: chenweiming@example.com / 123456');
  console.log('  工长:    lijianguo@example.com / 123456');
  console.log('  设计师:  wangxiaoya@example.com / 123456');
  console.log('  监理:    zhaoziqiang@example.com / 123456');
  console.log('  业主1:   zhangmingyuan@example.com / 123456');
  console.log('  业主2:   liuhongmei@example.com / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
