import { NextResponse } from 'next/server';
import { generateToken } from '@/lib/utils';
import type { ShareLinkCreateRequest, ShareLinkResponse } from '@/types';
import { UserRole } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ShareLinkCreateRequest;
    const { role, activityIds, expiresInHours } = body;

    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${token}`;

    const response: ShareLinkResponse = {
      token,
      url: shareUrl,
      expiresAt,
      role,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Failed to create share link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}
