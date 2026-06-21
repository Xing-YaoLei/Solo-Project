-- 003_duckdb_views.sql
-- DuckDB 分析视图 - 用于OLAP报表分析

-- 对账差异趋势视图
-- 按时间维度展示报价与实际对账差异趋势
CREATE VIEW v_reconciliation_trend AS
SELECT 
    DATE_TRUNC('day', i.invoice_date) AS report_date,
    SUM(c.quoted_amount) AS total_quoted,
    SUM(c.actual_amount) AS total_actual,
    SUM(c.actual_amount - c.quoted_amount) AS total_difference,
    CASE 
        WHEN SUM(c.quoted_amount) > 0 
        THEN ROUND(SUM(c.actual_amount - c.quoted_amount) / SUM(c.quoted_amount) * 100, 2) 
        ELSE 0 
    END AS difference_rate,
    COUNT(DISTINCT c.id) AS case_count,
    COUNT(DISTINCT i.id) AS invoice_count,
    CURRENT_TIMESTAMP AS updated_at
FROM cases c
LEFT JOIN invoices i ON c.id = i.case_id
WHERE c.status != 'cancelled'
GROUP BY DATE_TRUNC('day', i.invoice_date)
ORDER BY report_date;

-- 合同附件构成视图
-- 按附件类型统计合同附件的数量、金额和占比
CREATE VIEW v_contract_composition AS
SELECT 
    ca.attachment_type,
    COUNT(*) AS count,
    SUM(ca.amount) AS total_amount,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contract_attachments), 2) AS count_percentage,
    ROUND(SUM(ca.amount) * 100.0 / (SELECT SUM(amount) FROM contract_attachments WHERE amount > 0), 2) AS amount_percentage,
    ARRAY_AGG(DISTINCT c.case_no) AS case_numbers,
    ARRAY_AGG(DISTINCT c.name) AS case_names,
    CURRENT_TIMESTAMP AS updated_at
FROM contract_attachments ca
JOIN cases c ON ca.case_id = c.id
GROUP BY ca.attachment_type
ORDER BY count DESC;

-- 审批异常分析视图
-- 识别审批流程中的异常节点，包括超时、拒绝和延迟
CREATE VIEW v_approval_anomalies AS
SELECT 
    an.id,
    c.case_no,
    c.name AS case_name,
    c.case_type,
    an.node_name,
    an.order_index,
    u.name AS approver_name,
    u.role AS approver_role,
    an.submit_time,
    an.expected_complete_time,
    an.actual_complete_time,
    an.status,
    CASE 
        WHEN an.status = 'pending' AND an.expected_complete_time < NOW() 
        THEN EXTRACT(EPOCH FROM (NOW() - an.expected_complete_time)) / 3600
        WHEN an.status != 'pending' AND an.actual_complete_time > an.expected_complete_time
        THEN EXTRACT(EPOCH FROM (an.actual_complete_time - an.expected_complete_time)) / 3600
        ELSE 0 
    END AS delay_hours,
    CASE 
        WHEN an.status = 'rejected' THEN 'rejected'
        WHEN an.status = 'pending' AND an.expected_complete_time < NOW() THEN 'overdue'
        WHEN an.status != 'pending' AND an.actual_complete_time > an.expected_complete_time THEN 'delayed'
        ELSE 'normal'
    END AS anomaly_type,
    an.reason,
    CURRENT_TIMESTAMP AS updated_at
FROM approval_nodes an
JOIN cases c ON an.case_id = c.id
LEFT JOIN users u ON an.approver_id = u.id
WHERE an.status = 'rejected' 
   OR (an.status = 'pending' AND an.expected_complete_time < NOW())
   OR (an.actual_complete_time IS NOT NULL AND an.actual_complete_time > an.expected_complete_time)
ORDER BY an.submit_time DESC;

-- 单据明细汇总视图（补充）
-- 为单据明细表提供聚合分析
CREATE VIEW v_invoice_summary AS
SELECT 
    i.id AS invoice_id,
    i.invoice_no,
    c.case_no,
    c.name AS case_name,
    u.name AS lawyer_name,
    i.amount AS invoice_amount,
    i.status,
    i.invoice_date,
    i.source,
    COUNT(ii.id) AS item_count,
    SUM(ii.amount) AS items_total,
    (i.amount - SUM(ii.amount)) AS amount_difference,
    CASE 
        WHEN EXISTS (SELECT 1 FROM email_attachments ea WHERE ea.linked_invoice_id = i.id)
        THEN true
        ELSE false
    END AS has_attachment,
    CURRENT_TIMESTAMP AS updated_at
FROM invoices i
JOIN cases c ON i.case_id = c.id
JOIN users u ON c.lawyer_id = u.id
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
GROUP BY i.id, i.invoice_no, c.case_no, c.name, u.name, i.amount, i.status, i.invoice_date, i.source
ORDER BY i.invoice_date DESC;

-- 回款计划追踪视图（补充）
-- 按案件和阶段追踪回款情况
CREATE VIEW v_payment_tracking AS
SELECT 
    c.id AS case_id,
    c.case_no,
    c.name AS case_name,
    u.name AS client_name,
    ps.phase,
    ps.phase_name,
    ps.amount,
    ps.due_date,
    ps.actual_payment_date,
    ps.status,
    ps.payment_cycle_type,
    CASE 
        WHEN ps.status = 'paid' THEN 0
        WHEN ps.due_date < CURRENT_DATE AND ps.status != 'paid' 
        THEN EXTRACT(DAY FROM (CURRENT_DATE - ps.due_date))
        ELSE NULL
    END AS days_overdue,
    CURRENT_TIMESTAMP AS updated_at
FROM payment_schedules ps
JOIN cases c ON ps.case_id = c.id
JOIN users u ON c.client_id = u.id
ORDER BY c.case_no, ps.phase;
