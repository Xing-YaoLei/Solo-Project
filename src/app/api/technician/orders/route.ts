import { NextResponse } from 'next/server';
import { getTechnicianOrders } from '@/services/metricsService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const technicianId = searchParams.get('technicianId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!technicianId) {
      return NextResponse.json(
        { error: '缺少技师ID参数' },
        { status: 400 }
      );
    }

    const data = await getTechnicianOrders(
      technicianId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: '获取技师订单失败' },
      { status: 500 }
    );
  }
}
