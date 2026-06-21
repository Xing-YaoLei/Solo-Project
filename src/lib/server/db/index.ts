import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/minsu_cleaning';
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
