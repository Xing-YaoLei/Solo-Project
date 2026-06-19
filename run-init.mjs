import { ensureDbInitialized } from './src/lib/server/init-db.js';

console.log('开始手动初始化数据库...');
await ensureDbInitialized();
console.log('数据库初始化脚本执行完成');
