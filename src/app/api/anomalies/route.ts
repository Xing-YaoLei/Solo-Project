import { NextResponse } from "next/server";
import { getAnomalies } from "@/lib/dataService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const list = await getAnomalies({
    siteId: searchParams.get("siteId") || undefined,
    anomalyType: searchParams.get("anomalyType") || undefined,
    status: searchParams.get("status") || undefined,
    severity: searchParams.get("severity") || undefined,
  });
  return NextResponse.json({ items: list, total: list.length });
}
