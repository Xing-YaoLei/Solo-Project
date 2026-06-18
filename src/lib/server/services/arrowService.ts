import {
	Table,
	tableFromArrays,
	tableToIPC,
	vectorFromArray,
	Utf8,
	Int32,
	Float64
} from 'apache-arrow';
import type { TestDriveLead, FunnelStage, TrendPoint, TimeSlotData, RankingItem, ImportBatch } from '$lib/types';

type AnyVec = unknown;

function toArr(v: AnyVec): unknown[] {
	const out: unknown[] = [];
	const vec = v as { length: number; get(i: number): unknown };
	for (let i = 0; i < vec.length; i++) out.push(vec.get(i));
	return out;
}

export function serializeLeadsToArrow(leads: TestDriveLead[]): Uint8Array {
	const columns = {
		id: vectorFromArray(leads.map((l) => l.id), new Utf8()) as AnyVec,
		customerName: vectorFromArray(leads.map((l) => l.customerName), new Utf8()) as AnyVec,
		phone: vectorFromArray(leads.map((l) => l.phone), new Utf8()) as AnyVec,
		vehicleModel: vectorFromArray(leads.map((l) => l.vehicleModel ?? ''), new Utf8()) as AnyVec,
		salespersonId: vectorFromArray(leads.map((l) => l.salespersonId ?? ''), new Utf8()) as AnyVec,
		salespersonName: vectorFromArray(leads.map((l) => l.salespersonName ?? ''), new Utf8()) as AnyVec,
		appointmentTime: vectorFromArray(leads.map((l) => l.appointmentTime ?? ''), new Utf8()) as AnyVec,
		status: vectorFromArray(leads.map((l) => l.status), new Utf8()) as AnyVec,
		noShowNote: vectorFromArray(leads.map((l) => l.noShowNote ?? ''), new Utf8()) as AnyVec,
		importBatchId: vectorFromArray(leads.map((l) => l.importBatchId ?? ''), new Utf8()) as AnyVec
	};

	const table = tableFromArrays(columns as never);
	return tableToIPC(table as never, 'file');
}

export function serializeFunnelToArrow(funnel: FunnelStage[]): Uint8Array {
	const table = tableFromArrays({
		stage: vectorFromArray(funnel.map((f) => f.stage), new Utf8()) as AnyVec,
		label: vectorFromArray(funnel.map((f) => f.label), new Utf8()) as AnyVec,
		count: vectorFromArray(funnel.map((f) => f.count), new Int32()) as AnyVec,
		conversionRate: vectorFromArray(funnel.map((f) => f.conversionRate ?? 0), new Float64()) as AnyVec
	} as never);
	return tableToIPC(table as never, 'file');
}

export function serializeTrendToArrow(trend: TrendPoint[]): Uint8Array {
	const table = tableFromArrays({
		date: vectorFromArray(trend.map((t) => t.date), new Utf8()) as AnyVec,
		leadsCount: vectorFromArray(trend.map((t) => t.leadsCount), new Int32()) as AnyVec,
		testDriveCount: vectorFromArray(trend.map((t) => t.testDriveCount), new Int32()) as AnyVec
	} as never);
	return tableToIPC(table as never, 'file');
}

export function serializeTimeSlotsToArrow(slots: TimeSlotData[]): Uint8Array {
	const table = tableFromArrays({
		hour: vectorFromArray(slots.map((s) => s.hour), new Int32()) as AnyVec,
		dayOfWeek: vectorFromArray(slots.map((s) => s.dayOfWeek), new Int32()) as AnyVec,
		count: vectorFromArray(slots.map((s) => s.count), new Int32()) as AnyVec
	} as never);
	return tableToIPC(table as never, 'file');
}

export function serializeRankingToArrow(ranking: RankingItem[]): Uint8Array {
	const table = tableFromArrays({
		rank: vectorFromArray(ranking.map((r) => r.rank), new Int32()) as AnyVec,
		name: vectorFromArray(ranking.map((r) => r.name), new Utf8()) as AnyVec,
		value: vectorFromArray(ranking.map((r) => r.value), new Int32()) as AnyVec,
		change: vectorFromArray(ranking.map((r) => r.change ?? 0), new Float64()) as AnyVec
	} as never);
	return tableToIPC(table as never, 'file');
}

export function serializeBatchesToArrow(batches: ImportBatch[]): Uint8Array {
	const table = tableFromArrays({
		id: vectorFromArray(batches.map((b) => b.id), new Utf8()) as AnyVec,
		name: vectorFromArray(batches.map((b) => b.name), new Utf8()) as AnyVec,
		sourceType: vectorFromArray(batches.map((b) => b.sourceType), new Utf8()) as AnyVec,
		status: vectorFromArray(batches.map((b) => b.status), new Utf8()) as AnyVec,
		recordCount: vectorFromArray(batches.map((b) => b.recordCount), new Int32()) as AnyVec,
		mergedCount: vectorFromArray(batches.map((b) => b.mergedCount), new Int32()) as AnyVec,
		createdAt: vectorFromArray(batches.map((b) => b.createdAt ?? ''), new Utf8()) as AnyVec,
		createdBy: vectorFromArray(batches.map((b) => b.createdBy ?? ''), new Utf8()) as AnyVec
	} as never);
	return tableToIPC(table as never, 'file');
}

export function deserializeArrowTable(buffer: ArrayBuffer): Record<string, unknown[]> {
	const arr = new Uint8Array(buffer);
	const tableCtor = Table as unknown as { from(data: Uint8Array): unknown };
	const table = tableCtor.from(arr) as { schema: { fields: { name: string }[] }; getChild(name: string): unknown };
	const result: Record<string, unknown[]> = {};

	for (const field of table.schema.fields) {
		const col = table.getChild(field.name);
		if (col) {
			result[field.name] = toArr(col as AnyVec);
		}
	}
	return result;
}
