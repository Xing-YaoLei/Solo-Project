import { NextRequest, NextResponse } from "next/server";
import { getHeatmapData } from "@/services/dashboardService";
import { parseISO } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get("date");
    const compareType = searchParams.get("compareType") as "yoy" | "mom" | null;

    const date = dateStr ? parseISO(dateStr) : new Date();

    const data = await getHeatmapData(date, compareType || undefined);

    return NextResponse.json({ date: date.toISOString().split("T")[0], data });
  } catch (error) {
    console.error("Heatmap API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
