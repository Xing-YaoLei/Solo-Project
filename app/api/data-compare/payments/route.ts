import { NextResponse } from "next/server";
import { generatePaymentVersions } from "@/lib/mockData";

export async function GET() {
  try {
    const versions = generatePaymentVersions(15);

    return NextResponse.json({
      success: true,
      data: {
        list: versions,
        stats: {
          totalChanges: versions.length,
          affectedOrders: new Set(versions.map((v) => v.orderId)).size,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "获取支付流水版本失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
