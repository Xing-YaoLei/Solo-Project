import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { createMockDb, type MockDb } from './seed';

export type Database = PostgresJsDatabase<typeof schema>;

export interface DbInstance {
  db: Database | MockDb;
  isMock: boolean;
}

let dbInstance: DbInstance | null = null;

async function createPostgresConnection(): Promise<Database | null> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn('[DB] DATABASE_URL not set, using mock mode');
    return null;
  }

  try {
    const client = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 5,
      connect_timeout: 5
    });

    await client`SELECT 1`;

    const db = drizzle(client, { schema });
    console.log('[DB] PostgreSQL connection established');
    return db;
  } catch (error) {
    console.warn('[DB] Failed to connect to PostgreSQL, falling back to mock mode:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function getDb(): Promise<DbInstance> {
  if (dbInstance) {
    return dbInstance;
  }

  const postgresDb = await createPostgresConnection();

  if (postgresDb) {
    dbInstance = {
      db: postgresDb,
      isMock: false
    };
  } else {
    const mockDb = createMockDb();
    dbInstance = {
      db: mockDb,
      isMock: true
    };
    console.log('[DB] Running in mock mode with in-memory data');
  }

  return dbInstance;
}

export function resetDb(): void {
  dbInstance = null;
}

export type { MockDb } from './seed';
