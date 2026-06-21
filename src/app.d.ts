import type { User, Session } from '$lib/server/auth';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			session: Session | null;
		}
		interface PageData {
			user: User | null;
		}
		interface Error {
			message: string;
			errorId?: string;
		}
	}
}

export {};
