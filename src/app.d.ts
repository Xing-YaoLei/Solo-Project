import type { User } from 'lucia';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			session: { id: string; userId: string; expiresAt: Date; fresh: boolean } | null;
		}
	}
}

export {};
