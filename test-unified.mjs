import { getRoutePlans, getRouteDetails, getLoadingList, getOriginalRecord, getDataDifferences, getPaymentVersions } from "./lib/unifiedData";

const routes = getRoutePlans();
console.log("Total routes:", routes.list.length);
console.log("First route:", routes.list[0].id, routes.list[0].routeName);

const details = getRouteDetails(routes.list[0].id);
console.log("\nDetails samples:", details.samples.length);
console.log("Details meta:", details.meta);

const loading = getLoadingList(routes.list[0].id);
console.log("\nLoading items for route:", loading.list.length);
console.log("First item:", loading.list[0]?.materialName, loading.list[0]?.originalRecordId);

if (loading.list.length > 0) {
  const rec = getOriginalRecord(loading.list[0].originalRecordId);
  console.log("\nOriginal record:", rec?.materialName, rec?.quantity);
}

const diffs = getDataDifferences();
const payments = getPaymentVersions();
console.log("\nDifferences:", diffs.list.length, "affected orders:", diffs.stats.affectedOrders);
console.log("Payment versions:", payments.list.length, "affected orders:", payments.stats.affectedOrders);

const diffOrderIds = new Set(diffs.list.map(d => d.orderId));
const payOrderIds = new Set(payments.list.map(p => p.orderId));
const overlap = [...diffOrderIds].filter(id => payOrderIds.has(id));
console.log("Overlap orders (both diff and payment):", overlap.length);
