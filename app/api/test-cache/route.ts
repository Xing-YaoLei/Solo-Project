import { NextResponse } from "next/server";
import {
  getRoutePlans,
  getRouteDetails,
  getLoadingList,
  getOriginalRecord,
  getDataDifferences,
  getPaymentVersions,
  getData,
} from "@/lib/unifiedData";

export async function GET() {
  const plans = getRoutePlans();
  const firstId = plans.list[0].id;
  const details = getRouteDetails(firstId);
  const loading = getLoadingList(firstId);
  const raw = getData();

  const rawDiffIds = new Set(raw.differences.map((d) => d.orderId));
  const rawPayIds = new Set(raw.paymentVersions.map((p) => p.orderId));

  let firstOriginal: unknown = null;
  if (loading.list.length > 0) {
    firstOriginal = getOriginalRecord(loading.list[0].originalRecordId);
  }

  return NextResponse.json({
    stats: {
      totalOrders: raw.orders.length,
      totalRoutes: raw.routes.length,
      totalLoadingItems: raw.loadingItems.length,
      totalOriginalRecords: raw.originalRecords.size,
      totalDifferences: raw.differences.length,
      totalPaymentVersions: raw.paymentVersions.length,
      diffUniqueOrders: rawDiffIds.size,
      payUniqueOrders: rawPayIds.size,
      overlapOrders: [...rawDiffIds].filter((id) => rawPayIds.has(id)).length,
    },
    firstRoute: {
      id: firstId,
      name: details.meta.routeName,
      samples: details.samples.length,
      loadingItems: loading.list.length,
    },
    firstLoadingItem: loading.list[0] ?? null,
    firstOriginalRecord: firstOriginal,
  });
}
