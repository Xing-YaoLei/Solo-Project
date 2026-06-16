import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = path.join(process.cwd(), 'local.db');
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

const runMigrations = () => {
	const migrationsFolder = path.join(process.cwd(), 'drizzle');
	if (fs.existsSync(migrationsFolder) && fs.readdirSync(migrationsFolder).length > 0) {
		try {
			migrate(db, { migrationsFolder });
		} catch (e) {
			console.warn('Migration warning:', e);
		}
	}
};

runMigrations();
