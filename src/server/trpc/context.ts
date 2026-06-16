import type { RequestEvent } from '@sveltejs/kit';
import { getDb, type DbInstance, type Database, type MockDb } from '../db';
import { validateSession, type AuthSession } from '../auth/lucia';
import type { SessionUser, UserRole } from '../../shared/types';

export interface TrpcContext {
  db: Database | MockDb;
  isMockDb: boolean;
  session: AuthSession['session'];
  user: SessionUser | null;
}

export interface CreateContextOptions {
  event?: RequestEvent;
  sessionId?: string;
}

function extractSessionId(options: CreateContextOptions): string | null {
  if (options.sessionId) {
    return options.sessionId;
  }

  if (options.event) {
    const authHeader = options.event.request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    const cookieHeader = options.event.request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/auth_session=([^;]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
  }

  return null;
}

export async function createContext(options: CreateContextOptions = {}): Promise<TrpcContext> {
  const dbInstance: DbInstance = await getDb();
  const sessionId = extractSessionId(options);
  const authSession = await validateSession(sessionId);

  return {
    db: dbInstance.db,
    isMockDb: dbInstance.isMock,
    session: authSession.session,
    user: authSession.user
  };
}

export type { UserRole };
