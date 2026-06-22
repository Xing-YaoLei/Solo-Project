import duckdb
from pathlib import Path
from src.utils.config import get_duckdb_path, ensure_data_dirs


CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS regions (
    region_id VARCHAR PRIMARY KEY,
    region_name VARCHAR NOT NULL,
    province VARCHAR,
    city VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_nodes (
    sync_id VARCHAR PRIMARY KEY,
    node_type VARCHAR NOT NULL,
    node_name VARCHAR NOT NULL,
    source_system VARCHAR NOT NULL,
    target_system VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    record_count INTEGER DEFAULT 0,
    error_message VARCHAR,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    operator VARCHAR NOT NULL,
    batch_no VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_workpapers (
    workpaper_id VARCHAR PRIMARY KEY,
    workpaper_no VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    content VARCHAR NOT NULL,
    region_id VARCHAR NOT NULL,
    audit_date TIMESTAMP NOT NULL,
    auditor VARCHAR NOT NULL,
    department VARCHAR NOT NULL,
    sync_id VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permission_logs (
    log_id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    user_name VARCHAR NOT NULL,
    department VARCHAR NOT NULL,
    permission_code VARCHAR NOT NULL,
    permission_name VARCHAR NOT NULL,
    action VARCHAR NOT NULL,
    resource_path VARCHAR NOT NULL,
    ip_address VARCHAR NOT NULL,
    is_violation BOOLEAN DEFAULT FALSE,
    violation_reason VARCHAR,
    region_id VARCHAR NOT NULL,
    operation_time TIMESTAMP NOT NULL,
    sync_id VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mail_materials (
    mail_id VARCHAR PRIMARY KEY,
    subject VARCHAR NOT NULL,
    sender VARCHAR NOT NULL,
    recipient VARCHAR NOT NULL,
    cc_recipients VARCHAR,
    content VARCHAR NOT NULL,
    has_attachment BOOLEAN DEFAULT FALSE,
    attachment_count INTEGER DEFAULT 0,
    region_id VARCHAR NOT NULL,
    sent_time TIMESTAMP NOT NULL,
    sync_id VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence_archive (
    archive_id VARCHAR PRIMARY KEY,
    evidence_type VARCHAR NOT NULL,
    source_id VARCHAR NOT NULL,
    source_table VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    description VARCHAR,
    region_id VARCHAR NOT NULL,
    archive_date TIMESTAMP NOT NULL,
    archived_by VARCHAR NOT NULL,
    retention_period INTEGER NOT NULL,
    is_sensitive BOOLEAN DEFAULT FALSE,
    minio_bucket VARCHAR,
    minio_object_key VARCHAR,
    file_hash VARCHAR,
    sync_id VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issue_records (
    issue_id VARCHAR PRIMARY KEY,
    issue_no VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    severity VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    region_id VARCHAR NOT NULL,
    related_archive_id VARCHAR,
    found_date TIMESTAMP NOT NULL,
    resolved_date TIMESTAMP,
    handler VARCHAR NOT NULL,
    is_reoccurrence BOOLEAN DEFAULT FALSE,
    original_issue_id VARCHAR,
    recurrence_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checklist_items (
    checklist_id VARCHAR PRIMARY KEY,
    item_no VARCHAR NOT NULL,
    item_content VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    is_checked BOOLEAN DEFAULT FALSE,
    checked_by VARCHAR,
    checked_at TIMESTAMP,
    remark VARCHAR,
    related_archive_id VARCHAR,
    region_id VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sampling_records (
    sampling_id VARCHAR PRIMARY KEY,
    sampling_no VARCHAR NOT NULL,
    sampling_method VARCHAR NOT NULL,
    population_size INTEGER NOT NULL,
    sample_size INTEGER NOT NULL,
    confidence_level FLOAT NOT NULL,
    margin_of_error FLOAT NOT NULL,
    sampling_criteria VARCHAR NOT NULL,
    region_id VARCHAR NOT NULL,
    sampled_by VARCHAR NOT NULL,
    sampled_at TIMESTAMP NOT NULL,
    related_archive_ids VARCHAR,
    original_record_refs VARCHAR,
    remark VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_templates (
    template_id VARCHAR PRIMARY KEY,
    template_name VARCHAR NOT NULL,
    template_type VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    content VARCHAR NOT NULL,
    version VARCHAR NOT NULL,
    region_id VARCHAR NOT NULL,
    created_by VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence_attachments (
    attachment_id VARCHAR PRIMARY KEY,
    archive_id VARCHAR NOT NULL,
    file_name VARCHAR NOT NULL,
    file_type VARCHAR NOT NULL,
    file_size INTEGER NOT NULL,
    minio_bucket VARCHAR NOT NULL,
    minio_object_key VARCHAR NOT NULL,
    file_hash VARCHAR NOT NULL,
    uploaded_by VARCHAR NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_INDEXES_SQL = """
CREATE INDEX IF NOT EXISTS idx_audit_workpapers_region_date ON audit_workpapers(region_id, audit_date);
CREATE INDEX IF NOT EXISTS idx_audit_workpapers_sync ON audit_workpapers(sync_id);

CREATE INDEX IF NOT EXISTS idx_permission_logs_region_time ON permission_logs(region_id, operation_time);
CREATE INDEX IF NOT EXISTS idx_permission_logs_violation ON permission_logs(is_violation);
CREATE INDEX IF NOT EXISTS idx_permission_logs_sync ON permission_logs(sync_id);

CREATE INDEX IF NOT EXISTS idx_mail_materials_region_time ON mail_materials(region_id, sent_time);
CREATE INDEX IF NOT EXISTS idx_mail_materials_sync ON mail_materials(sync_id);

CREATE INDEX IF NOT EXISTS idx_evidence_archive_region_date ON evidence_archive(region_id, archive_date);
CREATE INDEX IF NOT EXISTS idx_evidence_archive_type ON evidence_archive(evidence_type);
CREATE INDEX IF NOT EXISTS idx_evidence_archive_sync ON evidence_archive(sync_id);

CREATE INDEX IF NOT EXISTS idx_issue_records_region_date ON issue_records(region_id, found_date);
CREATE INDEX IF NOT EXISTS idx_issue_records_severity ON issue_records(severity);
CREATE INDEX IF NOT EXISTS idx_issue_records_reoccurrence ON issue_records(is_reoccurrence);
CREATE INDEX IF NOT EXISTS idx_issue_records_archive ON issue_records(related_archive_id);

CREATE INDEX IF NOT EXISTS idx_checklist_items_region ON checklist_items(region_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_archive ON checklist_items(related_archive_id);

CREATE INDEX IF NOT EXISTS idx_sampling_records_region_date ON sampling_records(region_id, sampled_at);

CREATE INDEX IF NOT EXISTS idx_sync_nodes_batch ON sync_nodes(batch_no);
CREATE INDEX IF NOT EXISTS idx_sync_nodes_status ON sync_nodes(status);

CREATE INDEX IF NOT EXISTS idx_evidence_attachments_archive ON evidence_attachments(archive_id);
"""


def init_database(db_path: str = None) -> None:
    ensure_data_dirs()
    if db_path is None:
        db_path = get_duckdb_path()

    Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    with duckdb.connect(db_path) as conn:
        conn.execute(CREATE_TABLES_SQL)
        conn.execute(CREATE_INDEXES_SQL)
        conn.commit()


def get_connection(db_path: str = None) -> duckdb.DuckDBPyConnection:
    if db_path is None:
        db_path = get_duckdb_path()
    return duckdb.connect(db_path, read_only=False)
