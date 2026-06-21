import { PrismaClient, UserRole, DepartmentType, ComplaintStatus, Priority, ComplaintSource } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  console.log('开始清理数据...');
  await prisma.operationLog.deleteMany();
  await prisma.visitResult.deleteMany();
  await prisma.upgradeRecord.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.department.deleteMany();

  console.log('创建部门数据...');
  const departmentsData = [
    { name: '游客服务部', code: 'VISITOR_SERVICE', type: DepartmentType.DEPARTMENT, sortOrder: 1 },
    { name: '票务部', code: 'TICKET', type: DepartmentType.DEPARTMENT, sortOrder: 2 },
    { name: '安保部', code: 'SECURITY', type: DepartmentType.DEPARTMENT, sortOrder: 3 },
    { name: '保洁部', code: 'CLEANING', type: DepartmentType.DEPARTMENT, sortOrder: 4 },
    { name: '运营管理部', code: 'OPERATION', type: DepartmentType.DEPARTMENT, sortOrder: 5 },
  ];

  const departments: { [key: string]: any } = {};
  for (const d of departmentsData) {
    departments[d.code] = await prisma.department.create({ data: d });
  }

  const positionsData = [
    { code: 'VS_FRONT', name: '前台接待', parentCode: 'VISITOR_SERVICE' },
    { code: 'VS_CONSULT', name: '咨询服务', parentCode: 'VISITOR_SERVICE' },
    { code: 'TK_SALE', name: '售票员', parentCode: 'TICKET' },
    { code: 'TK_CHECK', name: '检票员', parentCode: 'TICKET' },
    { code: 'SC_PATROL', name: '巡逻岗', parentCode: 'SECURITY' },
    { code: 'SC_GATE', name: '门岗', parentCode: 'SECURITY' },
    { code: 'CL_AREA', name: '区域保洁', parentCode: 'CLEANING' },
    { code: 'CL_TOILET', name: '卫生间保洁', parentCode: 'CLEANING' },
    { code: 'OP_MANAGER', name: '运营主管', parentCode: 'OPERATION' },
    { code: 'OP_DISPATCH', name: '调度员', parentCode: 'OPERATION' },
  ];

  const positions: { [key: string]: any } = {};
  for (const p of positionsData) {
    const parent = departments[p.parentCode];
    positions[p.code] = await prisma.department.create({
      data: {
        name: p.name,
        code: p.code,
        type: DepartmentType.POSITION,
        parentId: parent.id,
        sortOrder: Math.floor(Math.random() * 10),
      },
    });
  }

  console.log('创建系统用户...');
  const SYSTEM_USER_ID = 'system-user-0000-0000-0000-000000000001';
  await prisma.user.upsert({
    where: { id: SYSTEM_USER_ID },
    update: {},
    create: {
      id: SYSTEM_USER_ID,
      name: '系统',
      phone: 'system',
      passwordHash,
      role: UserRole.SUPERVISOR,
      departmentId: null,
      avatar: null,
    },
  });

  console.log('创建用户数据...');
  const usersData = [
    { name: '张主管', phone: '13800000001', email: 'zhang@test.com', role: UserRole.SUPERVISOR, positionCode: 'OP_MANAGER', avatar: null },
    { name: '李调度', phone: '13800000002', email: 'li@test.com', role: UserRole.OPERATOR, positionCode: 'OP_DISPATCH', avatar: null },
    { name: '王接待', phone: '13800000003', email: 'wang@test.com', role: UserRole.TICKET_STAFF, positionCode: 'VS_FRONT', avatar: null },
    { name: '赵巡逻', phone: '13800000004', email: 'zhao@test.com', role: UserRole.PATROL_STAFF, positionCode: 'SC_PATROL', avatar: null },
    { name: '陈售票', phone: '13800000005', email: 'chen@test.com', role: UserRole.TICKET_STAFF, positionCode: 'TK_SALE', avatar: null },
    { name: '孙咨询', phone: '13800000006', email: 'sun@test.com', role: UserRole.PATROL_STAFF, positionCode: 'VS_CONSULT', avatar: null },
    { name: '周检票', phone: '13800000007', email: 'zhou@test.com', role: UserRole.TICKET_STAFF, positionCode: 'TK_CHECK', avatar: null },
    { name: '吴门岗', phone: '13800000008', email: 'wu@test.com', role: UserRole.PATROL_STAFF, positionCode: 'SC_GATE', avatar: null },
    { name: '郑保洁', phone: '13800000009', email: 'zheng@test.com', role: UserRole.PATROL_STAFF, positionCode: 'CL_AREA', avatar: null },
    { name: '冯卫生', phone: '13800000010', email: 'feng@test.com', role: UserRole.PATROL_STAFF, positionCode: 'CL_TOILET', avatar: null },
  ];

  const users: any[] = [];
  for (const u of usersData) {
    const pos = positions[u.positionCode];
    const user = await prisma.user.create({
      data: {
        name: u.name,
        phone: u.phone,
        email: u.email,
        passwordHash,
        role: u.role,
        departmentId: pos.id,
        avatar: u.avatar,
      },
    });
    users.push(user);
  }

  const supervisor = users.find(u => u.role === UserRole.SUPERVISOR);
  const operators = users.filter(u => u.role === UserRole.OPERATOR);

  console.log('创建标签数据...');
  const tagsData = [
    { name: '服务态度', code: 'SERVICE_ATTITUDE', color: '#f5222d' },
    { name: '排队时间', code: 'QUEUE_TIME', color: '#fa8c16' },
    { name: '设施故障', code: 'FACILITY_FAULT', color: '#faad14' },
    { name: '卫生问题', code: 'HYGIENE', color: '#a0d911' },
    { name: '安全隐患', code: 'SAFETY_HAZARD', color: '#52c41a' },
    { name: '票务问题', code: 'TICKET_ISSUE', color: '#13c2c2' },
    { name: '餐饮问题', code: 'DINING', color: '#1890ff' },
    { name: '停车问题', code: 'PARKING', color: '#722ed1' },
  ];

  const tags: any[] = [];
  for (const t of tagsData) {
    const tag = await prisma.tag.create({
      data: { ...t, sortOrder: Math.floor(Math.random() * 10) },
    });
    tags.push(tag);
  }

  console.log('创建投诉工单数据...');
  const complaintTitles = [
    '售票窗口态度恶劣',
    '过山车排队超过2小时',
    '卫生间设施损坏漏水',
    '园区地面有垃圾未清理',
    '儿童游乐区安全护栏松动',
    '门票价格与公示不符',
    '餐厅等餐时间过长',
    '停车场收费系统故障',
    '咨询台工作人员不耐烦',
    '花车巡游路线临时变更未通知',
    '缆车中途停运乘客被困',
    '演出场地音响效果差',
    '纪念品商店商品标价错误',
    '婴儿室卫生条件差',
    '无障碍通道被占用',
    '夜间照明不足',
    '导览图信息不准确',
    '寄存包丢失',
    '餐饮食品不新鲜',
    '电瓶车司机开车太快',
  ];

  const visitorNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二'];
  const visitorPhones = ['13900001001', '13900001002', '13900001003', '13900001004', '13900001005', '13900001006', '13900001007', '13900001008', '13900001009', '13900001010'];

  const statuses = Object.values(ComplaintStatus);
  const priorities = Object.values(Priority);
  const sources = Object.values(ComplaintSource);

  const complaints: any[] = [];
  for (let i = 0; i < 20; i++) {
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const source = sources[i % sources.length];
    const owner = users[i % users.length];
    const dept = departments[Object.keys(departments)[i % 5]];
    const now = new Date();
    const deadlineAt = new Date(now.getTime() + (Math.random() > 0.3 ? 1 : -1) * Math.random() * 7 * 24 * 60 * 60 * 1000);
    const closedAt = status === ComplaintStatus.CLOSED ? new Date(deadlineAt.getTime() - Math.random() * 24 * 60 * 60 * 1000) : null;

    const complaint = await prisma.complaint.create({
      data: {
        code: `CP${String(20240001 + i)}`,
        title: complaintTitles[i],
        content: `${complaintTitles[i]}，具体情况描述：游客在游玩过程中遇到此问题，希望尽快得到解决。`,
        source,
        status,
        priority,
        visitorName: visitorNames[i % visitorNames.length],
        visitorPhone: visitorPhones[i % visitorPhones.length],
        visitorIdCard: i % 3 === 0 ? `110101199${i % 10}0101${1000 + i}` : null,
        ticketNo: i % 2 === 0 ? `TK${20240001 + i}` : null,
        location: ['东门入口', '过山车区域', '儿童乐园', '中心广场', '餐饮区'][i % 5],
        deadlineAt,
        closedAt,
        closeDurationMinutes: closedAt ? Math.floor((closedAt.getTime() - now.getTime()) / 60000) : null,
        ownerId: status !== ComplaintStatus.PENDING ? owner.id : null,
        departmentId: status !== ComplaintStatus.PENDING ? dept.id : null,
        tags: { connect: [{ id: tags[i % tags.length].id }, { id: tags[(i + 2) % tags.length].id }] },
      },
    });
    complaints.push(complaint);

    if (status !== ComplaintStatus.PENDING) {
      await prisma.operationLog.create({
        data: {
          complaintId: complaint.id,
          operatorId: supervisor.id,
          operatorName: supervisor.name,
          action: 'CREATE',
          detail: `创建工单：${complaint.title}`,
        },
      });
    }

    if (([ComplaintStatus.ASSIGNED, ComplaintStatus.PROCESSING, ComplaintStatus.SUPPLEMENTING, ComplaintStatus.VISITING, ComplaintStatus.CLOSED] as ComplaintStatus[]).includes(status)) {
      await prisma.assignment.create({
        data: {
          complaintId: complaint.id,
          fromUserId: supervisor.id,
          toUserId: owner.id,
          reason: '常规分派处理',
        },
      });
      await prisma.operationLog.create({
        data: {
          complaintId: complaint.id,
          operatorId: supervisor.id,
          operatorName: supervisor.name,
          action: 'ASSIGN',
          detail: `分派给 ${owner.name} 处理`,
        },
      });
    }

    if (priority === Priority.HIGH || priority === Priority.URGENT) {
      await prisma.upgradeRecord.create({
        data: {
          complaintId: complaint.id,
          fromLevel: Priority.MEDIUM,
          toLevel: priority,
          operatorId: supervisor.id,
          reason: '问题涉及游客人身安全，需要紧急处理',
        },
      });
      await prisma.operationLog.create({
        data: {
          complaintId: complaint.id,
          operatorId: supervisor.id,
          operatorName: supervisor.name,
          action: 'UPGRADE',
          detail: `优先级升级为 ${priority}`,
        },
      });
    }

    if (status === ComplaintStatus.CLOSED) {
      const visitOperator = operators[i % operators.length];
      await prisma.visitResult.create({
        data: {
          complaintId: complaint.id,
          operatorId: visitOperator.id,
          satisfaction: (i % 5) + 1,
          feedback: ['问题已解决，非常满意', '基本满意', '处理结果一般', '不太满意', '非常不满意'][i % 5],
          needFollowUp: i % 4 === 0,
          visitedAt: closedAt,
        },
      });
      await prisma.operationLog.create({
        data: {
          complaintId: complaint.id,
          operatorId: visitOperator.id,
          operatorName: visitOperator.name,
          action: 'CLOSE',
          detail: '工单已关闭并完成回访',
        },
      });
    }

    if (status === ComplaintStatus.REJECTED) {
      await prisma.operationLog.create({
        data: {
          complaintId: complaint.id,
          operatorId: supervisor.id,
          operatorName: supervisor.name,
          action: 'REJECT',
          detail: '投诉内容不明确，需要补充更多信息',
        },
      });
    }

    if (status === ComplaintStatus.SUPPLEMENTING) {
      await prisma.operationLog.create({
        data: {
          complaintId: complaint.id,
          operatorId: owner.id,
          operatorName: owner.name,
          action: 'SUPPLEMENT',
          detail: '已要求游客补充相关证明材料',
        },
      });
    }
  }

  console.log('种子数据创建完成！');
  console.log(`- 部门: ${Object.keys(departments).length + Object.keys(positions).length} 个`);
  console.log(`- 用户: ${users.length} 个`);
  console.log(`- 标签: ${tags.length} 个`);
  console.log(`- 投诉工单: ${complaints.length} 个`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
