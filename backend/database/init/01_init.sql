-- 长租公寓退租验房系统数据库初始化脚本
-- PostgreSQL 16+

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 设置时区
SET TIME ZONE 'Asia/Shanghai';

-- 创建枚举类型
CREATE TYPE user_role AS ENUM ('admin', 'worker');
CREATE TYPE batch_source AS ENUM ('crm', 'payment', 'contract', 'inspection', 'repair');
CREATE TYPE batch_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE payment_type AS ENUM ('rent', 'deposit', 'utility', 'penalty', 'other');
CREATE TYPE payment_method AS ENUM ('alipay', 'wechat', 'bank_transfer', 'cash', 'card');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'refunded', 'cancelled');
CREATE TYPE contract_status AS ENUM ('draft', 'active', 'expired', 'terminated', 'renewed');
CREATE TYPE inspection_status AS ENUM ('pending', 'assigned', 'inspecting', 'completed', 'cancelled', 'disputed');
CREATE TYPE repair_status AS ENUM ('pending', 'assigned', 'processing', 'completed', 'cancelled', 'delayed');
CREATE TYPE repair_type AS ENUM ('plumbing', 'electrical', 'appliance', 'structure', 'cleaning', 'other');
CREATE TYPE complaint_status AS ENUM ('open', 'processing', 'resolved', 'closed');

-- 创建表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'worker',
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS import_batches (
    id SERIAL PRIMARY KEY,
    batch_no VARCHAR(50) UNIQUE NOT NULL,
    source_type batch_source NOT NULL,
    status batch_status NOT NULL DEFAULT 'pending',
    record_count INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    file_name VARCHAR(500),
    file_size BIGINT,
    imported_by INTEGER REFERENCES users(id),
    imported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_customers (
    id SERIAL PRIMARY KEY,
    customer_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    id_card VARCHAR(18),
    wechat_id VARCHAR(100),
    email VARCHAR(255),
    first_rent_date DATE,
    last_rent_date DATE,
    total_rent_months INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    tags JSONB,
    remark TEXT,
    batch_id INTEGER REFERENCES import_batches(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    property_no VARCHAR(50) UNIQUE NOT NULL,
    address VARCHAR(500) NOT NULL,
    district VARCHAR(100) NOT NULL,
    area DECIMAL(10,2),
    room_type VARCHAR(50),
    monthly_rent DECIMAL(12,2) NOT NULL,
    deposit_amount DECIMAL(12,2),
    floor INTEGER,
    total_floor INTEGER,
    orientation VARCHAR(20),
    decoration VARCHAR(50),
    facilities JSONB,
    status VARCHAR(20) DEFAULT 'vacant',
    batch_id INTEGER REFERENCES import_batches(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS e_contracts (
    id SERIAL PRIMARY KEY,
    contract_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES crm_customers(id),
    property_id INTEGER NOT NULL REFERENCES properties(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent DECIMAL(12,2) NOT NULL,
    deposit_amount DECIMAL(12,2) NOT NULL,
    payment_cycle INTEGER DEFAULT 1,
    contract_status contract_status NOT NULL DEFAULT 'active',
    sign_date DATE,
    template_version VARCHAR(50),
    digital_signature TEXT,
    terms JSONB,
    batch_id INTEGER REFERENCES import_batches(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    transaction_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES crm_customers(id),
    property_id INTEGER REFERENCES properties(id),
    contract_id INTEGER REFERENCES e_contracts(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_type payment_type NOT NULL,
    payment_date DATE,
    payment_method payment_method,
    status payment_status NOT NULL DEFAULT 'pending',
    due_date DATE,
    overdue_days INTEGER DEFAULT 0,
    late_fee DECIMAL(12,2) DEFAULT 0,
    third_party_transaction_id VARCHAR(100),
    remark TEXT,
    batch_id INTEGER REFERENCES import_batches(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspection_records (
    id SERIAL PRIMARY KEY,
    inspection_no VARCHAR(50) UNIQUE NOT NULL,
    contract_id INTEGER REFERENCES e_contracts(id),
    property_id INTEGER NOT NULL REFERENCES properties(id),
    customer_id INTEGER NOT NULL REFERENCES crm_customers(id),
    inspector_id INTEGER REFERENCES users(id),
    apply_date DATE NOT NULL,
    scheduled_date DATE,
    inspection_date DATE,
    status inspection_status NOT NULL DEFAULT 'pending',
    water_reading_start DECIMAL(10,2),
    water_reading_end DECIMAL(10,2),
    electricity_reading_start DECIMAL(10,2),
    electricity_reading_end DECIMAL(10,2),
    gas_reading_start DECIMAL(10,2),
    gas_reading_end DECIMAL(10,2),
    has_damage BOOLEAN DEFAULT FALSE,
    damage_description TEXT,
    deduction_amount DECIMAL(12,2) DEFAULT 0,
    refund_amount DECIMAL(12,2) DEFAULT 0,
    signature_customer TEXT,
    signature_inspector TEXT,
    remark TEXT,
    batch_id INTEGER REFERENCES import_batches(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspection_items (
    id SERIAL PRIMARY KEY,
    inspection_id INTEGER NOT NULL REFERENCES inspection_records(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    item_category VARCHAR(100),
    is_pass BOOLEAN,
    normal_condition TEXT,
    actual_condition TEXT,
    deduction_amount DECIMAL(12,2) DEFAULT 0,
    photo_urls JSONB,
    remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS repair_caliber_versions (
    id SERIAL PRIMARY KEY,
    version VARCHAR(20) UNIQUE NOT NULL,
    effective_date DATE NOT NULL,
    end_date DATE,
    description TEXT NOT NULL,
    calculation_rule TEXT NOT NULL,
    exclude_holidays BOOLEAN DEFAULT FALSE,
    exclude_weekends BOOLEAN DEFAULT FALSE,
    start_event VARCHAR(50) NOT NULL,
    end_event VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS repair_orders (
    id SERIAL PRIMARY KEY,
    repair_no VARCHAR(50) UNIQUE NOT NULL,
    property_id INTEGER NOT NULL REFERENCES properties(id),
    reporter_id INTEGER REFERENCES crm_customers(id),
    worker_id INTEGER REFERENCES users(id),
    repair_type repair_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    report_time TIMESTAMP NOT NULL,
    assign_time TIMESTAMP,
    start_time TIMESTAMP,
    complete_time TIMESTAMP,
    status repair_status NOT NULL DEFAULT 'pending',
    actual_cost DECIMAL(12,2),
    duration_hours DECIMAL(10,2),
    caliber_version VARCHAR(20) REFERENCES repair_caliber_versions(version),
    photo_urls JSONB,
    remark TEXT,
    batch_id INTEGER REFERENCES import_batches(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    complaint_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES crm_customers(id),
    property_id INTEGER REFERENCES properties(id),
    complaint_type VARCHAR(50) NOT NULL,
    tags JSONB,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    report_date DATE NOT NULL,
    status complaint_status NOT NULL DEFAULT 'open',
    handled_by INTEGER REFERENCES users(id),
    handled_at TIMESTAMP,
    resolution TEXT,
    satisfaction_score INTEGER,
    batch_id INTEGER REFERENCES import_batches(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rent_overdue_comments (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES crm_customers(id),
    comment TEXT NOT NULL,
    commented_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_crm_customer_phone ON crm_customers(phone);
CREATE INDEX IF NOT EXISTS idx_crm_customer_no ON crm_customers(customer_no);
CREATE INDEX IF NOT EXISTS idx_properties_district ON properties(district);
CREATE INDEX IF NOT EXISTS idx_properties_no ON properties(property_no);
CREATE INDEX IF NOT EXISTS idx_payment_customer ON payment_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_date ON payment_transactions(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_contract_customer ON e_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contract_property ON e_contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_contract_status ON e_contracts(contract_status);
CREATE INDEX IF NOT EXISTS idx_inspection_property ON inspection_records(property_id);
CREATE INDEX IF NOT EXISTS idx_inspection_customer ON inspection_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_inspection_date ON inspection_records(inspection_date);
CREATE INDEX IF NOT EXISTS idx_inspection_status ON inspection_records(status);
CREATE INDEX IF NOT EXISTS idx_repair_worker ON repair_orders(worker_id);
CREATE INDEX IF NOT EXISTS idx_repair_property ON repair_orders(property_id);
CREATE INDEX IF NOT EXISTS idx_repair_status ON repair_orders(status);
CREATE INDEX IF NOT EXISTS idx_repair_caliber ON repair_orders(caliber_version);
CREATE INDEX IF NOT EXISTS idx_complaint_customer ON complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_complaint_date ON complaints(report_date);
CREATE INDEX IF NOT EXISTS idx_batch_source ON import_batches(source_type);
CREATE INDEX IF NOT EXISTS idx_batch_status ON import_batches(status);
CREATE INDEX IF NOT EXISTS idx_batch_date ON import_batches(imported_at);
CREATE INDEX IF NOT EXISTS idx_overdue_comment_payment ON rent_overdue_comments(payment_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_customers_updated_at BEFORE UPDATE ON crm_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_e_contracts_updated_at BEFORE UPDATE ON e_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inspection_records_updated_at BEFORE UPDATE ON inspection_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repair_orders_updated_at BEFORE UPDATE ON repair_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
