import express from 'express';
import { getDb } from '../db';

const router = express.Router();

router.get('/nodes', async (req, res) => {
  const db = await getDb();
  const { sourceType } = req.query;

  const whereClause = sourceType ? 'WHERE source_type = ?' : '';
  const params = sourceType ? [sourceType] : [];

  const data = await db.all(`
    SELECT n.*, 
      (SELECT COUNT(*) FROM sync_logs l WHERE l.node_id = n.id AND l.status = 'success') as success_count,
      (SELECT COUNT(*) FROM sync_logs l WHERE l.node_id = n.id AND l.status = 'failed') as fail_count,
      (SELECT AVG(duration_ms) FROM sync_logs l WHERE l.node_id = n.id) as avg_duration
    FROM sync_nodes n
    ${whereClause}
    ORDER BY source_type, seq_order
  `, params);

  res.json(data);
});

router.get('/nodes/:id/logs', async (req, res) => {
  const db = await getDb();
  const { id } = req.params;
  const { page = 1, pageSize = 50 } = req.query;

  const offset = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [data, total] = await Promise.all([
    db.all(`
      SELECT l.*, b.source_type, b.started_at as batch_start, b.ended_at as batch_end,
        n.name as node_name, n.source_type as node_source_type
      FROM sync_logs l
      LEFT JOIN sync_batches b ON l.batch_id = b.id
      LEFT JOIN sync_nodes n ON l.node_id = n.id
      WHERE l.node_id = ?
      ORDER BY l.started_at DESC
      LIMIT ? OFFSET ?
    `, [id, limit, offset]),
    db.get(`SELECT COUNT(*) as total FROM sync_logs WHERE node_id = ?`, [id]),
  ]);

  res.json({ data, total: total.total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/batches', async (req, res) => {
  const db = await getDb();
  const { sourceType, status, page = 1, pageSize = 20 } = req.query;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (sourceType && sourceType !== 'all') {
    whereClause += ' AND source_type = ?';
    params.push(sourceType);
  }
  if (status && status !== 'all') {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  const offset = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const [data, total] = await Promise.all([
    db.all(`
      SELECT * FROM sync_batches
      ${whereClause}
      ORDER BY started_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]),
    db.get(`SELECT COUNT(*) as total FROM sync_batches ${whereClause}`, params),
  ]);

  res.json({ data, total: total.total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/batches/:id/nodes', async (req, res) => {
  const db = await getDb();
  const { id } = req.params;

  const data = await db.all(`
    SELECT l.*, n.name as node_name, n.seq_order, n.source_type
    FROM sync_logs l
    LEFT JOIN sync_nodes n ON l.node_id = n.id
    WHERE l.batch_id = ?
    ORDER BY n.seq_order, l.started_at
  `, [id]);

  res.json(data);
});

router.get('/audit/flow', async (req, res) => {
  const db = await getDb();
  const { sourceType } = req.query;

  let whereClause = '';
  const params: any[] = [];

  if (sourceType) {
    whereClause = 'WHERE source_type = ?';
    params.push(sourceType);
  }

  const nodes = await db.all(`
    SELECT n.*,
      (SELECT COUNT(*) FROM sync_logs l WHERE l.node_id = n.id AND l.status = 'success') as success_count,
      (SELECT COUNT(*) FROM sync_logs l WHERE l.node_id = n.id AND l.status = 'failed') as fail_count
    FROM sync_nodes n
    ${whereClause}
    ORDER BY source_type, seq_order
  `, params);

  const sourceTypeLabels: Record<string, string> = {
    door_lock: '门锁记录',
    payment: '收款流水',
    ota: 'OTA订单'
  };

  const grouped: Record<string, typeof nodes> = {};
  for (const node of nodes) {
    const type = node.source_type;
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(node);
  }

  const result = Object.entries(grouped).map(([type, typeNodes]) => ({
    sourceType: type,
    sourceTypeLabel: sourceTypeLabels[type] || type,
    nodes: typeNodes.map((n, idx) => ({
      ...n,
      isFirst: idx === 0,
      isLast: idx === typeNodes.length - 1,
      nextNode: idx < typeNodes.length - 1 ? typeNodes[idx + 1].id : null,
    }))
  }));

  res.json(result);
});

router.get('/stats/recent', async (req, res) => {
  const db = await getDb();

  const [nodeStats, batchStats] = await Promise.all([
    db.all(`
      SELECT 
        source_type,
        COUNT(*) as total_nodes,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_nodes,
        COUNT(CASE WHEN status = 'running' THEN 1 END) as running_nodes,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_nodes
      FROM sync_nodes
      GROUP BY source_type
    `),
    db.all(`
      SELECT 
        source_type,
        SUM(total_count) as total_records,
        SUM(success_count) as success_records,
        SUM(fail_count) as fail_records,
        COUNT(*) as total_batches
      FROM sync_batches
      WHERE started_at >= datetime('now', '-24 hours')
      GROUP BY source_type
    `),
  ]);

  const sourceTypeLabels: Record<string, string> = {
    door_lock: '门锁记录',
    payment: '收款流水',
    ota: 'OTA订单'
  };

  const combined = nodeStats.map(ns => {
    const bs = batchStats.find(b => b.source_type === ns.source_type) || {
      total_records: 0, success_records: 0, fail_records: 0, total_batches: 0
    };
    return {
      sourceType: ns.source_type,
      sourceTypeLabel: sourceTypeLabels[ns.source_type] || ns.source_type,
      ...ns,
      ...bs,
      successRate: bs.total_records > 0
        ? Math.round((bs.success_records / bs.total_records) * 100)
        : 0
    };
  });

  res.json(combined);
});

export default router;
