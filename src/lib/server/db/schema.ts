import db from './index';

export function initSchema() {
	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			role TEXT NOT NULL CHECK (role IN ('manager', 'sales')),
			store_id TEXT,
			password_hash TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS import_batches (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			source_type TEXT NOT NULL CHECK (source_type IN ('finance', 'crm', 'inspection')),
			status TEXT NOT NULL CHECK (status IN ('processing', 'merged', 'failed')),
			record_count INTEGER DEFAULT 0,
			merged_count INTEGER DEFAULT 0,
			created_by TEXT NOT NULL REFERENCES users(id),
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS finance_approvals (
			id TEXT PRIMARY KEY,
			customer_name TEXT NOT NULL,
			phone TEXT NOT NULL,
			vehicle_model TEXT,
			approved_amount DECIMAL,
			approval_status TEXT,
			approval_date DATETIME,
			import_batch_id TEXT NOT NULL REFERENCES import_batches(id),
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE INDEX IF NOT EXISTS idx_finance_phone ON finance_approvals(phone);

		CREATE TABLE IF NOT EXISTS crm_leads (
			id TEXT PRIMARY KEY,
			customer_name TEXT NOT NULL,
			phone TEXT NOT NULL,
			lead_source TEXT,
			salesperson_id TEXT REFERENCES users(id),
			created_at DATETIME,
			import_batch_id TEXT NOT NULL REFERENCES import_batches(id)
		);

		CREATE INDEX IF NOT EXISTS idx_crm_phone ON crm_leads(phone);

		CREATE TABLE IF NOT EXISTS inspection_reports (
			id TEXT PRIMARY KEY,
			vin_code TEXT,
			vehicle_model TEXT,
			customer_phone TEXT,
			inspection_result TEXT,
			inspection_date DATETIME,
			import_batch_id TEXT NOT NULL REFERENCES import_batches(id)
		);

		CREATE INDEX IF NOT EXISTS idx_inspection_phone ON inspection_reports(customer_phone);

		CREATE TABLE IF NOT EXISTS test_drive_leads (
			id TEXT PRIMARY KEY,
			customer_name TEXT NOT NULL,
			phone TEXT NOT NULL,
			vehicle_model TEXT,
			salesperson_id TEXT REFERENCES users(id),
			appointment_time DATETIME,
			status TEXT NOT NULL DEFAULT 'appointed' CHECK (status IN ('appointed', 'arrived', 'completed', 'no_show', 'closed')),
			finance_approval_id TEXT REFERENCES finance_approvals(id),
			crm_lead_id TEXT REFERENCES crm_leads(id),
			inspection_report_id TEXT REFERENCES inspection_reports(id),
			no_show_note TEXT,
			import_batch_id TEXT NOT NULL REFERENCES import_batches(id),
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE INDEX IF NOT EXISTS idx_leads_salesperson ON test_drive_leads(salesperson_id);
		CREATE INDEX IF NOT EXISTS idx_leads_status ON test_drive_leads(status);
		CREATE INDEX IF NOT EXISTS idx_leads_batch ON test_drive_leads(import_batch_id);
		CREATE INDEX IF NOT EXISTS idx_leads_appointment ON test_drive_leads(appointment_time);

		CREATE TABLE IF NOT EXISTS lead_batch_relations (
			id TEXT PRIMARY KEY,
			lead_id TEXT NOT NULL REFERENCES test_drive_leads(id),
			batch_id TEXT NOT NULL REFERENCES import_batches(id),
			relation_type TEXT NOT NULL CHECK (relation_type IN ('created', 'merged')),
			source_type TEXT NOT NULL CHECK (source_type IN ('finance', 'crm', 'inspection')),
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(lead_id, batch_id)
		);

		CREATE INDEX IF NOT EXISTS idx_relation_lead ON lead_batch_relations(lead_id);
		CREATE INDEX IF NOT EXISTS idx_relation_batch ON lead_batch_relations(batch_id);
	`);
}
