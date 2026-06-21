import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let DATABASE_URL: string;
try {
	DATABASE_URL = process.env.DATABASE_URL || '';
} catch {
	DATABASE_URL = '';
}

if (!DATABASE_URL) {
	DATABASE_URL = 'postgresql://localhost:5432/design_change';
}

const client = postgres(DATABASE_URL, {
	max: 1,
	idle_timeout: 20
});

export const db = drizzle(client, { schema });
