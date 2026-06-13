import { PrismaClient, Prisma, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化种子数据...');

  const managerEmail = 'manager@beauty.com';
  const existingManager = await prisma.user.findUnique({
    where: { email: managerEmail },
  });

  if (existingManager) {
    console.log('⚠️  管理员已存在，跳过创建');
  } else {
    await prisma.user.create({
      data: {
        email: managerEmail,
        name: '张店长',
        role: UserRole.MANAGER,
      },
    });
    console.log('✅ 管理员账号已创建: manager@beauty.com');
  }

  const technicianSeeds = [
    { email: 'tech1@beauty.com', name: '李美容师', role: UserRole.TECHNICIAN },
    { email: 'tech2@beauty.com', name: '王美容师', role: UserRole.TECHNICIAN },
    { email: 'tech3@beauty.com', name: '陈美容师', role: UserRole.TECHNICIAN },
  ];

  for (const seed of technicianSeeds) {
    const existing = await prisma.user.findUnique({ where: { email: seed.email } });
    if (existing) {
      console.log(`⚠️  技师 ${seed.name} (${seed.email}) 已存在，跳过创建`);
      continue;
    }
    await prisma.user.create({ data: seed });
    console.log(`✅ 技师已创建: ${seed.name} (${seed.email})`);
  }

  console.log('\n🎯 默认演示账号（密码均为 123456）:');
  console.log('   - 管理层: manager@beauty.com');
  console.log('   - 技师1 : tech1@beauty.com');
  console.log('   - 技师2 : tech2@beauty.com');
  console.log('   - 技师3 : tech3@beauty.com');
}

main()
  .catch(e => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
