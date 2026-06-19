import { PrismaClient, RoleEnum } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const permissions = [
    { name: '查看用户', code: 'user:read', description: '查看用户信息' },
    { name: '管理用户', code: 'user:manage', description: '创建、编辑、删除用户' },
    { name: '查看角色', code: 'role:read', description: '查看角色信息' },
    { name: '管理角色', code: 'role:manage', description: '创建、编辑、删除角色' },
    { name: '查看车辆', code: 'vehicle:read', description: '查看车辆档案' },
    { name: '管理车辆', code: 'vehicle:manage', description: '创建、编辑、删除车辆' },
    { name: '查看工单', code: 'workorder:read', description: '查看工单信息' },
    { name: '创建工单', code: 'workorder:create', description: '创建工单' },
    { name: '编辑工单', code: 'workorder:update', description: '编辑工单信息' },
    { name: '管理工单状态', code: 'workorder:status', description: '更新工单状态' },
    { name: '查看配件', code: 'part:read', description: '查看配件库存' },
    { name: '管理配件', code: 'part:manage', description: '管理配件库存' },
    { name: '查看配件申请', code: 'partrequest:read', description: '查看配件申请' },
    { name: '创建配件申请', code: 'partrequest:create', description: '创建配件申请' },
    { name: '审批配件申请', code: 'partrequest:approve', description: '审批配件申请' },
    { name: '查看质检', code: 'quality:read', description: '查看质检记录' },
    { name: '执行质检', code: 'quality:check', description: '执行质检操作' },
    { name: '查看保养提醒', code: 'reminder:read', description: '查看保养提醒' },
    { name: '管理保养提醒', code: 'reminder:manage', description: '管理保养提醒' },
    { name: '查看报表', code: 'report:read', description: '查看统计报表' },
    { name: '查看统计', code: 'statistics:read', description: '查看统计分析' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, description: perm.description },
      create: perm,
    });
  }

  const roles = [
    {
      name: '顾问',
      code: RoleEnum.ADVISOR,
      description: '服务顾问，负责接待客户、创建工单',
      permissions: [
        'user:read',
        'vehicle:read',
        'vehicle:manage',
        'workorder:read',
        'workorder:create',
        'workorder:update',
        'workorder:status',
        'part:read',
        'partrequest:read',
        'partrequest:create',
        'quality:read',
        'reminder:read',
        'reminder:manage',
        'statistics:read',
      ],
    },
    {
      name: '技师',
      code: RoleEnum.TECHNICIAN,
      description: '维修技师，负责车辆维修',
      permissions: [
        'user:read',
        'vehicle:read',
        'workorder:read',
        'workorder:status',
        'part:read',
        'partrequest:read',
        'partrequest:create',
        'quality:read',
        'reminder:read',
        'statistics:read',
      ],
    },
    {
      name: '配件员',
      code: RoleEnum.PARTS_CLERK,
      description: '配件管理员，负责配件库存管理',
      permissions: [
        'user:read',
        'vehicle:read',
        'workorder:read',
        'part:read',
        'part:manage',
        'partrequest:read',
        'partrequest:approve',
        'reminder:read',
        'statistics:read',
      ],
    },
    {
      name: '厂长',
      code: RoleEnum.MANAGER,
      description: '厂长/管理员，拥有所有权限',
      permissions: permissions.map((p) => p.code),
    },
  ];

  for (const role of roles) {
    const existingRole = await prisma.role.findUnique({
      where: { code: role.code },
    });

    if (existingRole) {
      await prisma.role.update({
        where: { id: existingRole.id },
        data: {
          name: role.name,
          description: role.description,
          permissions: {
            set: role.permissions.map((code) => ({ code })),
          },
        },
      });
    } else {
      await prisma.role.create({
        data: {
          name: role.name,
          code: role.code,
          description: role.description,
          permissions: {
            connect: role.permissions.map((code) => ({ code })),
          },
        },
      });
    }
  }

  const managerRole = await prisma.role.findUnique({
    where: { code: RoleEnum.MANAGER },
  });

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@autoservice.com',
      password: hashedPassword,
      name: '系统管理员',
      phone: '13800138000',
      roleId: managerRole.id,
    },
  });

  const advisorRole = await prisma.role.findUnique({
    where: { code: RoleEnum.ADVISOR },
  });

  await prisma.user.upsert({
    where: { username: 'advisor' },
    update: {},
    create: {
      username: 'advisor',
      email: 'advisor@autoservice.com',
      password: hashedPassword,
      name: '张顾问',
      phone: '13800138001',
      roleId: advisorRole.id,
    },
  });

  const technicianRole = await prisma.role.findUnique({
    where: { code: RoleEnum.TECHNICIAN },
  });

  await prisma.user.upsert({
    where: { username: 'technician' },
    update: {},
    create: {
      username: 'technician',
      email: 'technician@autoservice.com',
      password: hashedPassword,
      name: '李技师',
      phone: '13800138002',
      roleId: technicianRole.id,
    },
  });

  const partsClerkRole = await prisma.role.findUnique({
    where: { code: RoleEnum.PARTS_CLERK },
  });

  await prisma.user.upsert({
    where: { username: 'partsclerk' },
    update: {},
    create: {
      username: 'partsclerk',
      email: 'partsclerk@autoservice.com',
      password: hashedPassword,
      name: '王配件',
      phone: '13800138003',
      roleId: partsClerkRole.id,
    },
  });

  console.log('Database seeded successfully!');
  console.log('Default accounts:');
  console.log('  admin / admin123 (厂长)');
  console.log('  advisor / admin123 (顾问)');
  console.log('  technician / admin123 (技师)');
  console.log('  partsclerk / admin123 (配件员)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
