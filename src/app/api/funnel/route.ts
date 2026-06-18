import { NextResponse } from "next/server";
import { getFunnelData } from "@/lib/dataService";
import { CALIBER_VERSION } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = await getFunnelData({
    siteId: searchParams.get("siteId") || undefined,
    materialCategory: searchParams.get("materialCategory") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
    caliberVersion: searchParams.get("caliberVersion") || CALIBER_VERSION,
  });
  return NextResponse.json(data);
}
