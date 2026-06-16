import { NextResponse } from 'next/server';
import { getReviewMaterial, checkAndGenerateAlerts } from '@/services/funnelService';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id;
    const reviewMaterial = await getReviewMaterial(patientId);

    return NextResponse.json({
      success: true,
      data: reviewMaterial,
    });
  } catch (error) {
    console.error('获取患者复盘材料失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取患者复盘材料失败',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id;
    await checkAndGenerateAlerts(patientId);

    return NextResponse.json({
      success: true,
      message: '已检查并生成预警任务',
    });
  } catch (error) {
    console.error('生成预警任务失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '生成预警任务失败',
      },
      { status: 500 }
    );
  }
}
