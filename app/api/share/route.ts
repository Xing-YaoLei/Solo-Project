import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import type { ApiResponse, UserRole, DataScope } from '@/types';
import { CLEANING_PUNCTUALITY_RULE, generateToken } from '@/lib/utils';
import { saveShareLink, findShareLinkByToken, getCleaningPunctuality } from '@/lib/dbService';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const auth = await getAuthContext();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (token) {
    const link = await findShareLinkByToken(token);
    if (link) {
      return NextResponse.json({
        success: true,
        data: {
          id: link.id,
          token,
          role: link.role,
          dataScope: link.dataScope,
          accessCount: link.accessCount,
        },
      } as ApiResponse<any>);
    }
    return NextResponse.json({
      success: false,
      error: { code: 'NOT_FOUND', message: '分享链接不存在或已过期' },
    } as ApiResponse<null>, { status: 404 });
  }

  let userLinks: any[] = [];
  try {
    if (auth.user?.id) {
      userLinks = await prisma.shareLink.findMany({
        where: { userId: auth.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    }
  } catch (e) {
    console.warn('share GET prisma error, skip:', (e as Error).message);
  }

  const punctuality = await getCleaningPunctuality(auth.dataScope);
  return NextResponse.json({
    success: true,
    data: userLinks,
    metadata: {
      lastRefreshedAt: new Date().toISOString(),
      dataScope: auth.dataScope,
      punctualityRate: punctuality.punctualityRate,
      calculationRule: CLEANING_PUNCTUALITY_RULE,
    },
  } as ApiResponse<any>);
}

export async function POST(request: Request) {
  const auth = await getAuthContext();
  const body = await request.json();
  const { role, expiresAt, password, dataScope: customDataScope } = body;

  const selectedRole = (role || auth.dataScope.role) as UserRole;
  const dataScope: DataScope = customDataScope || {
    ...auth.dataScope,
    role: selectedRole,
  };

  const token = `${selectedRole}_${generateToken().slice(0, 20)}`;

  let passwordHash: string | undefined = undefined;
  if (password) {
    passwordHash = btoa(password).slice(0, 16);
  }

  const saved = await saveShareLink({
    token,
    userId: auth.user?.id || `user-${auth.dataScope.role}`,
    role: selectedRole,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    passwordHash,
    dataScope,
  });

  const punctuality = await getCleaningPunctuality(auth.dataScope);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${token}`;

  const response: ApiResponse<{ shareLink: any; shareUrl: string }> = {
    success: true,
    data: {
      shareLink: { id: saved.id, token, role: selectedRole, dataScope },
      shareUrl,
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

  try {
    if (id) {
      await prisma.shareLink.delete({ where: { id } });
    }
  } catch (e) {
    console.warn('share DELETE prisma error, skip:', (e as Error).message);
  }

  return NextResponse.json({ success: true } as ApiResponse<null>);
}
