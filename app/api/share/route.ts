import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import type { ApiResponse, ShareLink, UserRole } from '@/types';
import { CLEANING_PUNCTUALITY_RULE, generateToken } from '@/lib/utils';
import { generateCleaningPunctuality } from '@/lib/mockData';

const shareLinks: ShareLink[] = [];

export async function GET(request: Request) {
  const auth = await getAuthContext();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (token) {
    const link = shareLinks.find(l => l.token === token);
    if (link) {
      link.accessCount++;
      link.lastAccessedAt = new Date().toISOString();
      return NextResponse.json({ success: true, data: link } as ApiResponse<ShareLink>);
    }
    return NextResponse.json({
      success: false,
      error: { code: 'NOT_FOUND', message: '分享链接不存在或已过期' },
    } as ApiResponse<null>, { status: 404 });
  }

  const userLinks = shareLinks.filter(l => l.createdBy === auth.user?.id);
  return NextResponse.json({ success: true, data: userLinks } as ApiResponse<ShareLink[]>);
}

export async function POST(request: Request) {
  const auth = await getAuthContext();
  const body = await request.json();
  const { role, expiresAt, password, dataScope } = body;

  const token = `${role}_${generateToken().slice(0, 16)}`;
  const newLink: ShareLink = {
    id: `share_${Date.now()}`,
    token,
    role: role as UserRole,
    createdBy: auth.user?.id || '',
    expiresAt,
    password,
    dataScope: dataScope || auth.dataScope,
    createdAt: new Date().toISOString(),
    accessCount: 0,
  };

  shareLinks.push(newLink);

  const punctuality = generateCleaningPunctuality();

  const response: ApiResponse<{ shareLink: ShareLink; shareUrl: string }> = {
    success: true,
    data: {
      shareLink: newLink,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${token}`,
    },
    metadata: {
      lastRefreshedAt: new Date().toISOString(),
      dataScope: auth.dataScope,
      punctualityRate: punctuality.punctualityRate,
      calculationRule: CLEANING_PUNCTUALITY_RULE,
    },
  };

  return NextResponse.json(response);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const index = shareLinks.findIndex(l => l.id === id);
  if (index > -1) {
    shareLinks.splice(index, 1);
    return NextResponse.json({ success: true } as ApiResponse<null>);
  }

  return NextResponse.json({
    success: false,
    error: { code: 'NOT_FOUND', message: '分享链接不存在' },
  } as ApiResponse<null>, { status: 404 });
}
