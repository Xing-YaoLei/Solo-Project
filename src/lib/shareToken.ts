import crypto from 'crypto';

const SHARE_SECRET = process.env.SHARE_LINK_SECRET || 'auto-repair-share-secret-dev-key';

export interface ShareTokenPayload {
  token: string;
  allowedRole: string;
  scope: string[];
  expiresAt?: string;
  createdAt: string;
}

export function signShareToken(payload: ShareTokenPayload): string {
  const data = `${payload.token}:${payload.allowedRole}:${JSON.stringify(payload.scope)}:${payload.expiresAt || ''}:${payload.createdAt}`;
  return crypto
    .createHmac('sha256', SHARE_SECRET)
    .update(data)
    .digest('hex');
}

export function verifyShareToken(payload: ShareTokenPayload, signature: string): boolean {
  const expected = signShareToken(payload);
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

export function generateShareToken(): string {
  return crypto.randomBytes(24).toString('hex');
}
