import { NextRequest, NextResponse } from "next/server";
import { getPerformanceDetail } from "@/services/performanceService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const data = await getPerformanceDetail(id);

    if (!data) {
      return NextResponse.json(
        { error: "Performance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Performance detail API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
