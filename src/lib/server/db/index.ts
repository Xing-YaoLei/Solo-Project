import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/pharmacy_followup';
const client = postgres(databaseUrl);

export const db = drizzle(client, { schema });
