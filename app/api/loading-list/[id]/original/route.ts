import { NextResponse } from "next/server";
import { getOriginalRecord } from "@/lib/unifiedData";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = getOriginalRecord(id);

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          message: "原始记录不存在",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "获取原始记录失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
