import { NextRequest, NextResponse } from "next/server";
import { getRouteTrend } from "@/services/dashboardService";
import { parseISO } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const routeIdsParam = searchParams.get("routeIds");
    const compareType = searchParams.get("compareType") as
      | "yoy"
      | "mom"
      | "none"
      | null;

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const routeIds = routeIdsParam ? routeIdsParam.split(",") : undefined;

    const data = await getRouteTrend({
      startDate: parseISO(startDateStr),
      endDate: parseISO(endDateStr),
      routeIds,
      compareType: compareType || "none",
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Trend API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
