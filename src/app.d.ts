/// <reference types="@sveltejs/kit" />

import type { User } from '$lib/server/db/schema';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			session: { id: string } | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
