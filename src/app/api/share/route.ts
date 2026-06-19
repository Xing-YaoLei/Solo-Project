import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/constants';
import { generateShareToken, signShareToken, verifyShareToken } from '@/lib/shareToken';
import { getCurrentUser } from '@/lib/dataService';
import { UserRole } from '@prisma/client';

function roleToPrismaRole(role: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    admin: UserRole.ADMIN,
    dispatcher: UserRole.DISPATCHER,
    inspector: UserRole.INSPECTOR,
    viewer: UserRole.VIEWER,
  };
  return roleMap[role] || UserRole.VIEWER;
}

function prismaRoleToString(role: UserRole): string {
  return role.toLowerCase();
}

export async function POST(req: Request) {
  try {
    const {
      allowedRole = 'viewer',
      scope = ['dashboard:view'],
      expiresIn = 86400,
    } = await req.json();

    const filteredScope = scope.filter((p: string) => hasPermission(allowedRole, p));

    if (filteredScope.length === 0) {
      return NextResponse.json(
        { error: '没有可分享的权限范围' },
        { status: 400 }
      );
    }

    const token = generateShareToken();
    const currentUser = await getCurrentUser();
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const createdAt = new Date();

    const payload = {
      token,
      allowedRole,
      scope: filteredScope,
      expiresAt: expiresAt.toISOString(),
      createdAt: createdAt.toISOString(),
    };

    const signature = signShareToken(payload);

    let shareLink = null;
    let finalToken = token;
    try {
      shareLink = await prisma.shareLink.create({
        data: {
          token,
          creatorId: currentUser.id,
          allowedRole: roleToPrismaRole(allowedRole),
          scope: filteredScope as any,
          expiresAt,
          signature,
        },
      });
    } catch (dbError) {
      console.warn('[API share] 数据库写入失败，使用无持久化模式');
      finalToken = Buffer.from(JSON.stringify(payload))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }

    return NextResponse.json({
      token: finalToken,
      url: `/share/${finalToken}`,
      allowedRole,
      scope: filteredScope,
      expiresAt: expiresAt.toISOString(),
      signature,
      persisted: !!shareLink,
    });
  } catch (error) {
    console.error('[API share] 错误:', error);
    return NextResponse.json(
      { error: '创建分享链接失败' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const signature = searchParams.get('signature');

    if (!token) {
      return NextResponse.json({ valid: false, error: '缺少 token' }, { status: 400 });
    }

    let shareLink: any = null;
    let fromDb = false;

    try {
      shareLink = await prisma.shareLink.findUnique({
        where: { token },
        include: { creator: true },
      });
      fromDb = true;
    } catch (dbError) {
      console.warn('[API share] 数据库查询失败，尝试签名验证模式');
    }

    if (fromDb && shareLink) {
      if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
        return NextResponse.json(
          { valid: false, error: '链接已过期' },
          { status: 403 }
        );
      }

      if (shareLink.signature) {
        const payload = {
          token: shareLink.token,
          allowedRole: prismaRoleToString(shareLink.allowedRole),
          scope: shareLink.scope,
          expiresAt: shareLink.expiresAt?.toISOString(),
          createdAt: shareLink.createdAt.toISOString(),
        };
        const isValid = verifyShareToken(payload, shareLink.signature);
        if (!isValid) {
          return NextResponse.json(
            { valid: false, error: '签名验证失败' },
            { status: 403 }
          );
        }
      }

      return NextResponse.json({
        valid: true,
        token: shareLink.token,
        allowedRole: prismaRoleToString(shareLink.allowedRole),
        scope: shareLink.scope,
        expiresAt: shareLink.expiresAt?.toISOString(),
        createdAt: shareLink.createdAt.toISOString(),
        fromDatabase: true,
      });
    }

    if (signature) {
      try {
        let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
        const pad = 4 - (base64.length % 4);
        if (pad !== 4) base64 += '='.repeat(pad);
        const decoded = JSON.parse(Buffer.from(base64, 'base64').toString());
        const payload = {
          token: decoded.token,
          allowedRole: decoded.allowedRole,
          scope: decoded.scope,
          expiresAt: decoded.expiresAt,
          createdAt: decoded.createdAt,
        };

        const isValid = verifyShareToken(payload, signature);
        if (!isValid) {
          return NextResponse.json(
            { valid: false, error: '签名验证失败' },
            { status: 403 }
          );
        }

        if (decoded.expiresAt && new Date(decoded.expiresAt) < new Date()) {
          return NextResponse.json(
            { valid: false, error: '链接已过期' },
            { status: 403 }
          );
        }

        return NextResponse.json({
          valid: true,
          ...decoded,
          fromDatabase: false,
          signatureVerified: true,
        });
      } catch (e) {
        console.error('[API share GET] 签名验证模式解析失败:', e);
        return NextResponse.json(
          { valid: false, error: '无效的 token' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { valid: false, error: '分享链接不存在' },
      { status: 404 }
    );
  } catch (error) {
    console.error('[API share GET] 错误:', error);
    return NextResponse.json(
      { error: '验证分享链接失败' },
      { status: 500 }
    );
  }
}
