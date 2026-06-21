import { NextResponse } from 'next/server';
import {
  validateShareToken,
  getDashboardOverview,
  getSeatTrendData,
  getOrderComposition,
} from '@/services/dashboardService';
import { UserRole } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const validation = await validateShareToken(token);

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error || '无效的分享链接' },
        { status: 404 }
      );
    }

    const { role, activityIds, expiresAt } = validation;

    const filteredActivityIds = activityIds && activityIds.length > 0
      ? activityIds
      : undefined;

    const [overview, seatTrend, orderComposition] = await Promise.all([
      getDashboardOverview(filteredActivityIds),
      getSeatTrendData(filteredActivityIds),
      getOrderComposition(filteredActivityIds),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        shareInfo: {
          role,
          expiresAt,
          activityIds: filteredActivityIds || [],
        },
        overview,
        seatTrend,
        orderComposition,
      },
    });
  } catch (error) {
    console.error('Failed to fetch share data:', error);
    return NextResponse.json(
      { success: false, error: '获取分享数据失败' },
      { status: 500 }
    );
  }
}
