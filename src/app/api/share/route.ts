import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/constants';
import { UserRole } from '@/types';

export async function POST(req: Request) {
  const { allowedRole = 'viewer', scope = ['dashboard:view'], expiresIn = 86400 } = await req.json();

  const filteredScope = scope.filter((p: string) => hasPermission(allowedRole, p));

  const token = Buffer.from(
    JSON.stringify({
      allowedRole,
      scope: filteredScope,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresIn * 1000,
    }),
  ).toString('base64');

  return NextResponse.json({
    token,
    url: `/share/${token}`,
    allowedRole,
    scope: filteredScope,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ valid: false, error: '缺少 token' }, { status: 400 });
  }

  try {
    const data = JSON.parse(Buffer.from(token, 'base64').toString());
    if (data.expiresAt < Date.now()) {
      return NextResponse.json({ valid: false, error: '链接已过期' }, { status: 403 });
    }
    return NextResponse.json({ valid: true, ...data });
  } catch {
    return NextResponse.json({ valid: false, error: '无效的 token' }, { status: 400 });
  }
}
