import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import duckdb from 'duckdb';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'complaints.db');
const duckdbPath = path.join(dataDir, 'analytics.duckdb');

let db: Database | null = null;
let duckDb: duckdb.Database | null = null;

export function generateId() {
  return crypto.randomUUID();
}

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  }
  return db;
}

export function getDuckDb(): duckdb.Database {
  if (!duckDb) {
    duckDb = new duckdb.Database(duckdbPath);
  }
  return duckDb;
}

export async function initDatabase() {
  const database = await getDb();

  await database.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      region VARCHAR(100) NOT NULL,
      address VARCHAR(500),
      contact VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ota_orders (
      id TEXT PRIMARY KEY,
      platform_order_no VARCHAR(100) NOT NULL UNIQUE,
      property_id TEXT NOT NULL REFERENCES properties(id),
      guest_name VARCHAR(100),
      check_in DATETIME,
      check_out DATETIME,
      amount DECIMAL(10,2),
      source VARCHAR(50),
      synced_at DATETIME,
      sync_batch_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      transaction_no VARCHAR(100) NOT NULL UNIQUE,
      order_id TEXT REFERENCES ota_orders(id),
      property_id TEXT NOT NULL REFERENCES properties(id),
      amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50),
      status VARCHAR(30),
      transacted_at DATETIME,
      synced_at DATETIME,
      sync_batch_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS door_records (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id),
      room_no VARCHAR(30),
      card_no VARCHAR(50),
      action_type VARCHAR(30),
      action_time DATETIME,
      synced_at DATETIME,
      sync_batch_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      order_id TEXT REFERENCES ota_orders(id),
      property_id TEXT NOT NULL REFERENCES properties(id),
      region VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'processing', 'escalated', 'resolved', 'closed')),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      assigned_at DATETIME,
      resolved_at DATETIME,
      closed_at DATETIME,
      handler VARCHAR(100),
      escalated BOOLEAN DEFAULT 0,
      escalated_at DATETIME,
      escalation_level INT DEFAULT 0,
      processing_time INT DEFAULT 0,
      target_time INT NOT NULL DEFAULT 1440,
      is_overdue BOOLEAN DEFAULT 0,
      callback_result VARCHAR(20) CHECK (callback_result IN ('satisfied', 'unsatisfied', 'pending')),
      callback_note TEXT,
      responsibility VARCHAR(100),
      responsibility_dept VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS complaint_logs (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id),
      action VARCHAR(50) NOT NULL,
      operator VARCHAR(100),
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS callback_records (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id),
      result VARCHAR(20) NOT NULL CHECK (result IN ('satisfied', 'unsatisfied', 'pending')),
      note TEXT,
      operator VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_nodes (
      id TEXT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('door_lock', 'payment', 'ota')),
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed')),
      seq_order INT NOT NULL,
      last_sync_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_batches (
      id TEXT PRIMARY KEY,
      source_type VARCHAR(30) NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      status VARCHAR(20) NOT NULL DEFAULT 'running',
      total_count INT DEFAULT 0,
      success_count INT DEFAULT 0,
      fail_count INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sync_logs (
      id TEXT PRIMARY KEY,
      node_id TEXT NOT NULL REFERENCES sync_nodes(id),
      batch_id TEXT NOT NULL REFERENCES sync_batches(id),
      status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
      record_count INT DEFAULT 0,
      duration_ms INT DEFAULT 0,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      error_detail TEXT,
      raw_data_sample TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
    CREATE INDEX IF NOT EXISTS idx_complaints_region ON complaints(region);
    CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at);
    CREATE INDEX IF NOT EXISTS idx_complaints_overdue ON complaints(is_overdue) WHERE is_overdue = 1;
    CREATE INDEX IF NOT EXISTS idx_complaints_property ON complaints(property_id);
    CREATE INDEX IF NOT EXISTS idx_sync_logs_node ON sync_logs(node_id);
    CREATE INDEX IF NOT EXISTS idx_sync_logs_batch ON sync_logs(batch_id);
    CREATE INDEX IF NOT EXISTS idx_sync_logs_created ON sync_logs(started_at);
  `);

  const count = await database.get('SELECT COUNT(*) as count FROM properties');
  if (count.count === 0) {
    await seedData(database);
  }

  console.log('Database initialized successfully');
}

async function seedData(db: Database) {
  console.log('Seeding initial data...');

  const regions = ['华东区', '华南区', '华北区', '西南区', '西北区', '华中区', '东北区'];
  const propertyNames = [
    '西湖畔民宿', '鼓浪屿小院', '丽江古城客栈', '阳朔山水民宿',
    '三亚海景别墅', '黄山云端民宿', '成都宽窄巷子民宿', '西安古城民宿',
    '苏州园林民宿', '杭州茶韵民宿', '南京秦淮河民宿', '北京胡同民宿'
  ];
  const categories = ['卫生问题', '设施故障', '服务态度', '噪音问题', '预订纠纷', '安全问题', '其他'];
  const severities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['pending', 'processing', 'escalated', 'resolved', 'closed'];
  const callbackResults = ['satisfied', 'unsatisfied', 'pending'];
  const responsibilities = ['客房部', '前台', '工程部', '安保部', '保洁部', '管理层'];
  const handlers = ['张三', '李四', '王五', '赵六', '钱七', '孙八'];

  const now = new Date();

  const properties: { id: string; name: string; region: string }[] = [];
  for (let i = 0; i < propertyNames.length; i++) {
    const id = generateId();
    properties.push({ id, name: propertyNames[i], region: regions[i % regions.length] });
    await db.run(
      'INSERT INTO properties (id, name, region, address, contact) VALUES (?, ?, ?, ?, ?)',
      [id, propertyNames[i], regions[i % regions.length], `${regions[i % regions.length]}某某路${i + 1}号`, `138${Math.floor(Math.random() * 90000000 + 10000000)}`]
    );
  }

  const otaOrders: { id: string; property_id: string }[] = [];
  for (let i = 0; i < 200; i++) {
    const id = generateId();
    const prop = properties[Math.floor(Math.random() * properties.length)];
    const checkIn = new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000);
    const checkOut = new Date(checkIn.getTime() + (Math.random() * 7 + 1) * 24 * 60 * 60 * 1000);
    otaOrders.push({ id, property_id: prop.id });
    await db.run(
      'INSERT INTO ota_orders (id, platform_order_no, property_id, guest_name, check_in, check_out, amount, source, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, `OTA${Math.floor(Math.random() * 90000000 + 10000000)}`, prop.id, `客人${i + 1}`, checkIn.toISOString(), checkOut.toISOString(), (Math.random() * 1800 + 200).toFixed(2), ['携程', '美团', '飞猪', 'Airbnb', '途家'][Math.floor(Math.random() * 5)], new Date(checkIn.getTime() - Math.random() * 48 * 60 * 60 * 1000).toISOString()]
    );
  }

  for (let i = 0; i < 150; i++) {
    const order = otaOrders[Math.floor(Math.random() * otaOrders.length)];
    await db.run(
      'INSERT INTO payment_transactions (id, transaction_no, order_id, property_id, amount, payment_method, status, transacted_at, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [generateId(), `PAY${Math.floor(Math.random() * 9000000000 + 1000000000)}`, order.id, order.property_id, (Math.random() * 1800 + 200).toFixed(2), ['微信支付', '支付宝', '银行卡', '现金'][Math.floor(Math.random() * 4)], 'success', new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(), new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()]
    );
  }

  for (let i = 0; i < 300; i++) {
    const prop = properties[Math.floor(Math.random() * properties.length)];
    await db.run(
      'INSERT INTO door_records (id, property_id, room_no, card_no, action_type, action_time, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [generateId(), prop.id, `${String(Math.floor(Math.random() * 5 + 1)).padStart(2, '0')}${String(Math.floor(Math.random() * 20 + 1)).padStart(2, '0')}`, `CARD${Math.floor(Math.random() * 9000 + 1000)}`, ['开门', '关门', '刷卡失败', '反锁'][Math.floor(Math.random() * 4)], new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()]
    );
  }

  const complaintIds: string[] = [];
  for (let i = 0; i < 120; i++) {
    const id = generateId();
    complaintIds.push(id);
    const prop = properties[Math.floor(Math.random() * properties.length)];
    const order = otaOrders.filter(o => o.property_id === prop.id)[Math.floor(Math.random() * otaOrders.filter(o => o.property_id === prop.id).length)] || otaOrders[Math.floor(Math.random() * otaOrders.length)];
    const createdAt = new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const assignedAt = new Date(createdAt.getTime() + Math.random() * 60 * 60 * 1000);
    const targetTime = [60, 120, 360, 720, 1440][Math.floor(Math.random() * 5)];
    const escalated = Math.random() < 0.25;
    let resolvedAt: Date | null = null;
    let closedAt: Date | null = null;
    let processingTime = 0;
    let isOverdue = false;
    let callbackResult: string | null = null;
    let escalatedAt: Date | null = null;
    let escalationLevel = 0;

    if (status === 'resolved' || status === 'closed') {
      resolvedAt = new Date(assignedAt.getTime() + Math.random() * 4320 * 60 * 1000);
      processingTime = Math.floor((resolvedAt.getTime() - assignedAt.getTime()) / 60000);
      isOverdue = processingTime > targetTime;
      if (status === 'closed') {
        closedAt = new Date(resolvedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000);
        callbackResult = callbackResults[Math.floor(Math.random() * callbackResults.length)];
      }
    }

    if (escalated) {
      escalatedAt = new Date(assignedAt.getTime() + Math.random() * 720 * 60 * 1000);
      escalationLevel = Math.floor(Math.random() * 3) + 1;
      if (!isOverdue && status !== 'pending') {
        isOverdue = true;
      }
    }

    await db.run(
      `INSERT INTO complaints (
        id, order_id, property_id, region, category, severity, status, description,
        created_at, assigned_at, resolved_at, closed_at, handler, escalated,
        escalated_at, escalation_level, processing_time, target_time, is_overdue,
        callback_result, callback_note, responsibility, responsibility_dept
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, order?.id || null, prop.id, prop.region, categories[Math.floor(Math.random() * categories.length)],
        severities[Math.floor(Math.random() * severities.length)], status,
        `客人投诉${categories[Math.floor(Math.random() * categories.length)]}相关问题，需要尽快处理。`,
        createdAt.toISOString(), assignedAt.toISOString(),
        resolvedAt?.toISOString() || null, closedAt?.toISOString() || null,
        handlers[Math.floor(Math.random() * handlers.length)],
        escalated ? 1 : 0, escalatedAt?.toISOString() || null, escalationLevel,
        processingTime, targetTime, isOverdue ? 1 : 0,
        callbackResult, callbackResult ? '客人反馈处理结果' : null,
        callbackResult ? responsibilities[Math.floor(Math.random() * responsibilities.length)] : null,
        callbackResult ? responsibilities[Math.floor(Math.random() * responsibilities.length)] : null
      ]
    );

    await db.run(
      'INSERT INTO complaint_logs (id, complaint_id, action, operator, note) VALUES (?, ?, ?, ?, ?)',
      [generateId(), id, '创建客诉', '系统自动', '客诉单已创建']
    );
    await db.run(
      'INSERT INTO complaint_logs (id, complaint_id, action, operator, note) VALUES (?, ?, ?, ?, ?)',
      [generateId(), id, '分配处理人', handlers[Math.floor(Math.random() * handlers.length)], `已分配处理人`]
    );
    if (escalated && escalatedAt) {
      await db.run(
        'INSERT INTO complaint_logs (id, complaint_id, action, operator, note) VALUES (?, ?, ?, ?, ?)',
        [generateId(), id, '升级处理', '系统自动', `客诉已升级至${escalationLevel}级`]
      );
    }
    if (callbackResult) {
      await db.run(
        'INSERT INTO complaint_logs (id, complaint_id, action, operator, note) VALUES (?, ?, ?, ?, ?)',
        [generateId(), id, '客户回访', '客服专员', `回访结果：${callbackResult}`]
      );
      await db.run(
        'INSERT INTO callback_records (id, complaint_id, result, note, operator) VALUES (?, ?, ?, ?, ?)',
        [generateId(), id, callbackResult, '客人反馈处理结果', '客服专员']
      );
    }
  }

  const syncNodeData = [
    ['门锁数据采集', 'door_lock', 1], ['门锁格式校验', 'door_lock', 2],
    ['门锁去重处理', 'door_lock', 3], ['门锁数据转换', 'door_lock', 4],
    ['门锁业务校验', 'door_lock', 5], ['门锁入库持久化', 'door_lock', 6],
    ['门锁DuckDB同步', 'door_lock', 7],
    ['收款数据采集', 'payment', 1], ['收款格式校验', 'payment', 2],
    ['收款去重处理', 'payment', 3], ['收款数据转换', 'payment', 4],
    ['收款业务校验', 'payment', 5], ['收款入库持久化', 'payment', 6],
    ['收款DuckDB同步', 'payment', 7],
    ['OTA数据采集', 'ota', 1], ['OTA格式校验', 'ota', 2],
    ['OTA去重处理', 'ota', 3], ['OTA数据转换', 'ota', 4],
    ['OTA业务校验', 'ota', 5], ['OTA入库持久化', 'ota', 6],
    ['OTADuckDB同步', 'ota', 7],
  ];

  const nodeIds: string[] = [];
  for (const [name, sourceType, seqOrder] of syncNodeData) {
    const id = generateId();
    nodeIds.push(id);
    await db.run(
      'INSERT INTO sync_nodes (id, name, source_type, status, seq_order, last_sync_time) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, sourceType, ['success', 'success', 'success', 'running', 'failed'][Math.floor(Math.random() * 5)], seqOrder, new Date(now.getTime() - Math.random() * 120 * 60 * 1000).toISOString()]
    );
  }

  for (let batchI = 0; batchI < 10; batchI++) {
    for (const sourceType of ['door_lock', 'payment', 'ota']) {
      const batchId = generateId();
      const startedAt = new Date(now.getTime() - batchI * 2 * 60 * 60 * 1000);
      const endedAt = new Date(startedAt.getTime() + (Math.random() * 8 + 2) * 60 * 1000);
      await db.run(
        'INSERT INTO sync_batches (id, source_type, started_at, ended_at, status, total_count, success_count, fail_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [batchId, sourceType, startedAt.toISOString(), endedAt.toISOString(), 'success', Math.floor(Math.random() * 150 + 50), Math.floor(Math.random() * 150 + 48), Math.floor(Math.random() * 3)]
      );

      const sourceNodes = syncNodeData.filter(n => n[1] === sourceType);
      for (let ni = 0; ni < sourceNodes.length; ni++) {
        const nodeIdx = syncNodeData.findIndex(n => n[0] === sourceNodes[ni][0] && n[1] === sourceNodes[ni][1]);
        const nodeId = nodeIds[nodeIdx];
        const status = Math.random() > 0.1 ? 'success' : 'failed';
        await db.run(
          'INSERT INTO sync_logs (id, node_id, batch_id, status, record_count, duration_ms, started_at, ended_at, error_detail, raw_data_sample) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            generateId(), nodeId, batchId, status, Math.floor(Math.random() * 120 + 30),
            Math.floor(Math.random() * 5000 + 50),
            new Date(startedAt.getTime() + ni * 5 * 1000).toISOString(),
            new Date(startedAt.getTime() + ni * 5 * 1000 + Math.random() * 5000 + 50).toISOString(),
            status === 'failed' ? '数据格式校验失败' : null,
            Math.random() > 0.5 ? JSON.stringify({ sample_id: Math.floor(Math.random() * 1000), timestamp: now.toISOString() }) : null
          ]
        );
      }
    }
  }

  console.log('Data seeding completed');
}
