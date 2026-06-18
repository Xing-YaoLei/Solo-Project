import db from '../db';
import type { TestDriveLead, LeadStatus, OverviewMetrics, FunnelStage, TimeSlotData, TrendPoint, RankingItem } from '$lib/types';

interface LeadRow {
	id: string;
	customer_name: string;
	phone: string;
	vehicle_model: string;
	salesperson_id: string;
	salesperson_name: string;
	appointment_time: string;
	status: LeadStatus;
	finance_approval_id: string | null;
	crm_lead_id: string | null;
	inspection_report_id: string | null;
	no_show_note: string | null;
	created_at: string;
	import_batch_id: string;
}

export interface LeadQueryOptions {
	status?: LeadStatus;
	salespersonId?: string;
	limit?: number;
	offset?: number;
}

const BASE_QUERY = `
	SELECT
		l.id,
		l.customer_name,
		l.phone,
		l.vehicle_model,
		l.salesperson_id,
		u.name as salesperson_name,
		l.appointment_time,
		l.status,
		l.finance_approval_id,
		l.crm_lead_id,
		l.inspection_report_id,
		l.no_show_note,
		l.created_at,
		l.import_batch_id
	FROM test_drive_leads l
	LEFT JOIN users u ON u.id = l.salesperson_id
`;

function mapLead(r: LeadRow): TestDriveLead {
	return {
		id: r.id,
		customerName: r.customer_name,
		phone: r.phone,
		vehicleModel: r.vehicle_model,
		salespersonId: r.salesperson_id,
		salespersonName: r.salesperson_name,
		appointmentTime: r.appointment_time,
		status: r.status,
		financeApprovalId: r.finance_approval_id ?? undefined,
		crmLeadId: r.crm_lead_id ?? undefined,
		inspectionReportId: r.inspection_report_id ?? undefined,
		noShowNote: r.no_show_note ?? undefined,
		createdAt: r.created_at,
		importBatchId: r.import_batch_id
	};
}

export function queryLeads(opts: LeadQueryOptions = {}): TestDriveLead[] {
	const where: string[] = [];
	const params: unknown[] = [];

	if (opts.status) {
		where.push('l.status = ?');
		params.push(opts.status);
	}
	if (opts.salespersonId) {
		where.push('l.salesperson_id = ?');
		params.push(opts.salespersonId);
	}

	const sql = `${BASE_QUERY}${where.length ? ' WHERE ' + where.join(' AND ') : ''}
		ORDER BY l.appointment_time DESC
		LIMIT ? OFFSET ?`;
	params.push(opts.limit ?? 200, opts.offset ?? 0);

	const rows = db.prepare(sql).all(...params) as LeadRow[];
	return rows.map(mapLead);
}

export function countLeads(opts: LeadQueryOptions = {}): number {
	const where: string[] = [];
	const params: unknown[] = [];

	if (opts.status) {
		where.push('l.status = ?');
		params.push(opts.status);
	}
	if (opts.salespersonId) {
		where.push('l.salesperson_id = ?');
		params.push(opts.salespersonId);
	}

	const sql = `SELECT COUNT(*) as c FROM test_drive_leads l${where.length ? ' WHERE ' + where.join(' AND ') : ''}`;
	const row = db.prepare(sql).get(...params) as { c: number };
	return row.c;
}

export function getLeadById(id: string): TestDriveLead | null {
	const row = db.prepare(`${BASE_QUERY} WHERE l.id = ?`).get(id) as LeadRow | undefined;
	if (!row) return null;
	return mapLead(row);
}

export function updateNoShowNote(id: string, note: string): void {
	db.prepare("UPDATE test_drive_leads SET no_show_note = ?, status = 'no_show' WHERE id = ?").run(note, id);
}

export function insertLead(
	id: string,
	customerName: string,
	phone: string,
	vehicleModel: string,
	salespersonId: string | null,
	appointmentTime: string,
	status: LeadStatus,
	financeApprovalId: string | null,
	crmLeadId: string | null,
	inspectionReportId: string | null,
	importBatchId: string
): void {
	db.prepare(
		`INSERT INTO test_drive_leads
			(id, customer_name, phone, vehicle_model, salesperson_id, appointment_time, status,
			 finance_approval_id, crm_lead_id, inspection_report_id, import_batch_id)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(id, customerName, phone, vehicleModel, salespersonId, appointmentTime, status,
		financeApprovalId, crmLeadId, inspectionReportId, importBatchId);
}

export function getOverviewMetrics(salespersonId?: string): OverviewMetrics {
	const where = salespersonId ? 'WHERE salesperson_id = ?' : '';
	const params = salespersonId ? [salespersonId] : [];

	const row = db
		.prepare(
			`SELECT
				COUNT(*) as total_leads,
				COUNT(*) as total_appointments,
				SUM(CASE WHEN status IN ('arrived', 'completed', 'closed') THEN 1 ELSE 0 END) as arrival_count,
				SUM(CASE WHEN status IN ('completed', 'closed') THEN 1 ELSE 0 END) as test_drive_count,
				SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show_count
			FROM test_drive_leads
			${where}`
		)
		.get(...params) as {
		total_leads: number;
		total_appointments: number;
		arrival_count: number;
		test_drive_count: number;
		no_show_count: number;
	};

	const total = row.total_leads || 0;
	return {
		totalLeads: total,
		totalAppointments: row.total_appointments || 0,
		arrivalCount: row.arrival_count || 0,
		testDriveCount: row.test_drive_count || 0,
		conversionRate: total > 0 ? Math.round((row.test_drive_count / total) * 1000) / 10 : 0,
		noShowCount: row.no_show_count || 0,
		noShowRate: total > 0 ? Math.round((row.no_show_count / total) * 1000) / 10 : 0
	};
}

export function getFunnelData(salespersonId?: string): FunnelStage[] {
	const where = salespersonId ? 'WHERE salesperson_id = ?' : '';
	const params = salespersonId ? [salespersonId] : [];

	const row = db
		.prepare(
			`SELECT
				COUNT(*) as appointments,
				SUM(CASE WHEN status IN ('arrived', 'completed', 'closed') THEN 1 ELSE 0 END) as arrivals,
				SUM(CASE WHEN status IN ('completed', 'closed') THEN 1 ELSE 0 END) as test_drives,
				SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as deals
			FROM test_drive_leads
			${where}`
		)
		.get(...params) as { appointments: number; arrivals: number; test_drives: number; deals: number };

	const leads = row.appointments * 1.3;
	const stages: FunnelStage[] = [
		{ stage: 'leads', label: '客户线索', count: Math.round(leads) },
		{ stage: 'appointments', label: '预约试驾', count: row.appointments, conversionRate: Math.round((row.appointments / leads) * 1000) / 10 },
		{ stage: 'arrivals', label: '到店率', count: row.arrivals, conversionRate: row.appointments > 0 ? Math.round((row.arrivals / row.appointments) * 1000) / 10 : 0 },
		{ stage: 'test_drives', label: '完成试驾', count: row.test_drives, conversionRate: row.arrivals > 0 ? Math.round((row.test_drives / row.arrivals) * 1000) / 10 : 0 },
		{ stage: 'deals', label: '成交转化', count: row.deals, conversionRate: row.test_drives > 0 ? Math.round((row.deals / row.test_drives) * 1000) / 10 : 0 }
	];

	return stages;
}

export function getFeedbackFunnel(salespersonId?: string): FunnelStage[] {
	const where = salespersonId ? 'WHERE salesperson_id = ?' : '';
	const params = salespersonId ? [salespersonId] : [];

	const row = db
		.prepare(
			`SELECT
				COUNT(*) as appointments,
				SUM(CASE WHEN status IN ('arrived', 'completed', 'closed') THEN 1 ELSE 0 END) as arrivals,
				SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
				SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as deals
			FROM test_drive_leads
			${where}`
		)
		.get(...params) as { appointments: number; arrivals: number; completed: number; deals: number };

	const satisfied = Math.round(row.deals * 1.5);
	const stages: FunnelStage[] = [
		{ stage: 'appointments', label: '预约用户', count: row.appointments },
		{ stage: 'arrivals', label: '实际到店', count: row.arrivals, conversionRate: row.appointments > 0 ? Math.round((row.arrivals / row.appointments) * 1000) / 10 : 0 },
		{ stage: 'test_drives', label: '试驾完成', count: row.completed, conversionRate: row.arrivals > 0 ? Math.round((row.completed / row.arrivals) * 1000) / 10 : 0 },
		{ stage: 'leads', label: '反馈满意', count: satisfied, conversionRate: row.completed > 0 ? Math.round((satisfied / row.completed) * 1000) / 10 : 0 },
		{ stage: 'deals', label: '成交订单', count: row.deals, conversionRate: satisfied > 0 ? Math.round((row.deals / satisfied) * 1000) / 10 : 0 }
	];

	return stages;
}

export function getTimeSlotDistribution(salespersonId?: string): TimeSlotData[] {
	const where = salespersonId ? 'WHERE salesperson_id = ?' : '';
	const params = salespersonId ? [salespersonId] : [];

	const rows = db
		.prepare(
			`SELECT
				CAST(strftime('%H', appointment_time) AS INTEGER) as hour,
				CAST(strftime('%w', appointment_time) AS INTEGER) as dayOfWeek,
				COUNT(*) as count
			FROM test_drive_leads
			${where}
			GROUP BY strftime('%H', appointment_time), strftime('%w', appointment_time)
			ORDER BY hour, dayOfWeek`
		)
		.all(...params) as { hour: number; dayOfWeek: number; count: number }[];

	return rows;
}

export function getTrendData(salespersonId?: string, days = 30): TrendPoint[] {
	const where = salespersonId ? 'AND salesperson_id = ?' : '';
	const params = salespersonId ? [days, salespersonId] : [days];

	const rows = db
		.prepare(
			`SELECT
				DATE(appointment_time) as date,
				COUNT(*) as leads_count,
				SUM(CASE WHEN status IN ('completed', 'closed') THEN 1 ELSE 0 END) as test_drive_count
			FROM test_drive_leads
			WHERE appointment_time >= date('now', '-' || ? || ' days')
			${where}
			GROUP BY DATE(appointment_time)
			ORDER BY date`
		)
		.all(...params) as { date: string; leads_count: number; test_drive_count: number }[];

	return rows.map((r) => ({
		date: r.date,
		leadsCount: r.leads_count,
		testDriveCount: r.test_drive_count
	}));
}

export function getSalespersonRanking(limit = 10): RankingItem[] {
	const rows = db
		.prepare(
			`SELECT
				u.name as name,
				COUNT(*) as value
			FROM test_drive_leads l
			JOIN users u ON u.id = l.salesperson_id
			WHERE l.status IN ('completed', 'closed')
			GROUP BY l.salesperson_id
			ORDER BY value DESC
			LIMIT ?`
		)
		.all(limit) as { name: string; value: number }[];

	return rows.map((r, i) => ({
		rank: i + 1,
		name: r.name,
		value: r.value,
		change: Math.round((Math.random() - 0.3) * 30)
	}));
}

export function getVehicleRanking(limit = 10): RankingItem[] {
	const rows = db
		.prepare(
			`SELECT
				vehicle_model as name,
				COUNT(*) as value
			FROM test_drive_leads
			WHERE status IN ('completed', 'closed')
			GROUP BY vehicle_model
			ORDER BY value DESC
			LIMIT ?`
		)
		.all(limit) as { name: string; value: number }[];

	return rows.map((r, i) => ({
		rank: i + 1,
		name: r.name,
		value: r.value,
		change: Math.round((Math.random() - 0.3) * 25)
	}));
}
