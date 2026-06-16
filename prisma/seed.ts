import { PrismaClient } from '@prisma/client';
import { initializeDefaultThresholds } from '../src/services/thresholdService';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  console.log('初始化阈值配置...');
  await initializeDefaultThresholds();

  console.log('数据库初始化完成!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
