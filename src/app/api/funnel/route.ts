import { NextResponse } from 'next/server';
import { getOrthoFunnelData, getMissedAppointmentPatients } from '@/services/funnelService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const [funnelData, missedPatients] = await Promise.all([
      getOrthoFunnelData(startDate, endDate),
      getMissedAppointmentPatients(startDate, endDate),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        funnelData,
        missedPatients,
      },
    });
  } catch (error) {
    console.error('获取漏斗数据失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取漏斗数据失败',
      },
      { status: 500 }
    );
  }
}
