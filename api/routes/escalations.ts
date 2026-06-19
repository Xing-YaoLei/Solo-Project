import express from 'express';
import { getDb } from '../db';

const router = express.Router();

router.get('/timeline', async (req, res) => {
  const db = await getDb();
  const days = Number(req.query.days) || 30;
  const region = req.query.region as string | undefined;

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);

  let where = 'WHERE created_at >= ?';
  const params = [daysAgo.toISOString()];
  if (region) {
    where += ' AND region = ?';
    params.push(region);
  }

  const data = await db.all(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total,
      COUNT(CASE WHEN escalation_level = 1 THEN 1 END) as level1,
      COUNT(CASE WHEN escalation_level = 2 THEN 1 END) as level2,
      COUNT(CASE WHEN escalation_level >= 3 THEN 1 END) as level3
    FROM complaints
    ${where} AND escalated = 1
    GROUP BY DATE(created_at)
    ORDER BY date
  `, params);

  const dates: string[] = [];
  const totals: number[] = [];
  const level1: number[] = [];
  const level2: number[] = [];
  const level3: number[] = [];

  for (let d = new Date(); d >= daysAgo; d.setDate(d.getDate() - 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const item = data.find(x => x.date === dateStr);
    dates.unshift(dateStr);
    totals.unshift(item?.total || 0);
    level1.unshift(item?.level1 || 0);
    level2.unshift(item?.level2 || 0);
    level3.unshift(item?.level3 || 0);
  }

  res.json({ dates, totals, level1, level2, level3 });
});

router.get('/avg-response-time', async (req, res) => {
  const db = await getDb();
  const { region } = req.query;

  const whereClause = region ? 'WHERE region = ?' : '';
  const params = region ? [region] : [];

  const data = await db.all(`
    SELECT 
      escalation_level,
      COUNT(*) as count,
      AVG(CAST((julianday(escalated_at) - julianday(assigned_at)) * 24 * 60 AS INTEGER)) as avg_response_time
    FROM complaints
    ${whereClause} AND escalated = 1
    GROUP BY escalation_level
    ORDER BY escalation_level
  `, params);

  res.json(data.map(d => ({
    level: d.escalation_level,
    levelName: d.escalation_level === 1 ? '一级升级' : d.escalation_level === 2 ? '二级升级' : '三级升级',
    count: d.count,
    avgTime: Math.round(d.avg_response_time || 0)
  })));
});

router.get('/list', async (req, res) => {
  const db = await getDb();
  const { region, level, page = 1, pageSize = 20 } = req.query;

  let whereClause = 'WHERE c.escalated = 1';
  const params: any[] = [];

  if (region && region !== 'all') {
    whereClause += ' AND c.region = ?';
    params.push(region);
  }
  if (level && level !== 'all') {
    whereClause += ' AND c.escalation_level = ?';
    params.push(level);
  }

  const offset = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [data, total] = await Promise.all([
    db.all(`
      SELECT c.*, p.name as property_name
      FROM complaints c
      LEFT JOIN properties p ON c.property_id = p.id
      ${whereClause}
      ORDER BY c.escalated_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]),
    db.get(`SELECT COUNT(*) as total FROM complaints c ${whereClause}`, params),
  ]);

  res.json({ data, total: total.total, page: Number(page), pageSize: Number(pageSize) });
});

export default router;
