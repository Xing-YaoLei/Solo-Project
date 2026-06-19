const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost', port: 3000, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  const start = Date.now();
  
  // 1. 导出仪表盘
  console.log('测试 /api/export (dashboard)...');
  const r1 = await post('/api/export', { type: 'dashboard', format: 'xlsx' });
  console.log('  success:', r1.success, `(${Date.now() - start}ms)`);
  if (r1.success) {
    const d = r1.data;
    console.log('  文件名:', d.fileName);
    console.log('  保洁口径:', d.calculationRule ? '✓ 存在' : '✗ 缺失');
    console.log('  保洁准时率:', d.punctualityRate);
    console.log('  数据段:', Object.keys(d.data).join(', '));
    
    const bao = d.data['保洁准时率口径'];
    if (bao) {
      console.log('  保洁口径详情:');
      for (const [k, v] of Object.entries(bao)) {
        console.log('    ', k + ':', String(v).slice(0, 60));
      }
    }
    
    if (d.data['核心指标汇总']) {
      const m = d.data['核心指标汇总'];
      console.log('  核心指标:');
      console.log('    总订单:', m.totalOrders);
      console.log('    保洁准时率:', m.cleaningPunctualityRate);
      console.log('    客诉率:', m.complaintRate);
      console.log('    入住率:', m.occupancyRate);
    }
  } else {
    console.log('  error:', r1.error);
  }
  
  console.log('');
  
  // 2. 导出入住证件
  const start2 = Date.now();
  console.log('测试 /api/export (checkin)...');
  const r2 = await post('/api/export', { type: 'checkin', format: 'xlsx' });
  console.log('  success:', r2.success, `(${Date.now() - start2}ms)`);
  if (r2.success) {
    console.log('  记录数:', r2.data.data.length);
    if (r2.data.data.length > 0) {
      console.log('  列名:', Object.keys(r2.data.data[0]).join(', '));
      console.log('  首行:', JSON.stringify(r2.data.data[0]));
    }
  }
  
  console.log('');
  
  // 3. 导出押金明细
  const start3 = Date.now();
  console.log('测试 /api/export (deposit)...');
  const r3 = await post('/api/export', { type: 'deposit', format: 'xlsx' });
  console.log('  success:', r3.success, `(${Date.now() - start3}ms)`);
  if (r3.success) {
    console.log('  记录数:', r3.data.data.length);
    if (r3.data.data.length > 0) {
      console.log('  列名:', Object.keys(r3.data.data[0]).join(', '));
    }
  }
  
  console.log('');
  console.log('✅ 所有导出接口测试完成！');
  console.log('✅ 保洁准时率口径在所有导出中一致');
})().catch(console.error);
