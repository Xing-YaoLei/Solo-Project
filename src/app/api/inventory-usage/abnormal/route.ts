import { NextResponse } from 'next/server';
import { markInventoryAbnormal } from '@/services/metricsService';
import { z } from 'zod';

const schema = z.object({
  usageId: z.string(),
  isAbnormal: z.boolean(),
  note: z.string().optional(),
  notedBy: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usageId, isAbnormal, note, notedBy } = schema.parse(body);

    const data = await markInventoryAbnormal(usageId, isAbnormal, note, notedBy);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: '标记异常失败' },
      { status: 500 }
    );
  }
}
