import { Lucia } from 'lucia';
import { NodePostgresAdapter } from '@lucia-auth/adapter-postgresql';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const adapter = new NodePostgresAdapter(pool, {
  user: 'users',
  session: 'sessions'
});

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production'
    }
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
      name: attributes.name,
      role: attributes.role,
      region: attributes.region
    };
  }
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      username: string;
      name: string;
      role: string;
      region?: string | null;
    };
  }
}

export type UserRole = 'admin' | 'frontline' | 'manager' | 'analyst';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['all'],
  frontline: ['workorder:create', 'workorder:edit', 'shortage:report', 'query:read'],
  manager: ['shortage:process', 'shortage:assign', 'query:read'],
  analyst: ['query:read', 'analysis:read']
};

export function hasPermission(userRole: string, permission: string): boolean {
  const role = userRole as UserRole;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('all') || permissions.includes(permission);
}
