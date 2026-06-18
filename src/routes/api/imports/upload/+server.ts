import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAuth, requireRole } from '$lib/server/utils/apiHelper';
import db from '$lib/server/db';
import { createBatch, updateBatchStatus } from '$lib/server/repositories/batchRepository';
import { addLeadBatchRelation } from '$lib/server/repositories/leadRepository';
import type { SourceType } from '$lib/types';
import * as XLSX from 'xlsx';

function genId(prefix: string): string {
	return prefix + '_' + Math.random().toString(36).slice(2, 10);
}

export const POST: RequestHandler = async (event) => {
	const user = requireAuth(event);
	requireRole(event, ['manager']);

	try {
		const formData = await event.request.formData();
		const file = formData.get('file') as File;
		const sourceType = formData.get('sourceType') as SourceType;
		const batchName = formData.get('batchName') as string;

		if (!file || !sourceType || !batchName) {
			return json({ error: '缺少必要参数' }, { status: 400 });
		}

		const buffer = await file.arrayBuffer();
		const workbook = XLSX.read(buffer);
		const sheet = workbook.Sheets[workbook.SheetNames[0]];
		const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

		if (rows.length === 0) {
			return json({ error: '文件为空' }, { status: 400 });
		}

		const batchId = genId('batch');
		createBatch(batchId, batchName, sourceType, user.id, rows.length);

		let mergedCount = 0;

		const tx = db.transaction(() => {
			if (sourceType === 'finance') {
				const stmt = db.prepare(
					`INSERT INTO finance_approvals (id, customer_name, phone, vehicle_model, approved_amount, approval_status, approval_date, import_batch_id)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
				);
				const insertLead = db.prepare(
					`INSERT INTO test_drive_leads (id, customer_name, phone, vehicle_model, salesperson_id, appointment_time, status, finance_approval_id, import_batch_id)
					 VALUES (?, ?, ?, ?, ?, ?, 'appointed', ?, ?)`
				);

				for (const row of rows) {
					const name = String(row['客户姓名'] ?? row['customer_name'] ?? '');
					const phone = String(row['手机号'] ?? row['phone'] ?? '');
					const model = String(row['车型'] ?? row['vehicle_model'] ?? '');
					const amount = Number(row['审批金额'] ?? row['approved_amount'] ?? 0);
					const status = String(row['审批状态'] ?? row['approval_status'] ?? 'approved');
					const date = String(row['审批日期'] ?? row['approval_date'] ?? new Date().toISOString().slice(0, 10));

					if (name && phone) {
						const financeId = genId('fin');
						stmt.run(financeId, name, phone, model, amount, status, date, batchId);

						const existing = db
							.prepare('SELECT id FROM test_drive_leads WHERE phone = ?')
							.get(phone) as { id: string } | undefined;

						if (existing) {
							db.prepare(
								'UPDATE test_drive_leads SET finance_approval_id = ?, vehicle_model = COALESCE(NULLIF(?, \'\'), vehicle_model) WHERE id = ?'
							).run(financeId, model, existing.id);
							addLeadBatchRelation(existing.id, batchId, 'merged', 'finance');
							mergedCount++;
						} else {
							const salesIds = db
								.prepare("SELECT id FROM users WHERE role = 'sales' ORDER BY RANDOM() LIMIT 1")
								.get() as { id: string } | undefined;

							const newLeadId = genId('lead');
							insertLead.run(
								newLeadId,
								name,
								phone,
								model,
								salesIds?.id ?? null,
								new Date().toISOString().replace('T', ' ').slice(0, 19),
								financeId,
								batchId
							);
							addLeadBatchRelation(newLeadId, batchId, 'created', 'finance');
							mergedCount++;
						}
					}
				}
			} else if (sourceType === 'crm') {
				const stmt = db.prepare(
					`INSERT INTO crm_leads (id, customer_name, phone, lead_source, salesperson_id, created_at, import_batch_id)
					 VALUES (?, ?, ?, ?, ?, ?, ?)`
				);
				const insertLead = db.prepare(
					`INSERT INTO test_drive_leads (id, customer_name, phone, salesperson_id, appointment_time, status, crm_lead_id, import_batch_id)
					 VALUES (?, ?, ?, ?, ?, 'appointed', ?, ?)`
				);
				const updateLead = db.prepare(
					'UPDATE test_drive_leads SET crm_lead_id = ?, salesperson_id = COALESCE(?, salesperson_id) WHERE id = ?'
				);

				for (const row of rows) {
					const name = String(row['客户姓名'] ?? row['customer_name'] ?? '');
					const phone = String(row['手机号'] ?? row['phone'] ?? '');
					const source = String(row['来源'] ?? row['lead_source'] ?? '');
					const salesName = String(row['销售'] ?? row['salesperson'] ?? '');

					if (name && phone) {
						const crmId = genId('crm');
						const sales = db
							.prepare('SELECT id FROM users WHERE name = ? OR id = ?')
							.get(salesName, salesName) as { id: string } | undefined;

						stmt.run(
							crmId,
							name,
							phone,
							source,
							sales?.id ?? null,
							new Date().toISOString().replace('T', ' ').slice(0, 19),
							batchId
						);

						const existing = db
							.prepare('SELECT id FROM test_drive_leads WHERE phone = ?')
							.get(phone) as { id: string } | undefined;

						if (existing) {
							updateLead.run(crmId, sales?.id ?? null, existing.id);
							addLeadBatchRelation(existing.id, batchId, 'merged', 'crm');
							mergedCount++;
						} else {
							const salesIds = db
								.prepare("SELECT id FROM users WHERE role = 'sales' ORDER BY RANDOM() LIMIT 1")
								.get() as { id: string } | undefined;

							const newLeadId = genId('lead');
							insertLead.run(
								newLeadId,
								name,
								phone,
								sales?.id ?? salesIds?.id ?? null,
								new Date().toISOString().replace('T', ' ').slice(0, 19),
								crmId,
								batchId
							);
							addLeadBatchRelation(newLeadId, batchId, 'created', 'crm');
							mergedCount++;
						}
					}
				}
			} else if (sourceType === 'inspection') {
				const stmt = db.prepare(
					`INSERT INTO inspection_reports (id, vin_code, vehicle_model, customer_phone, inspection_result, inspection_date, import_batch_id)
					 VALUES (?, ?, ?, ?, ?, ?, ?)`
				);
				const updateLead = db.prepare(
					'UPDATE test_drive_leads SET inspection_report_id = ?, vehicle_model = COALESCE(NULLIF(?, \'\'), vehicle_model) WHERE id = ?'
				);

				for (const row of rows) {
					const vin = String(row['VIN码'] ?? row['vin_code'] ?? '');
					const model = String(row['车型'] ?? row['vehicle_model'] ?? '');
					const phone = String(row['客户电话'] ?? row['customer_phone'] ?? '');
					const result = String(row['检测结果'] ?? row['inspection_result'] ?? '合格');
					const date = String(row['检测日期'] ?? row['inspection_date'] ?? new Date().toISOString().slice(0, 10));

					if (phone) {
						const inspectionId = genId('ins');
						stmt.run(inspectionId, vin, model, phone, result, date, batchId);

						const existing = db
							.prepare('SELECT id FROM test_drive_leads WHERE phone = ?')
							.get(phone) as { id: string } | undefined;

						if (existing) {
							updateLead.run(inspectionId, model, existing.id);
							addLeadBatchRelation(existing.id, batchId, 'merged', 'inspection');
							mergedCount++;
						} else {
							const newLeadId = genId('lead');
							db.prepare(
								`INSERT INTO test_drive_leads (id, customer_name, phone, vehicle_model, appointment_time, status, inspection_report_id, import_batch_id)
								 VALUES (?, ?, ?, ?, ?, 'appointed', ?, ?)`
							).run(
								newLeadId,
								'检测客户',
								phone,
								model,
								new Date().toISOString().replace('T', ' ').slice(0, 19),
								inspectionId,
								batchId
							);
							addLeadBatchRelation(newLeadId, batchId, 'created', 'inspection');
							mergedCount++;
						}
					}
				}
			}

			updateBatchStatus(batchId, 'merged', mergedCount);
		});

		tx();

		return json({ success: true, batchId, recordCount: rows.length, mergedCount });
	} catch (e) {
		console.error('Upload error:', e);
		return json({ error: '上传处理失败：' + (e as Error).message }, { status: 500 });
	}
};
