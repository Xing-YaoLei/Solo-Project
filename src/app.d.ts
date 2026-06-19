import type { User, Session } from 'lucia';

declare global {
	namespace App {
		interface Error {}
		interface Locals {
			user: User | null;
			session: Session | null;
		}
		interface PageData {}
		interface PageState {}
		interface Platform {}
	}
}

declare module 'lucia' {
	interface Register {
		UserId: string;
		DatabaseUserAttributes: {
			username: string;
			display_name: string;
			role_id: string;
			phone?: string | null;
		};
	}
}

export {};
