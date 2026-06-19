import express from 'express';
import { getDb, getDuckDb } from '../db';

const router = express.Router();

router.get('/by-duration', async (req, res) => {
  const db = await getDb();
  const region = req.query.region as string | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  let whereClause = 'WHERE processing_time > 0';
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
    SELECT 
      region,
      COUNT(*) as total,
      COUNT(CASE WHEN processing_time <= 60 THEN 1 END) as less_than_1h,
      COUNT(CASE WHEN processing_time > 60 AND processing_time <= 180 THEN 1 END) as between_1_3h,
      COUNT(CASE WHEN processing_time > 180 AND processing_time <= 720 THEN 1 END) as between_3_12h,
      COUNT(CASE WHEN processing_time > 720 AND processing_time <= 1440 THEN 1 END) as between_12_24h,
      COUNT(CASE WHEN processing_time > 1440 THEN 1 END) as more_than_24h,
      AVG(processing_time) as avg_time
    FROM complaints
    ${whereClause}
    GROUP BY region
    ORDER BY avg_time DESC
  `, params);

  const regions: string[] = [];
  const lessThan1h: number[] = [];
  const between1_3h: number[] = [];
  const between3_12h: number[] = [];
  const between12_24h: number[] = [];
  const moreThan24h: number[] = [];
  const avgTimes: number[] = [];

  for (const item of data) {
    regions.push(item.region);
    lessThan1h.push(item.less_than_1h);
    between1_3h.push(item.between_1_3h);
    between3_12h.push(item.between_3_12h);
    between12_24h.push(item.between_12_24h);
    moreThan24h.push(item.more_than_24h);
    avgTimes.push(Math.round(item.avg_time || 0));
  }

  res.json({
    regions,
    lessThan1h,
    between1_3h,
    between3_12h,
    between12_24h,
    moreThan24h,
    avgTimes,
    rawData: data
  });
});

router.get('/by-region', async (req, res) => {
  const db = await getDb();
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (startDate) {
    whereClause += ' AND created_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    whereClause += ' AND created_at <= ?';
    params.push(endDate);
  }

  const data = await db.all(`
    SELECT 
      region,
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
      COUNT(CASE WHEN is_overdue = 1 THEN 1 END) as overdue,
      COUNT(CASE WHEN callback_result = 'satisfied' THEN 1 END) as satisfied,
      COUNT(CASE WHEN callback_result IS NOT NULL THEN 1 END) as callback_total,
      AVG(CASE WHEN processing_time > 0 THEN processing_time END) as avg_processing_time
    FROM complaints
    ${whereClause}
    GROUP BY region
    ORDER BY total DESC
  `, params);

  res.json(data.map(d => ({
    region: d.region,
    total: d.total,
    closed: d.closed,
    closedRate: Math.round((d.closed / d.total) * 100),
    overdue: d.overdue,
    overdueRate: Math.round((d.overdue / d.total) * 100),
    satisfactionRate: d.callback_total > 0
      ? Math.round((d.satisfied / d.callback_total) * 100)
      : 0,
    avgProcessingTime: Math.round(d.avg_processing_time || 0)
  })));
});

router.get('/by-date', async (req, res) => {
  const db = await getDb();
  const days = Number(req.query.days) || 90;
  const region = req.query.region as string | undefined;

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);

  let whereClause = 'WHERE created_at >= ?';
  const params = [daysAgo.toISOString()];
  if (region) {
    whereClause += ' AND region = ?';
    params.push(region);
  }

  const data = await db.all(`
    SELECT 
      strftime('%Y-%m', created_at) as month,
      region,
      COUNT(*) as total,
      COUNT(CASE WHEN is_overdue = 1 THEN 1 END) as overdue,
      COUNT(CASE WHEN escalated = 1 THEN 1 END) as escalated,
      AVG(CASE WHEN processing_time > 0 THEN processing_time END) as avg_time
    FROM complaints
    ${whereClause}
    GROUP BY strftime('%Y-%m', created_at), region
    ORDER BY month, region
  `, params);

  const months = [...new Set(data.map(d => d.month))].sort();
  const regions = [...new Set(data.map(d => d.region))].sort();

  const seriesData: Record<string, { name: string; type: string; data: number[] }> = {};
  for (const r of regions) {
    seriesData[r] = { name: r, type: 'bar', data: [] };
  }

  for (const m of months) {
    for (const r of regions) {
      const item = data.find(d => d.month === m && d.region === r);
      seriesData[r].data.push(item?.total || 0);
    }
  }

  res.json({
    months,
    regions,
    series: Object.values(seriesData),
    rawData: data
  });
});

router.get('/responsibility', async (req, res) => {
  const db = await getDb();
  const { region } = req.query;

  const whereClause = 'WHERE responsibility IS NOT NULL' + (region ? ' AND region = ?' : '');
  const params = region ? [region] : [];

  const data = await db.all(`
    SELECT 
      responsibility as name,
      COUNT(*) as value
    FROM complaints
    ${whereClause}
    GROUP BY responsibility
    ORDER BY value DESC
  `, params);

  res.json(data);
});

router.get('/category', async (req, res) => {
  const db = await getDb();
  const { region } = req.query;

  const whereClause = region ? 'WHERE region = ?' : '';
  const params = region ? [region] : [];

  const data = await db.all(`
    SELECT 
      category as name,
      COUNT(*) as value
    FROM complaints
    ${whereClause}
    GROUP BY category
    ORDER BY value DESC
  `, params);

  res.json(data);
});

router.get('/comparison', async (req, res) => {
  const db = await getDb();
  const period1Start = req.query.period1Start as string | undefined;
  const period1End = req.query.period1End as string | undefined;
  const period2Start = req.query.period2Start as string | undefined;
  const period2End = req.query.period2End as string | undefined;
  const region = req.query.region as string | undefined;

  const queryPeriod = async (start: string, end: string, label: string) => {
    let where = 'WHERE created_at >= ? AND created_at <= ?';
    const params = [start, end];
    if (region) {
      where += ' AND region = ?';
      params.push(region);
    }

    const data = await db.get(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
        COUNT(CASE WHEN is_overdue = 1 THEN 1 END) as overdue,
        COUNT(CASE WHEN escalated = 1 THEN 1 END) as escalated,
        AVG(CASE WHEN processing_time > 0 THEN processing_time END) as avg_time,
        COUNT(CASE WHEN callback_result = 'satisfied' THEN 1 END) as satisfied,
        COUNT(CASE WHEN callback_result IS NOT NULL THEN 1 END) as callback_total
      FROM complaints
      ${where}
    `, params);

    return {
      period: label,
      start,
      end,
      total: data.total,
      closed: data.closed,
      closedRate: data.total > 0 ? Math.round((data.closed / data.total) * 100) : 0,
      overdue: data.overdue,
      overdueRate: data.total > 0 ? Math.round((data.overdue / data.total) * 100) : 0,
      escalated: data.escalated,
      avgProcessingTime: Math.round(data.avg_time || 0),
      satisfactionRate: data.callback_total > 0
        ? Math.round((data.satisfied / data.callback_total) * 100)
        : 0
    };
  };

  const now = new Date();
  const p1Start = period1Start as string || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const p1End = period1End as string || now.toISOString();
  const p2Start = period2Start as string || new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const p2End = period2End as string || new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  const [period1, period2] = await Promise.all([
    queryPeriod(p1Start, p1End, '本期'),
    queryPeriod(p2Start, p2End, '上期')
  ]);

  res.json({ period1, period2 });
});

router.get('/duckdb-test', async (req, res) => {
  const duckDb = getDuckDb();

  try {
    duckDb.all(`
      INSTALL sqlite;
      LOAD sqlite;
      ATTACH './data/complaints.db' AS sqlite_db (TYPE SQLITE);
      
      SELECT 
        c.region,
        COUNT(*) as total_complaints,
        AVG(c.processing_time) as avg_processing_time
      FROM sqlite_db.complaints c
      WHERE c.processing_time > 0
      GROUP BY c.region
      ORDER BY total_complaints DESC
    `, (err: any, result: any) => {
      if (err) {
        res.json({ error: err.message });
      } else {
        res.json(result);
      }
    });
  } catch (e: any) {
    res.json({ error: e.message });
  }
});

export default router;
