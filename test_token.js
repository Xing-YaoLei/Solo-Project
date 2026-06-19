const http = require('http');

const REAL_SHARE_TOKEN = 'investor_iQ5zYDd5vnqgmfhJ6bPL';

function test(path, headers) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost', port: 3000, path,
      headers: headers || {},
    }, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: JSON.parse(d || '{}') });
      });
    });
    req.end();
  });
}

function post(path, body, headers) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost', port: 3000, path, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(headers || {}),
      },
    }, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d || '{}') }));
    });
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log('=== 分享 Token 严格验证测试 ===\n');

  // 1. 未保存的随机 token
  const r1 = await test('/api/dashboard', { 'X-Share-Token': 'fake_token_abc123' });
  console.log('1. 未保存短token:');
  console.log('   HTTP:', r1.status, '| success:', r1.data.success);
  console.log('   ', r1.data.success ? '❌ 严重：仍返回数据' : '✅ 拒绝访问 - ' + (r1.data.error?.message || r1.data.error));

  // 2. 未保存但长度>=16的 token（漏洞测试）
  const r2 = await test('/api/dashboard', { 'X-Share-Token': 'investor_XXXXXXXXXXXXXXXXXXXX' });
  console.log('');
  console.log('2. 未保存长token (漏洞测试):');
  console.log('   HTTP:', r2.status, '| success:', r2.data.success);
  console.log('   ', r2.data.success ? '❌ 漏洞仍存在' : '✅ 漏洞已修复');

  // 3. 未保存 token 访问 export 接口
  const r2b = await post('/api/export', { type: 'dashboard', format: 'xlsx', shareToken: 'fake_export_token_123456' });
  console.log('');
  console.log('3. Export接口（带假token）:');
  console.log('   HTTP:', r2b.status, '| success:', r2b.data.success);
  console.log('   ', r2b.data.success ? '❌ Export接口仍返回数据' : '✅ Export接口严格拒绝');

  // 4. 四类明细接口（带假token）
  const t4 = ['/api/checkin', '/api/deposit', '/api/complaint', '/api/review'];
  console.log('');
  console.log('4. 四类明细接口（带假token）:');
  for (const p of t4) {
    const r = await test(p, { 'X-Share-Token': 'fake_detail_token' });
    console.log(`   ${p}: HTTP ${r.status}, success: ${r.data.success}`,
      r.data.success ? '❌' : '✅');
  }

  // 5. 真实保存的 token 请求 dashboard
  console.log('');
  console.log('5. 真实DB保存的token (investor 7天):');
  console.log('   Token:', REAL_SHARE_TOKEN);
  const r3 = await test('/api/dashboard', { 'X-Share-Token': REAL_SHARE_TOKEN });
  if (r3.data.success) {
    console.log('   ✅ 返回数据正确');
    console.log('   dataScope.role:', r3.data.metadata?.dataScope?.role);
    console.log('   保洁准时率:', (r3.data.metadata.punctualityRate * 100).toFixed(1) + '%');
    console.log('   总订单:', r3.data.data.metrics.totalOrders);
    console.log('   入住率:', (r3.data.data.metrics.occupancyRate * 100).toFixed(1) + '%');
    console.log('   客诉率:', (r3.data.data.metrics.complaintRate * 100).toFixed(1) + '%');
  } else {
    console.log('   ❌ 真实token获取失败:', JSON.stringify(r3.data));
  }

  console.log('');
  console.log('=== 真实数据库数据验证（无token默认admin） ===');
  const r4 = await test('/api/dashboard');
  if (r4.data.success) {
    const m = r4.data.data.metrics;
    const pt = r4.data.data.punctuality;
    console.log('6. Dashboard主页面:');
    console.log('   保洁准时率:', (r4.data.metadata.punctualityRate * 100).toFixed(1) + '%');
    console.log('   准时/总数:', pt.onTimeCount, '/', pt.totalCount, '(DoorLockRecord驱动)');
    console.log('   总订单:', m.totalOrders);
    console.log('   活跃民宿:', m.activeHotels);
    console.log('   入住率:', (m.occupancyRate * 100).toFixed(1) + '%');
    console.log('   客诉率:', (m.complaintRate * 100).toFixed(1) + '%');
    console.log('   押金异常率:', (m.depositAnomalyRate * 100).toFixed(1) + '%');
    console.log('   点评均分:', m.reviewAverageScore.toFixed(2));
    console.log('   数据范围:', pt.dateRange);
  }

  // 导出接口
  const r5 = await post('/api/export', { type: 'dashboard', format: 'xlsx' });
  if (r5.data.success) {
    const m = r5.data.data['核心指标汇总'];
    console.log('');
    console.log('7. 导出仪表盘（真实PostgreSQL）:');
    console.log('   保洁准时率:', (r5.data.punctualityRate * 100).toFixed(1) + '%');
    console.log('   核心指标 - 总订单:', m.totalOrders, '准时率:', m.cleaningPunctuality);
    console.log('   保洁口径:', r5.data.calculationRule.slice(0, 70) + '...');
  }

  // 四类明细接口
  const [ck, dp, cp, rv] = await Promise.all([
    test('/api/checkin'),
    test('/api/deposit'),
    test('/api/complaint'),
    test('/api/review'),
  ]);
  console.log('');
  console.log('8. 四类明细（真实PostgreSQL）:');
  console.log('   入住证件趋势:', ck.data.success ? ck.data.data.length + '条' : '失败');
  const depData = dp.data.data;
  console.log('   押金明细记录:', dp.data.success ? (depData.records?.length || depData.length) + '条' : '失败');
  if (dp.data.success) {
    const bd = depData.breakdown || {};
    console.log('   押金构成: 已收取', bd.collected || 0, '已退还', bd.refunded || 0, '已扣除', bd.deducted || 0);
  }
  console.log('   客诉证据明细:', cp.data.success ? cp.data.data.length + '条' : '失败');
  console.log('   点评标签标注:', rv.data.success ? rv.data.data.length + '条' : '失败');
  if (rv.data.success) {
    const tags = rv.data.data.reduce((acc, t) => {
      const s = t.sentiment === 'negative' ? '负面' : t.sentiment === 'positive' ? '正面' : '中性';
      acc[s] = (acc[s] || 0) + 1;
      if (t.isAnomaly) acc['异常'] = (acc['异常'] || 0) + 1;
      return acc;
    }, {});
    console.log('   情感分布:', JSON.stringify(tags));
  }

  console.log('');
  console.log('✅ 所有验证完成！');
})().catch(console.error);
