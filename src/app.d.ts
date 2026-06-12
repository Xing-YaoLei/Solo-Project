declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				username: string;
				role: string;
				realName?: string | null;
				region?: string | null;
			} | null;
			session: { id: string; userId: string; expiresAt: Date; fresh: boolean } | null;
		}
	}
}

export {};
