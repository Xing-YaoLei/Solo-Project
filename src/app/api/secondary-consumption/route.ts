import { NextRequest, NextResponse } from "next/server";
import { getSecondaryConsumption } from "@/services/consumptionService";
import { parseISO } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const areaIdsParam = searchParams.get("areaIds");
    const compareType = (searchParams.get("compareType") as "date" | "area") || "date";

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const areaIds = areaIdsParam ? areaIdsParam.split(",") : undefined;

    const data = await getSecondaryConsumption({
      startDate: parseISO(startDateStr),
      endDate: parseISO(endDateStr),
      areaIds,
      compareType,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Consumption API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
