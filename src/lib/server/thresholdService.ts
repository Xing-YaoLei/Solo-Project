import { getDb, queryAll, queryOne } from './db';

export interface ThresholdConfig {
	id?: number;
	config_key: string;
	config_value: string;
	description?: string;
	category?: string;
	updated_at?: string;
}

export async function getThresholds(): Promise<ThresholdConfig[]> {
	const db = await getDb();
	return queryAll<ThresholdConfig>(db, 'SELECT * FROM thresholds ORDER BY category, config_key');
}

export async function getThresholdByKey(key: string): Promise<ThresholdConfig | null> {
	const db = await getDb();
	return queryOne<ThresholdConfig>(db, 'SELECT * FROM thresholds WHERE config_key = ?', [key]);
}

export async function getThresholdValue(key: string, defaultValue: string = ''): Promise<string> {
	const threshold = await getThresholdByKey(key);
	return threshold?.config_value ?? defaultValue;
}

export async function updateThreshold(key: string, value: string): Promise<boolean> {
	const db = await getDb();
	const result = db.run(
		'UPDATE thresholds SET config_value = ?, updated_at = datetime("now") WHERE config_key = ?',
		[value, key]
	);
	return db.getRowsModified() > 0;
}

export async function updateThresholds(configs: { key: string; value: string }[]): Promise<boolean> {
	const db = await getDb();
	for (const item of configs) {
		db.run(
			'UPDATE thresholds SET config_value = ?, updated_at = datetime("now") WHERE config_key = ?',
			[item.value, item.key]
		);
	}
	return true;
}

export async function getThresholdsByCategory(category: string): Promise<ThresholdConfig[]> {
	const db = await getDb();
	return queryAll<ThresholdConfig>(
		db,
		'SELECT * FROM thresholds WHERE category = ? ORDER BY config_key',
		[category]
	);
}

export async function getThresholdCategories(): Promise<string[]> {
	const db = await getDb();
	const rows = queryAll<{ category: string }>(
		db,
		'SELECT DISTINCT category FROM thresholds WHERE category IS NOT NULL ORDER BY category'
	);
	return rows.map((r) => r.category);
}
