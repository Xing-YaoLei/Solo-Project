import { NextResponse } from "next/server";
import { getRoutePlans } from "@/lib/unifiedData";

export async function GET() {
  try {
    const result = getRoutePlans();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "获取路线列表失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
