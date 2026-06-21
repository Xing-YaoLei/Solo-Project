import { db } from './src/lib/server/db';
import { userTable } from './src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function test() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('\n测试查询用户表...');
  
  const users = await db.select().from(userTable).limit(3);
  console.log('查询到', users.length, '个用户:');
  users.forEach(u => {
    console.log(`  - ${u.username} (${u.role}): ${u.realName}`);
  });

  console.log('\n测试按用户名查询...');
  const adminResult = await db.select().from(userTable).where(eq(userTable.username, 'admin'));
  const admin = adminResult[0];
  console.log('admin 用户:', admin ? admin.username : '未找到');
  console.log('admin 密码哈希:', admin?.passwordHash ? '已设置' : '未设置');

  console.log('\n✅ 数据库连接和查询测试通过!');
  process.exit(0);
}

test().catch(e => {
  console.error('❌ 测试失败:', e);
  process.exit(1);
});
