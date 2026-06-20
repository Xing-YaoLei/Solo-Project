#!/usr/bin/env node
/**
 * 接口验证脚本 - 快速验证所有 API 接口是否可用
 * 使用方法: node scripts/verify-api.js
 */

const BASE_URL = 'http://localhost:3001/api';

async function test(name, path, method = 'GET') {
  const startTime = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, { method });
    const ok = res.ok;
    const time = Date.now() - startTime;
    const status = res.status;
    console.log(
      `${ok ? '✅' : '❌'} ${name.padEnd(20)} ${status} ${time}ms ${
        ok ? '' : `\n   ↳ ${await res.text().slice(0, 200)}`
      }`,
    );
    return ok;
  } catch (e) {
    console.log(`❌ ${name.padEnd(20)} 连接失败: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🧪 API 接口验证\n');
  console.log(`目标: ${BASE_URL}\n`);

  const results = await Promise.all([
    test('活动列表', '/activities'),
    test('活动汇总', '/activities/demo-activity-001/summary'),
    test('票种列表', '/ticket-types?activityId=demo-activity-001'),
    test('订单列表', '/orders?activityId=demo-activity-001'),
    test('座位图列表', '/seats/maps?activityId=demo-activity-001'),
    test('签到列表', '/check-in?activityId=demo-activity-001'),
    test('赞助清单', '/sponsors?activityId=demo-activity-001'),
    test('异常列表', '/exceptions?activityId=demo-activity-001'),
    test('导出任务', '/exports/tasks?activityId=demo-activity-001'),
    test('核销口径', '/exports/caliber/checkin_efficiency'),
    test('仪表盘', '/dashboard/overview?activityId=demo-activity-001'),
  ]);

  const passed = results.filter(Boolean).length;
  console.log(`\n📊 ${passed}/${results.length} 接口可用\n`);
}

main().catch(console.error);
