-- 001_init_schema.sql
-- 数据库初始化脚本 - 完整DDL

-- 扩展UUID生成函数
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('partner', 'lawyer', 'assistant', 'client')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- 案件表
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    lawyer_id UUID REFERENCES users(id),
    client_id UUID REFERENCES users(id),
    case_type VARCHAR(50) NOT NULL,
    quoted_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    actual_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cases_lawyer ON cases(lawyer_id);
CREATE INDEX idx_cases_client ON cases(client_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_type ON cases(case_type);
CREATE INDEX idx_cases_created_at ON cases(created_at);

-- 单据表
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    invoice_date DATE NOT NULL,
    source VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_case ON invoices(case_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_source ON invoices(source);

-- 单据明细表
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15, 2) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    fee_type VARCHAR(50) NOT NULL
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_fee_type ON invoice_items(fee_type);

-- 合同附件表
CREATE TABLE contract_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    attachment_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_case ON contract_attachments(case_id);
CREATE INDEX idx_attachments_type ON contract_attachments(attachment_type);
CREATE INDEX idx_attachments_uploaded_at ON contract_attachments(uploaded_at);

-- 审批节点表
CREATE TABLE approval_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    node_name VARCHAR(100) NOT NULL,
    approver_id UUID REFERENCES users(id),
    order_index INT NOT NULL,
    submit_time TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_complete_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_complete_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reason TEXT
);

CREATE INDEX idx_approval_case ON approval_nodes(case_id);
CREATE INDEX idx_approval_status ON approval_nodes(status);
CREATE INDEX idx_approval_expected ON approval_nodes(expected_complete_time);
CREATE INDEX idx_approval_approver ON approval_nodes(approver_id);

-- 回款计划表
CREATE TABLE payment_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    phase INT NOT NULL,
    phase_name VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    actual_payment_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_cycle_type VARCHAR(50) NOT NULL
);

CREATE INDEX idx_payment_case ON payment_schedules(case_id);
CREATE INDEX idx_payment_due ON payment_schedules(due_date);
CREATE INDEX idx_payment_status ON payment_schedules(status);
CREATE INDEX idx_payment_cycle_type ON payment_schedules(payment_cycle_type);

-- 邮件附件表
CREATE TABLE email_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id VARCHAR(255) UNIQUE NOT NULL,
    subject VARCHAR(500),
    sender VARCHAR(255),
    received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    hash VARCHAR(64),
    linked_invoice_id UUID REFERENCES invoices(id)
);

CREATE INDEX idx_email_hash ON email_attachments(hash);
CREATE INDEX idx_email_linked ON email_attachments(linked_invoice_id);
CREATE INDEX idx_email_received ON email_attachments(received_at);
CREATE INDEX idx_email_sender ON email_attachments(sender);

-- 分享链接表
CREATE TABLE share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(64) UNIQUE NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    created_by UUID REFERENCES users(id),
    allowed_roles JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    allow_export BOOLEAN DEFAULT false,
    hide_sensitive BOOLEAN DEFAULT true,
    access_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_share_token ON share_links(token);
CREATE INDEX idx_share_created_by ON share_links(created_by);
CREATE INDEX idx_share_expires ON share_links(expires_at);
CREATE INDEX idx_share_resource ON share_links(resource_type, resource_id);

-- 数据同步日志表
CREATE TABLE data_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_system VARCHAR(100) NOT NULL,
    sync_type VARCHAR(50) NOT NULL,
    records_processed INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sync_source ON data_sync_logs(source_system);
CREATE INDEX idx_sync_status ON data_sync_logs(status);
CREATE INDEX idx_sync_started ON data_sync_logs(started_at);

-- 自动更新updated_at的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要自动更新updated_at的表创建触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
