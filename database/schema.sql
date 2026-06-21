-- 订单主表
CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(64) PRIMARY KEY,
    order_no VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    rider_id VARCHAR(64),
    merchant_id VARCHAR(64) NOT NULL,
    order_type VARCHAR(32) NOT NULL,
    order_status VARCHAR(32) NOT NULL,
    pickup_address TEXT NOT NULL,
    pickup_lng DECIMAL(10, 7),
    pickup_lat DECIMAL(10, 7),
    delivery_address TEXT NOT NULL,
    delivery_lng DECIMAL(10, 7),
    delivery_lat DECIMAL(10, 7),
    distance_km DECIMAL(10, 2),
    estimated_amount DECIMAL(10, 2),
    actual_amount DECIMAL(10, 2),
    subsidy_amount DECIMAL(10, 2) DEFAULT 0,
    create_time TIMESTAMP NOT NULL,
    accept_time TIMESTAMP,
    pickup_time TIMESTAMP,
    delivery_time TIMESTAMP,
    cancel_time TIMESTAMP,
    cancel_reason VARCHAR(255),
    is_risk_order BOOLEAN DEFAULT FALSE,
    risk_level VARCHAR(16) DEFAULT 'normal',
    data_source VARCHAR(32) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_create_time ON orders(create_time);
CREATE INDEX IF NOT EXISTS idx_orders_rider_id ON orders(rider_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_risk ON orders(is_risk_order);

-- 支付流水表
CREATE TABLE IF NOT EXISTS payment_transactions (
    txn_id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(order_id),
    user_id VARCHAR(64) NOT NULL,
    pay_type VARCHAR(32) NOT NULL,
    pay_amount DECIMAL(10, 2) NOT NULL,
    pay_status VARCHAR(32) NOT NULL,
    pay_time TIMESTAMP,
    refund_amount DECIMAL(10, 2) DEFAULT 0,
    refund_time TIMESTAMP,
    third_party_txn_id VARCHAR(128),
    currency VARCHAR(16) DEFAULT 'CNY',
    data_source VARCHAR(32) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_pay_time ON payment_transactions(pay_time);

-- 骑手轨迹表
CREATE TABLE IF NOT EXISTS rider_trajectories (
    traj_id VARCHAR(64) PRIMARY KEY,
    rider_id VARCHAR(64) NOT NULL,
    order_id VARCHAR(64) REFERENCES orders(order_id),
    lng DECIMAL(10, 7) NOT NULL,
    lat DECIMAL(10, 7) NOT NULL,
    speed_kmh DECIMAL(10, 2),
    heading DECIMAL(5, 2),
    accuracy_m DECIMAL(10, 2),
    record_time TIMESTAMP NOT NULL,
    data_source VARCHAR(32) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_traj_rider_time ON rider_trajectories(rider_id, record_time);
CREATE INDEX IF NOT EXISTS idx_traj_order_id ON rider_trajectories(order_id);

-- 补贴规则表
CREATE TABLE IF NOT EXISTS subsidy_rules (
    rule_id VARCHAR(64) PRIMARY KEY,
    rule_name VARCHAR(128) NOT NULL,
    rule_type VARCHAR(32) NOT NULL,
    effective_start TIMESTAMP NOT NULL,
    effective_end TIMESTAMP NOT NULL,
    condition_params JSONB NOT NULL,
    subsidy_calc JSONB NOT NULL,
    max_subsidy_per_order DECIMAL(10, 2),
    daily_quota DECIMAL(12, 2),
    used_amount DECIMAL(12, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    created_by VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 预警阈值配置表
CREATE TABLE IF NOT EXISTS warning_thresholds (
    threshold_id VARCHAR(64) PRIMARY KEY,
    metric_code VARCHAR(64) NOT NULL UNIQUE,
    metric_name VARCHAR(128) NOT NULL,
    metric_category VARCHAR(32) NOT NULL,
    warning_level VARCHAR(16) NOT NULL,
    operator VARCHAR(16) NOT NULL,
    threshold_value DECIMAL(12, 4) NOT NULL,
    unit VARCHAR(32),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_by VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 骑手拒单记录表
CREATE TABLE IF NOT EXISTS rider_rejections (
    rejection_id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(order_id),
    rider_id VARCHAR(64) NOT NULL,
    reject_reason VARCHAR(255),
    reject_time TIMESTAMP NOT NULL,
    dispatch_count INT DEFAULT 1,
    compensation_amount DECIMAL(10, 2) DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rejection_rider_time ON rider_rejections(rider_id, reject_time);
CREATE INDEX IF NOT EXISTS idx_rejection_order_id ON rider_rejections(order_id);

-- 风险预警表
CREATE TABLE IF NOT EXISTS risk_alerts (
    alert_id VARCHAR(64) PRIMARY KEY,
    alert_type VARCHAR(32) NOT NULL,
    alert_level VARCHAR(16) NOT NULL,
    order_id VARCHAR(64) REFERENCES orders(order_id),
    rider_id VARCHAR(64),
    metric_code VARCHAR(64) REFERENCES warning_thresholds(metric_code),
    alert_value DECIMAL(12, 4),
    threshold_value DECIMAL(12, 4),
    alert_message TEXT,
    alert_time TIMESTAMP NOT NULL,
    is_handled BOOLEAN DEFAULT FALSE,
    handled_by VARCHAR(64),
    handled_time TIMESTAMP,
    handle_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_time ON risk_alerts(alert_time);
CREATE INDEX IF NOT EXISTS idx_alerts_level ON risk_alerts(alert_level);
CREATE INDEX IF NOT EXISTS idx_alerts_handled ON risk_alerts(is_handled);

-- 复盘材料表
CREATE TABLE IF NOT EXISTS review_materials (
    review_id VARCHAR(64) PRIMARY KEY,
    review_type VARCHAR(32) NOT NULL,
    order_id VARCHAR(64) REFERENCES orders(order_id),
    rider_id VARCHAR(64),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_orders INT DEFAULT 0,
    rejection_count INT DEFAULT 0,
    rejection_rate DECIMAL(5, 4),
    total_compensation DECIMAL(12, 2) DEFAULT 0,
    avg_compensation DECIMAL(10, 2),
    risk_orders INT DEFAULT 0,
    material_data JSONB,
    summary TEXT,
    created_by VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_date ON review_materials(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_review_rider ON review_materials(rider_id);
