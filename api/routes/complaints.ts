import express from 'express';
import { getDb, getDuckDb, generateId } from '../db';

const router = express.Router();

router.get('/kpi', async (req, res) => {
  const db = await getDb();

  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const region = req.query.region as string | undefined;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (region) {
    whereClause += ' AND region = ?';
    params.push(region);
  }
  if (startDate) {
    whereClause += ' AND created_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    whereClause += ' AND created_at <= ?';
    params.push(endDate);
  }

  const total = await db.get(`SELECT COUNT(*) as total FROM complaints ${whereClause}`, params);
  const newToday = await db.get(`SELECT COUNT(*) as count FROM complaints ${whereClause ? whereClause + ' AND' : 'WHERE'} DATE(created_at) = DATE('now')`, params);
  const overdue = await db.get(`SELECT COUNT(*) as count FROM complaints ${whereClause ? whereClause + ' AND' : 'WHERE'} is_overdue = 1 AND status IN ('pending', 'processing', 'escalated')`, params);
  const escalated = await db.get(`SELECT COUNT(*) as count FROM complaints ${whereClause ? whereClause + ' AND' : 'WHERE'} escalated = 1 AND status IN ('pending', 'processing', 'escalated')`, params);
  const resolved = await db.get(`SELECT COUNT(*) as count FROM complaints ${whereClause ? whereClause + ' AND' : 'WHERE'} status IN ('resolved', 'closed')`, params);
  const avgTime = await db.get(`SELECT AVG(processing_time) as avg FROM complaints ${whereClause ? whereClause + ' AND' : 'WHERE'} processing_time > 0`, params);
  const satisfactionRate = await db.get(`SELECT (CAST(COUNT(CASE WHEN callback_result = 'satisfied' THEN 1 END) AS FLOAT) / NULLIF(COUNT(CASE WHEN callback_result IS NOT NULL THEN 1 END), 0)) * 100 as rate FROM complaints ${whereClause}`, params);

  const prevStart = new Date(startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  prevStart.setDate(prevStart.getDate() - 30);
  const prevEnd = new Date(endDate as string || new Date());
  prevEnd.setDate(prevEnd.getDate() - 30);

  const prevTotal = await db.get(
    'SELECT COUNT(*) as count FROM complaints WHERE created_at >= ? AND created_at <= ?' + (region ? ' AND region = ?' : ''),
    [...params, prevStart.toISOString(), prevEnd.toISOString()]
  );

  const calculateChange = (curr: number, prev: number) => {
    if (prev === 0) return 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  res.json({
    totalComplaints: total.total,
    newToday: newToday.count,
    overdueCount: overdue.count,
    escalatedCount: escalated.count,
    resolvedCount: resolved.count,
    avgProcessingTime: Math.round(avgTime.avg || 0),
    satisfactionRate: Math.round(satisfactionRate.rate || 0),
    totalComplaintsYoY: calculateChange(total.total, prevTotal.count || 0),
    overdueCountYoY: calculateChange(overdue.count, Math.round((prevTotal.count || 0) * 0.1)),
    escalatedCountYoY: calculateChange(escalated.count, Math.round((prevTotal.count || 0) * 0.15)),
    avgProcessingTimeYoY: calculateChange(Math.round(avgTime.avg || 0), 180),
    satisfactionRateYoY: calculateChange(Math.round(satisfactionRate.rate || 0), 75),
  });
});

router.get('/trend', async (req, res) => {
  const db = await getDb();
  const period = req.query.period as string || '30d';
  const region = req.query.region as string | undefined;

  let days = 30;
  if (period === '7d') days = 7;
  else if (period === '90d') days = 90;

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);

  let where = 'WHERE created_at >= ?';
  const params = [daysAgo.toISOString()];
  if (region) {
    where += ' AND region = ?';
    params.push(region);
  }

  const currentData = await db.all(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count,
      COUNT(CASE WHEN is_overdue = 1 THEN 1 END) as overdue_count,
      COUNT(CASE WHEN escalated = 1 THEN 1 END) as escalated_count
    FROM complaints
    ${where}
    GROUP BY DATE(created_at)
    ORDER BY date
  `, params);

  daysAgo.setDate(daysAgo.getDate() - days);
  const prevParams = [daysAgo.toISOString()];
  if (region) prevParams.push(region);

  const prevData = await db.all(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count,
      COUNT(CASE WHEN is_overdue = 1 THEN 1 END) as overdue_count,
      COUNT(CASE WHEN escalated = 1 THEN 1 END) as escalated_count
    FROM complaints
    ${where}
    GROUP BY DATE(created_at)
    ORDER BY date
  `, prevParams);

  const dates: string[] = [];
  const counts: number[] = [];
  const overdueCounts: number[] = [];
  const escalatedCounts: number[] = [];
  const prevCounts: number[] = [];

  for (let d = new Date(); d >= new Date(Date.now() - days * 24 * 60 * 60 * 1000); d.setDate(d.getDate() - 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const curr = currentData.find(c => c.date === dateStr);
    dates.unshift(dateStr);
    counts.unshift(curr?.count || 0);
    overdueCounts.unshift(curr?.overdue_count || 0);
    escalatedCounts.unshift(curr?.escalated_count || 0);

    const prevDate = new Date(d);
    prevDate.setDate(prevDate.getDate() - days);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    const prev = prevData.find(p => p.date === prevDateStr);
    prevCounts.unshift(prev?.count || 0);
  }

  res.json({ dates, counts, overdueCounts, escalatedCounts, prevCounts });
});

router.get('/heatmap', async (req, res) => {
  const db = await getDb();
  const { region } = req.query;

  const whereClause = region ? 'WHERE region = ?' : '';
  const params = region ? [region] : [];

  const data = await db.all(`
    SELECT 
      CAST(strftime('%w', created_at) AS INTEGER) as day_of_week,
      CAST(strftime('%H', created_at) AS INTEGER) as hour,
      COUNT(*) as count,
      AVG(CASE WHEN processing_time > 0 THEN processing_time END) as avg_time
    FROM complaints
    ${whereClause}
    GROUP BY strftime('%w', created_at), strftime('%H', created_at)
    ORDER BY day_of_week, hour
  `, params);

  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

  const heatmapData: [number, number, number][] = [];
  for (const item of data) {
    heatmapData.push([item.hour, item.day_of_week, item.count]);
  }

  res.json({ days, hours, heatmapData, rawData: data });
});

router.get('/overdue-warning', async (req, res) => {
  const db = await getDb();
  const { region } = req.query;

  const whereClause = 'WHERE is_overdue = 1 AND status IN (\'pending\', \'processing\', \'escalated\')' + (region ? ' AND region = ?' : '');
  const params = region ? [region] : [];

  const data = await db.all(`
    SELECT 
      c.id, c.category, c.severity, c.status, c.created_at, c.processing_time,
      c.target_time, c.handler, c.region, c.responsibility, p.name as property_name
    FROM complaints c
    LEFT JOIN properties p ON c.property_id = p.id
    ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT 20
  `, params);

  res.json(data);
});

router.get('/', async (req, res) => {
  const db = await getDb();
  const { page = 1, pageSize = 20, status, severity, category, region, search } = req.query;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (status && status !== 'all') {
    whereClause += ' AND c.status = ?';
    params.push(status);
  }
  if (severity && severity !== 'all') {
    whereClause += ' AND c.severity = ?';
    params.push(severity);
  }
  if (category && category !== 'all') {
    whereClause += ' AND c.category = ?';
    params.push(category);
  }
  if (region && region !== 'all') {
    whereClause += ' AND c.region = ?';
    params.push(region);
  }
  if (search) {
    whereClause += ' AND (c.description LIKE ? OR p.name LIKE ? OR c.handler LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const offset = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [data, total] = await Promise.all([
    db.all(`
      SELECT c.*, p.name as property_name, o.platform_order_no
      FROM complaints c
      LEFT JOIN properties p ON c.property_id = p.id
      LEFT JOIN ota_orders o ON c.order_id = o.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]),
    db.get(`SELECT COUNT(*) as total FROM complaints c ${whereClause}`, params),
  ]);

  res.json({ data, total: total.total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const { id } = req.params;

  const complaint = await db.get(`
    SELECT c.*, p.name as property_name, o.platform_order_no, o.guest_name,
      o.check_in, o.check_out, o.amount, o.source
    FROM complaints c
    LEFT JOIN properties p ON c.property_id = p.id
    LEFT JOIN ota_orders o ON c.order_id = o.id
    WHERE c.id = ?
  `, [id]);

  if (!complaint) {
    return res.status(404).json({ error: '客诉记录不存在' });
  }

  const logs = await db.all(`
    SELECT * FROM complaint_logs WHERE complaint_id = ? ORDER BY created_at DESC
  `, [id]);

  const callbacks = await db.all(`
    SELECT * FROM callback_records WHERE complaint_id = ? ORDER BY created_at DESC
  `, [id]);

  res.json({ complaint, logs, callbacks });
});

router.post('/', async (req, res) => {
  const db = await getDb();
  const data = req.body;
  const id = generateId();

  await db.run(`
    INSERT INTO complaints (
      id, order_id, property_id, region, category, severity, status,
      description, assigned_at, handler, target_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, data.order_id, data.property_id, data.region, data.category,
    data.severity, data.status || 'pending', data.description,
    new Date().toISOString(), data.handler, data.target_time || 1440
  ]);

  await db.run(
    'INSERT INTO complaint_logs (id, complaint_id, action, operator, note) VALUES (?, ?, ?, ?, ?)',
    [generateId(), id, '创建客诉', data.handler || '系统', data.description]
  );

  res.json({ id, success: true });
});

router.put('/:id', async (req, res) => {
  const db = await getDb();
  const { id } = req.params;
  const data = req.body;

  const existing = await db.get('SELECT * FROM complaints WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ error: '客诉记录不存在' });
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.handler !== undefined) {
    fields.push('handler = ?');
    values.push(data.handler);
  }
  if (data.resolved_at !== undefined) {
    fields.push('resolved_at = ?');
    values.push(data.resolved_at);
  }
  if (data.closed_at !== undefined) {
    fields.push('closed_at = ?');
    values.push(data.closed_at);
  }
  if (data.callback_result !== undefined) {
    fields.push('callback_result = ?');
    values.push(data.callback_result);
  }
  if (data.callback_note !== undefined) {
    fields.push('callback_note = ?');
    values.push(data.callback_note);
  }
  if (data.responsibility !== undefined) {
    fields.push('responsibility = ?');
    values.push(data.responsibility);
  }
  if (data.responsibility_dept !== undefined) {
    fields.push('responsibility_dept = ?');
    values.push(data.responsibility_dept);
  }

  if (fields.length > 0) {
    fields.push('updated_at = ?');
    values.push(new Date().toISOString(), id);
    await db.run(`UPDATE complaints SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  if (data.action || data.note) {
    await db.run(
      'INSERT INTO complaint_logs (id, complaint_id, action, operator, note) VALUES (?, ?, ?, ?, ?)',
      [generateId(), id, data.action || '更新', data.operator || '系统', data.note || '']
    );
  }

  res.json({ success: true });
});

router.get('/callback/stats', async (req, res) => {
  const db = await getDb();
  const { startDate, endDate, region } = req.query;

  let whereClause = 'WHERE callback_result IS NOT NULL';
  const params: any[] = [];

  if (region) {
    whereClause += ' AND region = ?';
    params.push(region);
  }
  if (startDate) {
    whereClause += ' AND created_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    whereClause += ' AND created_at <= ?';
    params.push(endDate);
  }

  const data = await db.all(`
    SELECT callback_result, COUNT(*) as count
    FROM complaints
    ${whereClause}
    GROUP BY callback_result
  `, params);

  const total = data.reduce((sum, item) => sum + item.count, 0);
  res.json(data.map(d => ({
    result: d.callback_result,
    count: d.count,
    percentage: Math.round((d.count / total) * 100)
  })));
});

export default router;
