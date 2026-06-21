import { NextResponse } from 'next/server';
import { generateToken } from '@/lib/utils';
import type { ShareLinkCreateRequest, ShareLinkResponse } from '@/types';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';

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

    let createdBy = 'system';
    try {
      const existingUser = await prisma.user.findFirst();
      if (existingUser) {
        createdBy = existingUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: 'system@example.com',
            name: 'System',
            role: UserRole.admin,
          },
        });
        createdBy = newUser.id;
      }
    } catch (dbError) {
      console.error('Failed to prepare user for share link:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to create share link' },
        { status: 500 }
      );
    }

    try {
      await prisma.shareLink.create({
        data: {
          token,
          createdBy,
          role,
          activityIds: activityIds || [],
          expiresAt,
        },
      });
    } catch (dbError) {
      console.error('Failed to save share link to database:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to create share link' },
        { status: 500 }
      );
    }

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
