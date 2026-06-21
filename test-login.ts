import { db } from './src/lib/server/db';
import { userTable } from './src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { Argon2id } from 'oslo/password';
import { lucia } from './src/lib/server/auth';
import 'dotenv/config';

async function test() {
  console.log('1. 测试查询 admin 用户...');
  const users = await db.select().from(userTable).where(eq(userTable.username, 'admin'));
  const adminUser = users[0];
  console.log('   找到用户:', adminUser?.username);
  console.log('   密码哈希:', adminUser?.passwordHash ? '存在' : '不存在');

  if (!adminUser?.passwordHash) {
    console.log('   ❌ 用户没有密码哈希，无法登录');
    process.exit(1);
  }

  console.log('\n2. 测试密码验证...');
  const validPassword = await new Argon2id().verify(adminUser.passwordHash, '123456');
  console.log('   密码验证结果:', validPassword ? '✅ 正确' : '❌ 错误');

  if (!validPassword) {
    console.log('   ❌ 密码错误，无法登录');
    process.exit(1);
  }

  console.log('\n3. 测试创建会话...');
  const session = await lucia.createSession(adminUser.id, {});
  console.log('   会话ID:', session.id);
  console.log('   会话过期时间:', session.expiresAt);
  console.log('   会话用户ID:', session.userId);

  console.log('\n4. 测试创建会话 Cookie...');
  const cookie = lucia.createSessionCookie(session.id);
  console.log('   Cookie name:', cookie.name);
  console.log('   Cookie value exists:', !!cookie.value);

  console.log('\n✅✅✅ 登录流程测试全部通过!');
  process.exit(0);
}

test().catch(e => {
  console.error('❌ 测试失败:', e);
  process.exit(1);
});
