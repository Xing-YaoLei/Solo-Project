import initSqlJs, {
	type SqlJsStatic,
	type SqlJsDatabase,
	type SqlJsBindParams
} from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../../../data');

if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'test_drive.db');

let SQL: SqlJsStatic | null = null;
let dbInstance: SqlJsDatabase | null = null;
let initPromise: Promise<void> | null = null;

type Row = Record<string, unknown>;

export interface PreparedStatement {
	run(...params: unknown[]): { changes: number };
	get(...params: unknown[]): Row | undefined;
	all(...params: unknown[]): Row[];
}

export interface DatabaseFacade {
	exec(sql: string): void;
	pragma(sql: string): void;
	prepare(sql: string): PreparedStatement;
	transaction<T>(fn: () => T): () => T;
}

function checkDb(): SqlJsDatabase {
	if (!dbInstance) throw new Error('Database not initialized yet. Call await initDatabase() first.');
	return dbInstance;
}

function wrapPrepared(sql: string): PreparedStatement {
	return {
		run(...params: unknown[]) {
			const d = checkDb();
			d.run(sql, params as SqlJsBindParams);
			const changes = (d as unknown as { getRowsModified?: () => number }).getRowsModified?.() ?? 0;
			persist();
			return { changes };
		},
		get(...params: unknown[]) {
			const d = checkDb();
			const results = d.exec(sql, params as SqlJsBindParams);
			if (!results.length || !results[0].values.length) return undefined;
			const cols = results[0].columns;
			const row = results[0].values[0];
			const obj: Row = {};
			cols.forEach((c: string, i: number) => (obj[c] = row[i]));
			return obj;
		},
		all(...params: unknown[]) {
			const d = checkDb();
			const results = d.exec(sql, params as SqlJsBindParams);
			if (!results.length) return [];
			const cols = results[0].columns;
			return results[0].values.map((row: unknown[]) => {
				const obj: Row = {};
				cols.forEach((c: string, i: number) => (obj[c] = row[i]));
				return obj;
			});
		}
	};
}

function persist() {
	if (dbInstance) {
		try {
			const data = dbInstance.export();
			fs.writeFileSync(dbPath, Buffer.from(data));
		} catch (e) {
			console.error('DB persist failed:', e);
		}
	}
}

export async function initDatabase(): Promise<void> {
	if (dbInstance) return;
	if (initPromise) return initPromise;

	initPromise = (async () => {
		SQL = await initSqlJs();

		let fileBuffer: Uint8Array | undefined;
		if (fs.existsSync(dbPath)) {
			try {
				fileBuffer = fs.readFileSync(dbPath);
			} catch {
				fileBuffer = undefined;
			}
		}

		dbInstance = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();
	})();

	return initPromise;
}

export function isDatabaseReady(): boolean {
	return dbInstance !== null;
}

const facade: DatabaseFacade = {
	exec(sql: string) {
		const d = checkDb();
		d.exec(sql);
		persist();
	},
	pragma(_sql: string) {
		// sql.js has limited pragma support, no-op
	},
	prepare(sql: string): PreparedStatement {
		return wrapPrepared(sql);
	},
	transaction<T>(fn: () => T): () => T {
		return () => {
			const d = checkDb();
			d.exec('BEGIN TRANSACTION');
			try {
				const result = fn();
				d.exec('COMMIT');
				persist();
				return result;
			} catch (e) {
				d.exec('ROLLBACK');
				throw e;
			}
		};
	}
};

export default facade;
