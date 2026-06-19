import { Scrypt } from 'lucia';

const scrypt = new Scrypt();

export async function hashPassword(plain: string): Promise<string> {
	return await scrypt.hash(plain);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
	return await scrypt.verify(hash, plain);
}
