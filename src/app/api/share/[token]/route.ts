import { NextResponse } from 'next/server';
import {
  validateShareToken,
  getDashboardSnapshot,
  filterOverviewByRole,
  filterOrderCompositionByRole,
  filterLockRecordsByRole,
  filterAreaHeatmapByRole,
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

    if (!role) {
      return NextResponse.json(
        { success: false, error: '分享链接角色配置无效' },
        { status: 500 }
      );
    }

    const filteredActivityIds = activityIds && activityIds.length > 0
      ? activityIds
      : undefined;

    const snapshot = await getDashboardSnapshot(filteredActivityIds);

    const filteredOverview = filterOverviewByRole(snapshot.overview, role);
    const filteredOrderComposition = filterOrderCompositionByRole(snapshot.orderComposition, role);
    const filteredLockRecords = filterLockRecordsByRole(snapshot.lockRecords, role);

    let filteredTicketTypes = snapshot.ticketTypes;
    if (role === UserRole.finance) {
      filteredTicketTypes = snapshot.ticketTypes.map(tt => ({
        ...tt,
        restrictions: [],
        description: null,
      }));
    }

    let filteredSeatTrend = snapshot.seatTrend;
    if (role === UserRole.finance) {
      filteredSeatTrend = snapshot.seatTrend.map(d => ({
        ...d,
        locked: 0,
      }));
    }

    const filteredAreaHeatmap = filterAreaHeatmapByRole(snapshot.areaHeatmap, role);

    return NextResponse.json({
      success: true,
      data: {
        shareInfo: {
          role,
          expiresAt,
          activityIds: filteredActivityIds || [],
        },
        lastRefreshedAt: snapshot.lastRefreshedAt,
        occupancyRateSpec: snapshot.occupancyRateSpec,
        overview: filteredOverview,
        seatTrend: filteredSeatTrend,
        orderComposition: filteredOrderComposition,
        ticketTypes: filteredTicketTypes,
        lockRecords: filteredLockRecords,
        areaHeatmap: filteredAreaHeatmap,
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
