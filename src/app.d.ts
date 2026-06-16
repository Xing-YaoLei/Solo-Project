import type { SessionUser } from '$shared/types';

declare global {
	namespace App {
		interface Locals {
			user: SessionUser | null;
		}
		interface PageData {
			user: SessionUser | null;
		}
		interface Error {
			message: string;
		}
	}
}

export {};
