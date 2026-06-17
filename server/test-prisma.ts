import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function test() {
  try {
    console.log('Testing Prisma connection...');
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    const prisma = new PrismaClient({ adapter });
    
    const count = await prisma.elder.count();
    console.log('Elder count:', count);
    
    const elders = await prisma.elder.findMany({ take: 2 });
    console.log('Sample elders:', elders.map(e => e.name));
    
    await prisma.$disconnect();
    console.log('Prisma test PASSED');
  } catch (e: any) {
    console.error('Prisma test FAILED:', e.message);
    console.error(e.stack);
  }
}

test();
