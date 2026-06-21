import type { User as LuciaUser } from 'lucia';

declare global {
	namespace App {
		interface Locals {
			user: LuciaUser | null;
			session: { id: string; userId: string; expiresAt: Date } | null;
		}
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
