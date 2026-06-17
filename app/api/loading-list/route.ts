import { NextResponse } from "next/server";
import { getLoadingList } from "@/lib/unifiedData";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get("routeId") ?? undefined;
    const orderId = searchParams.get("orderId") ?? undefined;

    const result = getLoadingList(routeId, orderId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "获取装载清单失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
