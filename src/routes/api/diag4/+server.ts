import { json, type RequestHandler } from '@sveltejs/kit';
import { createContext } from '$server/trpc/context';
import { validateSession } from '$server/auth/lucia';
import { mockUsers } from '$server/db/seed';

export const GET: RequestHandler = async (event) => {
  const authHeader = event.request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const debug: Record<string, any> = {
    authHeader,
    token,
    tokenParsed: null,
    mockUserIds: mockUsers.map(u => u.id),
    validateSessionResult: null,
    createContextResult: null
  };

  if (token) {
    const parts = token.split('-');
    const userId = parts.slice(2, 5).join('-');
    debug.tokenParsed = {
      parts,
      userId,
      matchedUser: mockUsers.find(u => u.id === userId) ? 'FOUND' : 'NOT FOUND'
    };

    debug.validateSessionResult = await validateSession(token);
  }

  debug.createContextResult = await createContext({ event });

  return json(debug);
};
