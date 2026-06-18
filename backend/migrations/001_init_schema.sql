-- ================================================
-- 二手车过户材料风险监测系统 - 初始化 DDL
-- PRD 文档完整建表脚本
-- ================================================

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============ 枚举类型 ============
DO $$ BEGIN
    CREATE TYPE turnover_stage AS ENUM ('inbound','preparation','test_drive','quoting','deal','transfer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE risk_level    AS ENUM ('low','medium','high','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE document_type   AS ENUM ('driving_license','registration_cert','purchase_tax','insurance_policy','invoice','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('present','missing','pending','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE sync_source AS ENUM ('vehicle_source','finance','inspector');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============ 门店表（含空间索引） ============
DROP TABLE IF EXISTS stores CASCADE;
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(128) NOT NULL,
    code VARCHAR(32) NOT NULL UNIQUE,
    region VARCHAR(64) NOT NULL,
    address TEXT NOT NULL,
    location GEOGRAPHY(Point, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stores_location ON stores USING GIST(location);
CREATE INDEX idx_stores_region   ON stores(region);


-- ============ 车辆表 ============
DROP TABLE IF EXISTS vehicles CASCADE;
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vin VARCHAR(17) NOT NULL UNIQUE,
    plate_number VARCHAR(16),
    brand VARCHAR(64) NOT NULL,
    model VARCHAR(128) NOT NULL,
    year INTEGER NOT NULL,
    mileage INTEGER NOT NULL DEFAULT 0,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    inbound_date DATE NOT NULL,
    stage turnover_stage NOT NULL DEFAULT 'inbound',
    stock_days INTEGER NOT NULL DEFAULT 0,
    document_completion SMALLINT NOT NULL DEFAULT 0 CHECK (document_completion BETWEEN 0 AND 100),
    risk_level risk_level NOT NULL DEFAULT 'low',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_store     ON vehicles(store_id);
CREATE INDEX idx_vehicles_stage     ON vehicles(stage);
CREATE INDEX idx_vehicles_risk      ON vehicles(risk_level);
CREATE INDEX idx_vehicles_stock     ON vehicles(stock_days);
CREATE INDEX idx_vehicles_inbound   ON vehicles(inbound_date DESC);
CREATE INDEX idx_vehicles_composite ON vehicles(store_id, stage, risk_level);


-- ============ 触发器：自动维护 stock_days ============
CREATE OR REPLACE FUNCTION update_stock_days() RETURNS trigger AS $$
BEGIN
    NEW.stock_days := (CURRENT_DATE - NEW.inbound_date);
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vehicles_stock_days ON vehicles;
CREATE TRIGGER trg_vehicles_stock_days
    BEFORE INSERT OR UPDATE OF inbound_date ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_stock_days();


-- ============ 触发器：自动维护 updated_at ============
CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stores_updated_at ON stores;
CREATE TRIGGER trg_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS trg_vehicles_updated_at ON vehicles;
CREATE TRIGGER trg_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- ============ 材料表 ============
DROP TABLE IF EXISTS document_items CASCADE;
CREATE TABLE document_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    doc_type document_type NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    status document_status NOT NULL DEFAULT 'missing',
    uploaded_at TIMESTAMPTZ,
    expire_at TIMESTAMPTZ,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by VARCHAR(64),
    verified_at TIMESTAMPTZ,
    UNIQUE(vehicle_id, doc_type)
);

CREATE INDEX idx_doc_vehicle ON document_items(vehicle_id);
CREATE INDEX idx_doc_status  ON document_items(status);
CREATE INDEX idx_doc_expire  ON document_items(expire_at) WHERE expire_at IS NOT NULL;


-- ============ 预警表 ============
DROP TABLE IF EXISTS alerts CASCADE;
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    rule_id UUID,
    doc_type document_type,
    level risk_level NOT NULL,
    message TEXT NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

CREATE INDEX idx_alerts_vehicle     ON alerts(vehicle_id);
CREATE INDEX idx_alerts_store       ON alerts(store_id);
CREATE INDEX idx_alerts_level       ON alerts(level);
CREATE INDEX idx_alerts_triggered   ON alerts(triggered_at DESC);
CREATE INDEX idx_alerts_open        ON alerts(resolved, acknowledged) WHERE NOT resolved;
CREATE INDEX idx_alerts_composite   ON alerts(store_id, level, resolved);


-- ============ 规则/阈值表 ============
DROP TABLE IF EXISTS warning_rules CASCADE;
CREATE TABLE warning_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(128) NOT NULL,
    description TEXT,
    dsl_expression TEXT NOT NULL,
    default_level risk_level NOT NULL DEFAULT 'medium',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    params JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_warning_rules_updated_at ON warning_rules;
CREATE TRIGGER trg_warning_rules_updated_at
    BEFORE UPDATE ON warning_rules
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- ============ 整备记录 ============
DROP TABLE IF EXISTS preparation_records CASCADE;
CREATE TABLE preparation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    item_name VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL,
    cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(16) NOT NULL DEFAULT 'todo',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prep_vehicle   ON preparation_records(vehicle_id);
CREATE INDEX idx_prep_store     ON preparation_records(store_id);
CREATE INDEX idx_prep_status    ON preparation_records(status);
CREATE INDEX idx_prep_completed ON preparation_records(completed_at DESC);


-- ============ 试驾记录 ============
DROP TABLE IF EXISTS test_drive_records CASCADE;
CREATE TABLE test_drive_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    customer_name VARCHAR(64) NOT NULL,
    customer_phone VARCHAR(32),
    mileage_before INTEGER NOT NULL,
    mileage_after INTEGER NOT NULL,
    salesman VARCHAR(64),
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    drive_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_td_vehicle ON test_drive_records(vehicle_id);
CREATE INDEX idx_td_store   ON test_drive_records(store_id);
CREATE INDEX idx_td_date    ON test_drive_records(drive_at DESC);
CREATE INDEX idx_td_rating  ON test_drive_records(rating);


-- ============ 报价记录 ============
DROP TABLE IF EXISTS quote_records CASCADE;
CREATE TABLE quote_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL,
    source VARCHAR(32) NOT NULL DEFAULT '门店',
    customer_contact VARCHAR(64),
    is_deal BOOLEAN NOT NULL DEFAULT FALSE,
    deal_price NUMERIC(12,2),
    quoted_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_quote_vehicle   ON quote_records(vehicle_id);
CREATE INDEX idx_quote_store     ON quote_records(store_id);
CREATE INDEX idx_quote_date      ON quote_records(quoted_at DESC);
CREATE INDEX idx_quote_deal      ON quote_records(is_deal);
CREATE INDEX idx_quote_composite ON quote_records(store_id, quoted_at, is_deal);


-- ============ 同步日志 ============
DROP TABLE IF EXISTS sync_logs CASCADE;
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source sync_source NOT NULL,
    batch_no VARCHAR(64) NOT NULL UNIQUE,
    total_records INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    failed_details JSONB,
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ,
    status VARCHAR(16) NOT NULL DEFAULT 'running'
);

CREATE INDEX idx_sync_source  ON sync_logs(source);
CREATE INDEX idx_sync_status  ON sync_logs(status);
CREATE INDEX idx_sync_started ON sync_logs(started_at DESC);


-- ============ 物化视图：每源最后同步时间（用于判断延迟） ============
DROP MATERIALIZED VIEW IF EXISTS mv_last_sync;
CREATE MATERIALIZED VIEW mv_last_sync AS
SELECT DISTINCT ON (source)
    source,
    finished_at AS last_sync_at,
    status
FROM sync_logs
WHERE finished_at IS NOT NULL
ORDER BY source, finished_at DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_last_sync_source ON mv_last_sync(source);
REFRESH MATERIALIZED VIEW mv_last_sync;


-- ============ 视图：车辆材料完成度（辅助计算） ============
CREATE OR REPLACE VIEW v_vehicle_doc_summary AS
SELECT
    v.id                AS vehicle_id,
    v.vin,
    v.store_id,
    COUNT(d.id)         AS total_docs,
    COUNT(d.id) FILTER (WHERE d.status = 'present') AS present_docs,
    CASE WHEN COUNT(d.id) = 0 THEN 0
         ELSE ROUND(100.0 * COUNT(d.id) FILTER (WHERE d.status = 'present') / COUNT(d.id))::SMALLINT
    END AS completion_pct
FROM vehicles v
LEFT JOIN document_items d ON d.vehicle_id = v.id
GROUP BY v.id, v.vin, v.store_id;


-- ============ 初始数据 ============
-- 测试门店（含经纬度）
INSERT INTO stores (name, code, region, address, location) VALUES
('北京朝阳旗舰门店', 'BJ-CY-001', '华北区', '北京市朝阳区建国路88号',
 ST_SetSRID(ST_MakePoint(116.466170, 39.914885), 4326)::geography),
('上海浦东体验中心', 'SH-PD-001', '华东区', '上海市浦东新区世纪大道1200号',
 ST_SetSRID(ST_MakePoint(121.514730, 31.229950), 4326)::geography),
('深圳南山门店', 'SZ-NS-001', '华南区', '深圳市南山区科技园南区科苑路8号',
 ST_SetSRID(ST_MakePoint(113.946200, 22.540400), 4326)::geography),
('广州天河门店', 'GZ-TH-001', '华南区', '广州市天河区珠江新城华夏路10号',
 ST_SetSRID(ST_MakePoint(113.324050, 23.129100), 4326)::geography),
('杭州西湖门店', 'HZ-XH-001', '华东区', '杭州市西湖区文三路478号',
 ST_SetSRID(ST_MakePoint(120.129700, 30.279000), 4326)::geography),
('成都高新门店', 'CD-GX-001', '西南区', '成都市高新区天府大道中段666号',
 ST_SetSRID(ST_MakePoint(104.065730, 30.543480), 4326)::geography),
('武汉光谷门店', 'WH-GG-001', '华中区', '武汉市东湖高新区珞瑜路727号',
 ST_SetSRID(ST_MakePoint(114.406080, 30.508060), 4326)::geography),
('西安雁塔门店', 'XA-YT-001', '西北区', '西安市雁塔区高新路50号',
 ST_SetSRID(ST_MakePoint(108.940170, 34.231700), 4326)::geography)
ON CONFLICT (code) DO NOTHING;


-- 默认预警规则
INSERT INTO warning_rules (name, description, dsl_expression, default_level, params) VALUES
('行驶证缺失-整备前', '进入整备阶段前必须上传行驶证，否则触发高风险预警',
 'stage == ''preparation'' AND doc_status(''driving_license'') == ''missing''', 'high',
 '{"warning_days": 3, "critical_days": 7, "escalation_interval": 2}'),
('登记证缺失-报价前', '车辆进入报价阶段前必须提供登记证',
 'stage == ''quoting'' AND doc_status(''registration_cert'') == ''missing''', 'high',
 '{"warning_days": 2, "critical_days": 5, "escalation_interval": 1}'),
('购置税缺失-成交前', '成交过户前需具备购置税完税证明',
 'stage == ''deal'' AND doc_status(''purchase_tax'') == ''missing''', 'critical',
 '{"warning_days": 1, "critical_days": 3, "escalation_interval": 1}'),
('交强险过期/缺失', '交强险保单缺失或已过期触发预警',
 'doc_status(''insurance_policy'') == ''missing'' OR doc_status(''insurance_policy'') == ''expired''', 'medium',
 '{"warning_days": 5, "critical_days": 15, "escalation_interval": 5}'),
('购车发票缺失-过户前', '过户前必须有购车发票',
 'stage == ''transfer'' AND doc_status(''invoice'') == ''missing''', 'critical',
 '{"warning_days": 1, "critical_days": 2, "escalation_interval": 1}'),
('超长库龄-材料不全', '库龄超过30天且材料完成度低于50%标记为高风险',
 'stock_days > 30 AND stage != ''transfer''', 'high',
 '{"warning_days": 30, "critical_days": 60, "escalation_interval": 7}')
ON CONFLICT DO NOTHING;


-- 测试车辆（带完整材料集合）
INSERT INTO vehicles (vin, plate_number, brand, model, year, mileage, store_id, inbound_date, stage, document_completion, risk_level)
SELECT
    'LBV5S310XKM' || LPAD(g::TEXT, 5, '0'),
    CASE WHEN g % 2 = 0 THEN '京A' || LPAD(g::TEXT, 5, '0') ELSE NULL END,
    CASE g % 5
        WHEN 0 THEN '宝马'
        WHEN 1 THEN '奔驰'
        WHEN 2 THEN '奥迪'
        WHEN 3 THEN '比亚迪'
        ELSE '特斯拉'
    END,
    CASE g % 5
        WHEN 0 THEN '3系 325Li'
        WHEN 1 THEN 'C级 C260L'
        WHEN 2 THEN 'A4L 40TFSI'
        WHEN 3 THEN '汉 EV 创世版'
        ELSE 'Model Y 长续航'
    END,
    2020 + (g % 4),
    10000 + (g * 731) % 90000,
    (SELECT id FROM stores ORDER BY id LIMIT 1 OFFSET (g % 8)),
    CURRENT_DATE - (1 + (g * 3) % 120),
    CASE g % 6
        WHEN 0 THEN 'inbound'
        WHEN 1 THEN 'preparation'
        WHEN 2 THEN 'test_drive'
        WHEN 3 THEN 'quoting'
        WHEN 4 THEN 'deal'
        ELSE 'transfer'
    END::turnover_stage,
    (100 - (g * 13) % 101)::SMALLINT,
    CASE (g * 7) % 4
        WHEN 0 THEN 'low'
        WHEN 1 THEN 'medium'
        WHEN 2 THEN 'high'
        ELSE 'critical'
    END::risk_level
FROM generate_series(1, 20) g;


-- 车辆材料数据
INSERT INTO document_items (vehicle_id, doc_type, display_name, status, uploaded_at, verified, verified_at)
SELECT
    v.id,
    dt.doc_type,
    dt.display_name,
    CASE
        WHEN (v.document_completion >= 80 AND dt.rank <= 6) THEN 'present'
        WHEN (v.document_completion >= 50 AND dt.rank <= 4) THEN 'present'
        WHEN (v.document_completion >= 25 AND dt.rank <= 2) THEN 'present'
        WHEN (random() < 0.15) THEN 'pending'
        WHEN (dt.rank = 4 AND random() < 0.1) THEN 'expired'
        ELSE 'missing'
    END::document_status,
    CASE WHEN (v.document_completion >= 25 OR random() < 0.5)
         THEN (v.inbound_date + (random() * 10)::INT + INTERVAL '9 hours') ELSE NULL END,
    random() < 0.7,
    CASE WHEN random() < 0.7
         THEN (v.inbound_date + (random() * 12)::INT + INTERVAL '14 hours') ELSE NULL END
FROM vehicles v
CROSS JOIN (
    VALUES
        (1, 'driving_license'::document_type,   '机动车行驶证'),
        (2, 'registration_cert'::document_type, '机动车登记证书'),
        (3, 'purchase_tax'::document_type,      '车辆购置税完税证明'),
        (4, 'insurance_policy'::document_type,  '机动车交强险保单'),
        (5, 'invoice'::document_type,           '二手车销售统一发票'),
        (6, 'other'::document_type,             '其他过户辅助材料')
) AS dt(rank, doc_type, display_name)
ON CONFLICT (vehicle_id, doc_type) DO NOTHING;


-- 整备记录
INSERT INTO preparation_records (vehicle_id, item_name, category, cost, status, started_at, completed_at, store_id)
SELECT
    v.id,
    CASE p % 5
        WHEN 0 THEN '外观漆面修复'
        WHEN 1 THEN '轮胎更换'
        WHEN 2 THEN '机油保养'
        WHEN 3 THEN '内饰深度清洁'
        ELSE '刹车系统检修'
    END,
    CASE p % 4
        WHEN 0 THEN '外观'
        WHEN 1 THEN '机械'
        WHEN 2 THEN '内饰'
        ELSE '电子'
    END,
    (500 + p * 137) % 5000,
    CASE p % 3
        WHEN 0 THEN 'todo'
        WHEN 1 THEN 'in_progress'
        ELSE 'done'
    END,
    v.inbound_date + (p % 5) + INTERVAL '10:00',
    CASE WHEN p % 3 = 2 THEN v.inbound_date + (p % 5) + 2 + INTERVAL '17:00' ELSE NULL END,
    v.store_id
FROM vehicles v, generate_series(1, 3) p
WHERE v.stage IN ('preparation','test_drive','quoting','deal','transfer');


-- 试驾记录
INSERT INTO test_drive_records (vehicle_id, store_id, customer_name, customer_phone, mileage_before, mileage_after, salesman, rating, feedback, drive_at)
SELECT
    v.id,
    v.store_id,
    CASE t % 4 WHEN 0 THEN '张先生' WHEN 1 THEN '李女士' WHEN 2 THEN '王先生' ELSE '赵女士' END,
    '138' || LPAD((10000000 + (v.id::text::bigint % 90000000) + t * 31)::TEXT, 8, '0'),
    v.mileage + t * 5,
    v.mileage + t * 5 + 5 + (random()*50)::INT,
    CASE t % 3 WHEN 0 THEN '销售员小陈' WHEN 1 THEN '销售主管刘经理' ELSE '销售小王' END,
    1 + (t % 5),
    CASE t % 5
        WHEN 0 THEN '动力充足，空间满意'
        WHEN 1 THEN '舒适性不错，但价格偏高'
        WHEN 2 THEN '外观设计好看，试驾体验好'
        WHEN 3 THEN '内饰豪华感强'
        ELSE '减震略硬，需要再考虑'
    END,
    v.inbound_date + 5 + (t % 20) + INTERVAL '15:00'
FROM vehicles v, generate_series(1, CASE WHEN v.stock_days > 7 THEN 2 ELSE 0 END + (v.id::text::bigint % 3)) t
WHERE v.stage IN ('test_drive','quoting','deal','transfer');


-- 报价记录
INSERT INTO quote_records (vehicle_id, store_id, amount, source, customer_contact, is_deal, deal_price, quoted_at)
SELECT
    v.id,
    v.store_id,
    ROUND(150000 + (v.year - 2020) * 15000 + (v.mileage / 10000) * (-8000) + q * (-2500) + (random()*20000 - 10000))::NUMERIC(12,2),
    CASE q % 3 WHEN 0 THEN '门店' WHEN 1 THEN '线上' ELSE '转介绍' END,
    CASE q % 2 WHEN 0 THEN '139' || LPAD((q*1234567)::TEXT, 8, '0') ELSE NULL END,
    v.stage IN ('deal','transfer') AND q = (CASE WHEN v.stage IN ('deal','transfer') THEN 1 ELSE 0 END),
    CASE WHEN v.stage IN ('deal','transfer') AND q = 1
         THEN ROUND(150000 + (v.year - 2020) * 15000 + (v.mileage / 10000) * (-8000) + q * (-3000))::NUMERIC(12,2)
         ELSE NULL END,
    v.inbound_date + 10 + (q % 15) + INTERVAL '11:00'
FROM vehicles v, generate_series(1, CASE WHEN v.stock_days > 14 THEN 3 ELSE 1 END) q;


-- 预警记录（基于规则模拟生成）
INSERT INTO alerts (vehicle_id, store_id, rule_id, doc_type, level, message, triggered_at, acknowledged, resolved)
SELECT
    v.id,
    v.store_id,
    wr.id,
    CASE
        WHEN wr.dsl_expression LIKE '%driving_license%'    THEN 'driving_license'::document_type
        WHEN wr.dsl_expression LIKE '%registration_cert%'  THEN 'registration_cert'::document_type
        WHEN wr.dsl_expression LIKE '%purchase_tax%'       THEN 'purchase_tax'::document_type
        WHEN wr.dsl_expression LIKE '%insurance_policy%'   THEN 'insurance_policy'::document_type
        WHEN wr.dsl_expression LIKE '%invoice%'            THEN 'invoice'::document_type
        ELSE NULL
    END,
    wr.default_level,
    '【' || wr.name || '】' || wr.description,
    v.inbound_date + (random() * 15)::INT + INTERVAL '8:30',
    random() < 0.4,
    random() < 0.3
FROM vehicles v
JOIN warning_rules wr ON TRUE
WHERE (
    (wr.dsl_expression LIKE '%preparation%' AND v.stage IN ('preparation','test_drive','quoting','deal'))
    OR (wr.dsl_expression LIKE '%quoting%' AND v.stage IN ('quoting','deal'))
    OR (wr.dsl_expression LIKE '%deal%' AND v.stage IN ('deal','transfer'))
    OR (wr.dsl_expression LIKE '%transfer%' AND v.stage = 'transfer')
    OR (wr.dsl_expression LIKE '%stock_days%' AND v.stock_days > 30)
    OR (wr.dsl_expression LIKE '%insurance_policy%')
)
AND v.document_completion < 80
AND random() < 0.25;


-- 同步日志
INSERT INTO sync_logs (source, batch_no, total_records, success_count, failed_count, started_at, finished_at, status) VALUES
('vehicle_source'::sync_source, 'VEHICLE-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-000001', 150, 147, 3, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 45 minutes', 'success'),
('finance'::sync_source,        'FINANCE-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-000002', 45,  45,  0, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 50 minutes', 'success'),
('inspector'::sync_source,      'INSPECT-' || TO_CHAR(NOW() - INTERVAL '2 days', 'YYYYMMDDHH24MISS') || '-000003', 80,  76,  4, NOW() - INTERVAL '52 hours', NOW() - INTERVAL '51 hours 30 minutes',   'success');

REFRESH MATERIALIZED VIEW mv_last_sync;
