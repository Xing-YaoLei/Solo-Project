CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 房源表
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_code VARCHAR(50) UNIQUE NOT NULL,
    property_name VARCHAR(200) NOT NULL,
    room_count INTEGER NOT NULL DEFAULT 1,
    city VARCHAR(100),
    district VARCHAR(100),
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 房态表
CREATE TABLE IF NOT EXISTS room_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id),
    status_date DATE NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    occupancy_status VARCHAR(20) NOT NULL DEFAULT 'vacant',
    source VARCHAR(50),
    has_conflict BOOLEAN NOT NULL DEFAULT FALSE,
    conflict_detail JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(property_id, status_date, room_type)
);

CREATE INDEX IF NOT EXISTS idx_room_status_date ON room_status(status_date);
CREATE INDEX IF NOT EXISTS idx_room_status_property ON room_status(property_id);
CREATE INDEX IF NOT EXISTS idx_room_status_conflict ON room_status(has_conflict);

-- OTA订单表
CREATE TABLE IF NOT EXISTS ota_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_no VARCHAR(100) UNIQUE NOT NULL,
    property_id UUID NOT NULL REFERENCES properties(id),
    channel VARCHAR(50) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guest_name VARCHAR(100),
    guest_phone VARCHAR(50),
    room_count INTEGER NOT NULL DEFAULT 1,
    room_type VARCHAR(50),
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    order_status VARCHAR(30) NOT NULL,
    raw_data JSONB,
    is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_detail JSONB,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ota_orders_property ON ota_orders(property_id);
CREATE INDEX IF NOT EXISTS idx_ota_orders_dates ON ota_orders(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_ota_orders_channel ON ota_orders(channel);
CREATE INDEX IF NOT EXISTS idx_ota_orders_anomaly ON ota_orders(is_anomaly);

-- 收款流水表
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_no VARCHAR(100) UNIQUE NOT NULL,
    order_id UUID REFERENCES ota_orders(id),
    property_id UUID NOT NULL REFERENCES properties(id),
    channel VARCHAR(50),
    payment_method VARCHAR(50),
    amount DECIMAL(12, 2) NOT NULL,
    transaction_time TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_status VARCHAR(30) NOT NULL,
    payer VARCHAR(200),
    raw_data JSONB,
    is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_detail JSONB,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_property ON payment_transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_payment_time ON payment_transactions(transaction_time);
CREATE INDEX IF NOT EXISTS idx_payment_anomaly ON payment_transactions(is_anomaly);

-- 门锁记录表
CREATE TABLE IF NOT EXISTS door_lock_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_no VARCHAR(100) UNIQUE NOT NULL,
    property_id UUID NOT NULL REFERENCES properties(id),
    lock_device_id VARCHAR(100),
    action_type VARCHAR(30) NOT NULL,
    action_time TIMESTAMP WITH TIME ZONE NOT NULL,
    operator VARCHAR(100),
    operator_type VARCHAR(50),
    room_no VARCHAR(50),
    raw_data JSONB,
    is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_detail JSONB,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_door_lock_property ON door_lock_records(property_id);
CREATE INDEX IF NOT EXISTS idx_door_lock_time ON door_lock_records(action_time);
CREATE INDEX IF NOT EXISTS idx_door_lock_anomaly ON door_lock_records(is_anomaly);

-- 保洁任务表
CREATE TABLE IF NOT EXISTS cleaning_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_no VARCHAR(100) UNIQUE NOT NULL,
    property_id UUID NOT NULL REFERENCES properties(id),
    order_id UUID REFERENCES ota_orders(id),
    room_type VARCHAR(50),
    scheduled_date DATE NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    task_status VARCHAR(30) NOT NULL,
    assigned_to VARCHAR(100),
    completed_at TIMESTAMP WITH TIME ZONE,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cleaning_property ON cleaning_tasks(property_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_date ON cleaning_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_cleaning_status ON cleaning_tasks(task_status);

-- 备注表
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notes_entity ON notes(entity_type, entity_id);

-- 数据同步日志表
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    records_processed INTEGER NOT NULL DEFAULT 0,
    records_anomaly INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 数据质量异常表（保留异常值而非丢弃）
CREATE TABLE IF NOT EXISTS data_anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_table VARCHAR(50) NOT NULL,
    source_id UUID,
    anomaly_type VARCHAR(50) NOT NULL,
    anomaly_field VARCHAR(100),
    original_value TEXT,
    expected_value TEXT,
    description TEXT,
    severity VARCHAR(20) NOT NULL DEFAULT 'warning',
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_note TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_anomalies_source ON data_anomalies(source_table);
CREATE INDEX IF NOT EXISTS idx_anomalies_severity ON data_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_anomalies_resolved ON data_anomalies(is_resolved);
