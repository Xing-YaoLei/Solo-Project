import { NextResponse } from "next/server";
import { getPaymentVersions } from "@/lib/unifiedData";

export async function GET() {
  try {
    const result = getPaymentVersions(15);

    return NextResponse.json({
      success: true,
      data: result,
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
