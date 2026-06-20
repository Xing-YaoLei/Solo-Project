import { NextRequest, NextResponse } from "next/server";
import { getPerformanceList } from "@/services/performanceService";
import { parseISO } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const data = await getPerformanceList({
      startDate: startDateStr ? parseISO(startDateStr) : undefined,
      endDate: endDateStr ? parseISO(endDateStr) : undefined,
      status: status || undefined,
      page,
      pageSize,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Performances API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
