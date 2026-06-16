import { Lucia, type Session, type User as LuciaUser } from 'lucia';
import { PostgresJsAdapter } from '@lucia-auth/adapter-postgresql';
import postgres from 'postgres';
import type { UserRole, SessionUser } from '../../shared/types';
import { getDb, type DbInstance, type Database } from '../db';
import { mockUsers } from '../db/seed';

declare module 'lucia' {
  interface Register {
    Lucia: typeof Lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
}

let luciaInstance: Lucia | null = null;
let mockSessionStore: Map<string, MockSession> = new Map();

interface MockSession {
  id: string;
  userId: string;
  expiresAt: Date;
  fresh: boolean;
}

function createLucia(): Lucia | null {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn('[Auth] DATABASE_URL not set, using mock auth mode');
    return null;
  }

  try {
    const client = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 5,
      connect_timeout: 5
    });

    const adapter = new PostgresJsAdapter(client, {
      user: 'users',
      session: 'user_sessions'
    });

    return new Lucia(adapter, {
      sessionCookie: {
        attributes: {
          secure: process.env.NODE_ENV === 'production'
        }
      },
      getUserAttributes: (attributes) => {
        return {
          email: attributes.email,
          name: attributes.name,
          role: attributes.role,
          isActive: attributes.is_active
        };
      }
    });
  } catch (error) {
    console.warn('[Auth] Failed to initialize Lucia, falling back to mock mode:', error instanceof Error ? error.message : error);
    return null;
  }
}

export function getLucia(): Lucia | null {
  if (!luciaInstance) {
    luciaInstance = createLucia();
  }
  return luciaInstance;
}

export function resetLucia(): void {
  luciaInstance = null;
  mockSessionStore.clear();
}

export interface AuthSession {
  session: Session | MockSession | null;
  user: SessionUser | null;
}

async function validateRealSession(sessionId: string): Promise<AuthSession> {
  const lucia = getLucia();
  if (!lucia) return { session: null, user: null };

  try {
    const result = await lucia.validateSession(sessionId);
    if (!result.session || !result.user) {
      return { session: null, user: null };
    }
    const dbUser = result.user as LuciaUser & { email: string; name: string; role: UserRole; isActive: boolean };
    if (!dbUser.isActive) {
      return { session: null, user: null };
    }
    return {
      session: result.session,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role
      }
    };
  } catch (error) {
    console.warn('[Auth] Session validation failed:', error instanceof Error ? error.message : error);
    return { session: null, user: null };
  }
}

function generateMockSessionId(): string {
  return 'mock_session_' + Math.random().toString(36).substring(2, 15);
}

async function validateMockSession(sessionId: string): Promise<AuthSession> {
  if (sessionId.startsWith('mock-token-')) {
    const parts = sessionId.split('-');
    const userId = parts.slice(2, 5).join('-');
    const mockUser = mockUsers.find((u) => u.id === userId);
    if (mockUser && mockUser.isActive) {
      return {
        session: {
          id: sessionId,
          userId: mockUser.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          fresh: true
        },
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role
        }
      };
    }
  }

  const stored = mockSessionStore.get(sessionId);
  if (!stored) {
    return { session: null, user: null };
  }

  if (stored.expiresAt < new Date()) {
    mockSessionStore.delete(sessionId);
    return { session: null, user: null };
  }

  const mockUser = mockUsers.find((u) => u.id === stored.userId);
  if (!mockUser || !mockUser.isActive) {
    return { session: null, user: null };
  }

  return {
    session: stored,
    user: {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role
    }
  };
}

export async function validateSession(sessionId: string | null | undefined): Promise<AuthSession> {
  if (!sessionId) {
    return { session: null, user: null };
  }

  const lucia = getLucia();
  if (lucia) {
    return validateRealSession(sessionId);
  }

  return validateMockSession(sessionId);
}

async function createRealSession(userId: string): Promise<{ session: Session; user: SessionUser } | null> {
  const lucia = getLucia();
  if (!lucia) return null;

  try {
    const session = await lucia.createSession(userId, {});
    const { user } = await validateRealSession(session.id);
    if (!user) return null;
    return { session, user };
  } catch (error) {
    console.warn('[Auth] Failed to create session:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function createMockSession(userId: string): Promise<{ session: MockSession; user: SessionUser } | null> {
  const mockUser = mockUsers.find((u) => u.id === userId);
  if (!mockUser || !mockUser.isActive) {
    return null;
  }

  const sessionId = generateMockSessionId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const session: MockSession = {
    id: sessionId,
    userId,
    expiresAt,
    fresh: true
  };

  mockSessionStore.set(sessionId, session);

  return {
    session,
    user: {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role
    }
  };
}

export async function createSession(userId: string): Promise<{ session: Session | MockSession; user: SessionUser } | null> {
  const lucia = getLucia();
  if (lucia) {
    return createRealSession(userId);
  }
  return createMockSession(userId);
}

async function invalidateRealSession(sessionId: string): Promise<void> {
  const lucia = getLucia();
  if (!lucia) return;
  try {
    await lucia.invalidateSession(sessionId);
  } catch (error) {
    console.warn('[Auth] Failed to invalidate session:', error instanceof Error ? error.message : error);
  }
}

function invalidateMockSession(sessionId: string): void {
  mockSessionStore.delete(sessionId);
}

export async function invalidateSession(sessionId: string): Promise<void> {
  const lucia = getLucia();
  if (lucia) {
    await invalidateRealSession(sessionId);
  } else {
    invalidateMockSession(sessionId);
  }
}

export async function login(email: string, password: string): Promise<{ session: Session | MockSession; user: SessionUser } | null> {
  const dbInstance: DbInstance = await getDb();

  if (dbInstance.isMock) {
    const mockUser = mockUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.isActive
    );
    if (!mockUser) return null;
    if (password !== 'password123') return null;
    return createMockSession(mockUser.id);
  }

  // TODO: Implement real password verification with hashing
  const db = dbInstance.db as Database;
  const user = await db.query.users.findFirst({
    where: (users, { eq, and }) => and(eq(users.email, email.toLowerCase()), eq(users.isActive, true))
  });

  if (!user) return null;

  return createRealSession(user.id);
}

export function isMockAuth(): boolean {
  return getLucia() === null;
}

export type { MockSession };
