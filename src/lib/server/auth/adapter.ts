import type { Adapter, DatabaseSession, DatabaseUser } from 'lucia';
import type { Sql } from 'postgres';

interface PostgresSession {
	id: string;
	user_id: string;
	expires_at: Date;
	[key: string]: any;
}

interface PostgresUser {
	id: string;
	[key: string]: any;
}

export function postgresAdapter(sql: Sql): Adapter {
	return {
		async getSessionAndUser(sessionId: string): Promise<[DatabaseSession | null, DatabaseUser | null]> {
			const [sessionRow] = await sql<PostgresSession[]>`
				SELECT * FROM sessions WHERE id = ${sessionId}
			`;
			if (!sessionRow) {
				return [null, null];
			}

			const [userRow] = await sql<PostgresUser[]>`
				SELECT * FROM users WHERE id = ${sessionRow.user_id}
			`;
			if (!userRow) {
				return [null, null];
			}

			const { id: sId, user_id: sUserId, expires_at: sExpiresAt, ...sessionAttrs } = sessionRow;
			const { id: uId, ...userAttrs } = userRow;

			return [
				{
					id: sId,
					userId: sUserId,
					expiresAt: new Date(sExpiresAt),
					attributes: sessionAttrs as any
				},
				{
					id: uId,
					attributes: userAttrs as any
				}
			];
		},

		async getUserSessions(userId: string): Promise<DatabaseSession[]> {
			const rows = await sql<PostgresSession[]>`
				SELECT * FROM sessions WHERE user_id = ${userId}
			`;
			return rows.map((row) => {
				const { id, user_id, expires_at, ...attrs } = row;
				return {
					id,
					userId: user_id,
					expiresAt: new Date(expires_at),
					attributes: attrs as any
				};
			});
		},

		async setSession(session: DatabaseSession): Promise<void> {
			await sql`
				INSERT INTO sessions (id, user_id, expires_at)
				VALUES (${session.id}, ${session.userId}, ${session.expiresAt})
			`;
		},

		async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
			await sql`
				UPDATE sessions SET expires_at = ${expiresAt} WHERE id = ${sessionId}
			`;
		},

		async deleteSession(sessionId: string): Promise<void> {
			await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
		},

		async deleteUserSessions(userId: string): Promise<void> {
			await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
		},

		async deleteExpiredSessions(): Promise<void> {
			await sql`DELETE FROM sessions WHERE expires_at < NOW()`;
		}
	};
}
