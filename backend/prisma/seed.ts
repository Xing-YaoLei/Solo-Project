import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@homestay.com' },
    update: {},
    create: {
      name: '管理员',
      email: 'admin@homestay.com',
      phone: '13800000000',
      role: UserRole.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@homestay.com' },
    update: {},
    create: {
      name: '李经理',
      email: 'manager@homestay.com',
      phone: '13800000001',
      role: UserRole.MANAGER,
    },
  });

  const housekeeper1 = await prisma.user.upsert({
    where: { email: 'zhangsan@homestay.com' },
    update: {},
    create: {
      name: '张保洁',
      email: 'zhangsan@homestay.com',
      phone: '13800000002',
      role: UserRole.HOUSEKEEPER,
    },
  });

  const housekeeper2 = await prisma.user.upsert({
    where: { email: 'lisi@homestay.com' },
    update: {},
    create: {
      name: '李保洁',
      email: 'lisi@homestay.com',
      phone: '13800000003',
      role: UserRole.HOUSEKEEPER,
    },
  });

  const receptionist = await prisma.user.upsert({
    where: { email: 'reception@homestay.com' },
    update: {},
    create: {
      name: '王前台',
      email: 'reception@homestay.com',
      phone: '13800000004',
      role: UserRole.RECEPTIONIST,
    },
  });

  console.log('种子用户已创建:');
  console.log('  管理员:', admin.id, admin.name);
  console.log('  经理:', manager.id, manager.name);
  console.log('  保洁员1:', housekeeper1.id, housekeeper1.name);
  console.log('  保洁员2:', housekeeper2.id, housekeeper2.name);
  console.log('  前台:', receptionist.id, receptionist.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
