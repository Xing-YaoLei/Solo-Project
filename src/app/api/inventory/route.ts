import { NextResponse } from "next/server";
import { getSafetyStocks, getInventoryRecords, getStockCountDiffs, getStockDiffDrilldown, getRawSamples } from "@/lib/dataService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "safety";
  const siteId = searchParams.get("siteId") || undefined;
  const materialId = searchParams.get("materialId") || undefined;
  const diffId = searchParams.get("diffId") || undefined;

  switch (action) {
    case "safety":
      return NextResponse.json({ items: await getSafetyStocks(siteId) });
    case "inventory":
      return NextResponse.json({ items: await getInventoryRecords(siteId, materialId) });
    case "diffs":
      return NextResponse.json({ items: await getStockCountDiffs(siteId) });
    case "drilldown":
      if (!diffId) return NextResponse.json({ error: "diffId required" }, { status: 400 });
      return NextResponse.json(await getStockDiffDrilldown(diffId));
    case "samples":
      if (!diffId) return NextResponse.json({ error: "diffId required" }, { status: 400 });
      return NextResponse.json({ items: await getRawSamples(diffId) });
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
