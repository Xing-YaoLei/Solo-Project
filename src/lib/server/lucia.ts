import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { sessions, users } from './db/schema';

const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: import.meta.env.PROD
    }
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
      name: attributes.name,
      role: attributes.role,
      pharmacyId: attributes.pharmacyId
    };
  }
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  username: string;
  name: string;
  role: string;
  pharmacyId: string | null;
}
