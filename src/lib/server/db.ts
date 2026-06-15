import initSqlJs, { type Database } from 'sql.js';

let db: Database | null = null;
let initPromise: Promise<void> | null = null;

export async function getDb(): Promise<Database> {
	if (!db) {
		if (!initPromise) {
			initPromise = initDb();
		}
		await initPromise;
	}
	if (!db) {
		throw new Error('Database not initialized');
	}
	return db;
}

export async function initDb(): Promise<void> {
	if (db) return;

	const SQL = await initSqlJs({
		locateFile: (file: string) => `https://sql.js.org/dist/${file}`
	});

	db = new SQL.Database();

	db.run(`
		CREATE TABLE IF NOT EXISTS students (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			student_id TEXT UNIQUE NOT NULL,
			name TEXT NOT NULL,
			grade TEXT,
			course TEXT,
			enroll_date TEXT,
			parent_contact TEXT,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS assignments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			assignment_id TEXT UNIQUE NOT NULL,
			title TEXT NOT NULL,
			course TEXT,
			tag TEXT,
			difficulty TEXT,
			due_date TEXT,
			total_score REAL DEFAULT 100,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS submissions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			student_id TEXT NOT NULL,
			assignment_id TEXT NOT NULL,
			submit_date TEXT,
			score REAL,
			status TEXT DEFAULT 'pending',
			correct_count INTEGER DEFAULT 0,
			total_questions INTEGER DEFAULT 0,
			feedback TEXT,
			graded_at TEXT,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(student_id, assignment_id)
		);

		CREATE TABLE IF NOT EXISTS parent_feedback (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			student_id TEXT NOT NULL,
			feedback_date TEXT NOT NULL,
			feedback_type TEXT,
			content TEXT,
			sentiment TEXT,
			source TEXT,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS question_tags (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			assignment_id TEXT NOT NULL,
			question_index INTEGER NOT NULL,
			tag TEXT NOT NULL,
			correct_rate REAL,
			average_time REAL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS thresholds (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			config_key TEXT UNIQUE NOT NULL,
			config_value TEXT NOT NULL,
			description TEXT,
			category TEXT,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS data_sources (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			source_name TEXT NOT NULL,
			source_type TEXT NOT NULL,
			last_import TEXT,
			status TEXT DEFAULT 'active',
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);
	`);

	const thresholdResult = db.exec('SELECT COUNT(*) as count FROM thresholds');
	const thresholdCount = thresholdResult.length > 0 ? thresholdResult[0].values[0][0] as number : 0;

	if (thresholdCount === 0) {
		const defaults: [string, string, string, string][] = [
			['completion_rate_warning', '0.7', '作业完成率预警阈值', 'completion'],
			['completion_rate_critical', '0.5', '作业完成率危急阈值', 'completion'],
			['average_score_warning', '60', '平均分预警阈值', 'score'],
			['average_score_critical', '40', '平均分危急阈值', 'score'],
			['submission_delay_hours', '24', '提交延迟预警小时数', 'timeliness'],
			['negative_feedback_threshold', '3', '负面反馈预警次数', 'feedback'],
			['tag_mastery_warning', '0.6', '知识点掌握度预警阈值', 'tag'],
			['progress_lag_days', '3', '进度落后天数预警', 'progress'],
			['review_material_auto_generate', 'true', '是否自动生成复盘材料', 'review']
		];

		for (const [key, value, desc, category] of defaults) {
			db.run(
				'INSERT OR IGNORE INTO thresholds (config_key, config_value, description, category) VALUES (?, ?, ?, ?)',
				[key, value, desc, category]
			);
		}
	}
}

export function queryAll<T = Record<string, unknown>>(database: Database, sql: string, params: unknown[] = []): T[] {
	const result = database.exec(sql, params as (string | number | null | undefined)[]);
	if (result.length === 0) return [];

	const columns = result[0].columns;
	const rows = result[0].values;

	return rows.map((row) => {
		const obj: Record<string, unknown> = {};
		columns.forEach((col, i) => {
			obj[col] = row[i];
		});
		return obj as T;
	});
}

export function queryOne<T = Record<string, unknown>>(database: Database, sql: string, params: unknown[] = [] ): T | null {
	const rows = queryAll<T>(database, sql, params);
	return rows.length > 0 ? rows[0] : null;
}
