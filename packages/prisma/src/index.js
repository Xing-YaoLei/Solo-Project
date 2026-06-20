/**
 * Prisma 开发态入口 - 直接指向 Prisma generate 输出目录
 * 这个文件确保开发态下 require('@ticket/prisma') 能正确找到 PrismaClient 和 enums
 */

// 先尝试加载 Prisma generate 输出的 JS 入口
try {
  const client = require('./generated/client');
  const enums = require('./enums');
  
  // 合并导出
  module.exports = {
    ...client,
    ...enums,
  };
} catch (e) {
  // 如果还没 generate，抛出清晰的错误提示
  console.error('⚠️  Prisma Client 尚未生成，请先执行: npm run db:generate --workspace=@ticket/prisma');
  throw e;
}
