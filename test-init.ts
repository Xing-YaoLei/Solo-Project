import { ensureDbInitialized } from './src/lib/server/init-db';

console.log('[TEST] 开始调用 ensureDbInitialized()');
try {
  await ensureDbInitialized();
  console.log('[TEST] ensureDbInitialized() 执行成功');
} catch (e) {
  console.error('[TEST] 执行失败:', e);
  console.error('[TEST] Stack:', (e as Error).stack);
}
