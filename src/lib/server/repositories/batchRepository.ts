import db from '../db';
import type { ImportBatch, SourceType, BatchStatus } from '$lib/types';

interface BatchRow {
	id: string;
	name: string;
	source_type: SourceType;
	status: BatchStatus;
	record_count: number;
	merged_count: number;
	created_at: string;
	created_by: string;
}

export function createBatch(
	id: string,
	name: string,
	sourceType: SourceType,
	createdBy: string,
	recordCount: number
): void {
	db.prepare(
		`INSERT INTO import_batches (id, name, source_type, status, record_count, merged_count, created_by)
		 VALUES (?, ?, ?, 'processing', ?, 0, ?)`
	).run(id, name, sourceType, recordCount, createdBy);
}

export function updateBatchStatus(id: string, status: BatchStatus, mergedCount?: number): void {
	if (mergedCount !== undefined) {
		db.prepare('UPDATE import_batches SET status = ?, merged_count = ? WHERE id = ?').run(status, mergedCount, id);
	} else {
		db.prepare('UPDATE import_batches SET status = ? WHERE id = ?').run(status, id);
	}
}

export function listBatches(limit = 50): ImportBatch[] {
	const rows = db
		.prepare('SELECT * FROM import_batches ORDER BY created_at DESC LIMIT ?')
		.all(limit) as BatchRow[];
	return rows.map(mapBatch);
}

export function getBatchById(id: string): ImportBatch | null {
	const row = db.prepare('SELECT * FROM import_batches WHERE id = ?').get(id) as BatchRow | undefined;
	if (!row) return null;
	return mapBatch(row);
}

function mapBatch(r: BatchRow): ImportBatch {
	return {
		id: r.id,
		name: r.name,
		sourceType: r.source_type,
		status: r.status,
		recordCount: r.record_count,
		mergedCount: r.merged_count,
		createdAt: r.created_at,
		createdBy: r.created_by
	};
}
