-- 汽车维修预约进厂趋势看板 - 数据库 Schema

-- 车辆档案
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    vin VARCHAR(50) UNIQUE NOT NULL,
    license_plate VARCHAR(20),
    brand VARCHAR(50),
    model VARCHAR(50),
    model_year INTEGER,
    color VARCHAR(30),
    mileage INTEGER,
    owner_name VARCHAR(100),
    owner_phone VARCHAR(20),
    first_registration_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON vehicles(brand);

-- 维修工单
CREATE TABLE IF NOT EXISTS repair_orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    vehicle_id INTEGER REFERENCES vehicles(id),
    appointment_date DATE NOT NULL,
    actual_arrival_date DATE,
    order_type VARCHAR(30),
    order_status VARCHAR(30) DEFAULT 'pending',
    service_advisor VARCHAR(100),
    technician VARCHAR(100),
    total_cost DECIMAL(12,2) DEFAULT 0,
    parts_cost DECIMAL(12,2) DEFAULT 0,
    labor_cost DECIMAL(12,2) DEFAULT 0,
    is_rework BOOLEAN DEFAULT FALSE,
    original_order_id INTEGER REFERENCES repair_orders(id),
    source_system VARCHAR(50),
    source_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_repair_orders_appointment ON repair_orders(appointment_date);
CREATE INDEX IF NOT EXISTS idx_repair_orders_vehicle ON repair_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_status ON repair_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_repair_orders_source ON repair_orders(source_system, source_id);

-- 诊断结果
CREATE TABLE IF NOT EXISTS diagnosis_results (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES repair_orders(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    diagnosis_date DATE NOT NULL,
    fault_code VARCHAR(50),
    fault_description TEXT,
    fault_category VARCHAR(50),
    fault_severity VARCHAR(20),
    diagnostic_method VARCHAR(50),
    technician VARCHAR(100),
    diagnosis_result TEXT,
    is_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diagnosis_order ON diagnosis_results(order_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_vehicle ON diagnosis_results(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_fault_code ON diagnosis_results(fault_code);
CREATE INDEX IF NOT EXISTS idx_diagnosis_date ON diagnosis_results(diagnosis_date);

-- 工单项目
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES repair_orders(id),
    item_type VARCHAR(30) NOT NULL,
    item_code VARCHAR(50),
    item_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(12,2) DEFAULT 0,
    is_warranty BOOLEAN DEFAULT FALSE,
    technician VARCHAR(100),
    work_hours DECIMAL(6,2),
    source_item_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_type ON order_items(item_type);
CREATE INDEX IF NOT EXISTS idx_order_items_code ON order_items(item_code);

-- 保险材料
CREATE TABLE IF NOT EXISTS insurance_materials (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES repair_orders(id),
    insurance_company VARCHAR(100),
    policy_no VARCHAR(50),
    claim_no VARCHAR(50),
    damage_type VARCHAR(50),
    accident_date DATE,
    damage_description TEXT,
    estimated_amount DECIMAL(12,2),
    approved_amount DECIMAL(12,2),
    claim_status VARCHAR(30),
    source_system VARCHAR(50),
    source_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_insurance_order ON insurance_materials(order_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claim ON insurance_materials(claim_no);
CREATE INDEX IF NOT EXISTS idx_insurance_source ON insurance_materials(source_system, source_id);

-- 配件库存
CREATE TABLE IF NOT EXISTS parts_inventory (
    id SERIAL PRIMARY KEY,
    part_code VARCHAR(50) UNIQUE NOT NULL,
    part_name VARCHAR(200) NOT NULL,
    part_category VARCHAR(50),
    brand VARCHAR(50),
    unit VARCHAR(20),
    unit_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    safe_stock_level INTEGER DEFAULT 10,
    supplier VARCHAR(100),
    source_system VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parts_code ON parts_inventory(part_code);
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts_inventory(part_category);

-- 配件使用记录
CREATE TABLE IF NOT EXISTS parts_usage (
    id SERIAL PRIMARY KEY,
    order_item_id INTEGER REFERENCES order_items(id),
    order_id INTEGER REFERENCES repair_orders(id),
    part_code VARCHAR(50),
    part_name VARCHAR(200),
    quantity DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    is_shortage BOOLEAN DEFAULT FALSE,
    shortage_quantity DECIMAL(10,2) DEFAULT 0,
    restock_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parts_usage_order ON parts_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_parts_usage_shortage ON parts_usage(is_shortage);
CREATE INDEX IF NOT EXISTS idx_parts_usage_code ON parts_usage(part_code);

-- 返修记录
CREATE TABLE IF NOT EXISTS rework_records (
    id SERIAL PRIMARY KEY,
    original_order_id INTEGER REFERENCES repair_orders(id),
    rework_order_id INTEGER REFERENCES repair_orders(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    rework_reason TEXT,
    rework_type VARCHAR(50),
    rework_date DATE,
    is_parts_related BOOLEAN DEFAULT FALSE,
    related_part_codes TEXT[],
    caliber_version VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rework_original ON rework_records(original_order_id);
CREATE INDEX IF NOT EXISTS idx_rework_vehicle ON rework_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_rework_date ON rework_records(rework_date);
CREATE INDEX IF NOT EXISTS idx_rework_caliber ON rework_records(caliber_version);

-- 返修率口径版本
CREATE TABLE IF NOT EXISTS rework_rate_caliber_versions (
    id SERIAL PRIMARY KEY,
    version_code VARCHAR(20) UNIQUE NOT NULL,
    version_name VARCHAR(100) NOT NULL,
    description TEXT,
    definition_formula TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    effective_date DATE,
    created_by VARCHAR(100),
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_caliber_version ON rework_rate_caliber_versions(version_code);
CREATE INDEX IF NOT EXISTS idx_caliber_active ON rework_rate_caliber_versions(is_active);

-- 阈值配置
CREATE TABLE IF NOT EXISTS threshold_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_name VARCHAR(200) NOT NULL,
    config_value VARCHAR(500),
    config_type VARCHAR(20) DEFAULT 'number',
    category VARCHAR(50),
    description TEXT,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_threshold_key ON threshold_config(config_key);
CREATE INDEX IF NOT EXISTS idx_threshold_category ON threshold_config(category);

-- ETL 运行日志
CREATE TABLE IF NOT EXISTS etl_run_log (
    id SERIAL PRIMARY KEY,
    task_name VARCHAR(100) NOT NULL,
    source_system VARCHAR(50),
    run_date DATE NOT NULL,
    records_input INTEGER DEFAULT 0,
    records_output INTEGER DEFAULT 0,
    records_deduplicated INTEGER DEFAULT 0,
    records_invalid INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'running',
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_etl_task ON etl_run_log(task_name);
CREATE INDEX IF NOT EXISTS idx_etl_date ON etl_run_log(run_date);
CREATE INDEX IF NOT EXISTS idx_etl_status ON etl_run_log(status);

-- 复盘材料
CREATE TABLE IF NOT EXISTS review_materials (
    id SERIAL PRIMARY KEY,
    review_date DATE NOT NULL,
    review_type VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    summary TEXT,
    key_metrics JSONB,
    related_part_codes TEXT[],
    related_order_ids INTEGER[],
    caliber_version VARCHAR(20),
    status VARCHAR(20) DEFAULT 'draft',
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_date ON review_materials(review_date);
CREATE INDEX IF NOT EXISTS idx_review_type ON review_materials(review_type);
CREATE INDEX IF NOT EXISTS idx_review_caliber ON review_materials(caliber_version);

-- 初始化默认口径版本
INSERT INTO rework_rate_caliber_versions (
    version_code, version_name, description, definition_formula,
    is_active, effective_date, created_by, change_reason
) VALUES (
    'v1.0', '基础口径', '同一车辆30天内同故障二次进厂计为返修',
    '返修率 = 返修工单数 / 总工单数 × 100%',
    true, '2024-01-01', 'system', '初始版本'
) ON CONFLICT (version_code) DO NOTHING;

INSERT INTO rework_rate_caliber_versions (
    version_code, version_name, description, definition_formula,
    is_active, effective_date, created_by, change_reason
) VALUES (
    'v1.1', '扩大口径', '同一车辆60天内同类故障二次进厂计为返修，包含配件质量问题',
    '返修率 = 返修工单数(60天同类故障) / 总工单数 × 100%',
    false, '2024-06-01', 'admin', '扩大返修判定窗口，细化故障分类'
) ON CONFLICT (version_code) DO NOTHING;

-- 初始化阈值配置
INSERT INTO threshold_config (config_key, config_name, config_value, config_type, category, description, updated_by)
VALUES
    ('rework_rate_warning', '返修率预警阈值', '5', 'number', 'rework', '返修率超过此值触发预警', 'system'),
    ('rework_rate_critical', '返修率严重阈值', '8', 'number', 'rework', '返修率超过此值触发严重告警', 'system'),
    ('parts_shortage_rate', '配件缺货率阈值', '3', 'number', 'parts', '配件缺货率超过此值需要复盘', 'system'),
    ('appointment_fill_rate', '预约到店率预警', '85', 'number', 'appointment', '预约到店率低于此值预警', 'system'),
    ('rework_window_days', '返修判定窗口(天)', '30', 'number', 'rework', '多少天内二次进厂算返修', 'system')
ON CONFLICT (config_key) DO NOTHING;
