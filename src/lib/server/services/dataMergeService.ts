import db from '../db';
import { createBatch, updateBatchStatus } from '../repositories/batchRepository';
import { insertLead } from '../repositories/leadRepository';
import type { SourceType, LeadStatus } from '$lib/types';

function genId(prefix: string): string {
	return prefix + '_' + Math.random().toString(36).slice(2, 10);
}

function pickStatus(): LeadStatus {
	const statuses: LeadStatus[] = ['appointed', 'arrived', 'completed', 'no_show', 'closed'];
	const weights = [15, 18, 35, 15, 17];
	const total = weights.reduce((a, b) => a + b, 0);
	let random = Math.random() * total;
	for (let i = 0; i < statuses.length; i++) {
		random -= weights[i];
		if (random <= 0) return statuses[i];
	}
	return 'appointed';
}

function randomDate(daysBack = 45): string {
	const now = new Date();
	const days = Math.floor(Math.random() * daysBack);
	const hours = 9 + Math.floor(Math.random() * 10);
	const minutes = Math.floor(Math.random() * 4) * 15;
	const d = new Date(now.getTime() - days * 24 * 3600 * 1000);
	d.setHours(hours, minutes, 0, 0);
	return d.toISOString().replace('T', ' ').slice(0, 19);
}

const vehicleModels = [
	'宝马 3系 2022款',
	'奔驰 C260L 2023款',
	'奥迪 A4L 2022款',
	'丰田 凯美瑞 2023款',
	'本田 雅阁 2022款',
	'大众 帕萨特 2023款',
	'特斯拉 Model 3 2022款',
	'比亚迪 汉EV 2023款',
	'蔚来 ET5 2023款',
	'理想 L7 2023款',
	'宝马 X3 2022款',
	'奔驰 GLC 2023款'
];

const customers = [
	{ name: '张伟', phone: '138****1234' },
	{ name: '李娜', phone: '139****5678' },
	{ name: '王芳', phone: '136****9012' },
	{ name: '刘强', phone: '137****3456' },
	{ name: '陈静', phone: '135****7890' },
	{ name: '杨磊', phone: '133****2345' },
	{ name: '赵敏', phone: '186****6789' },
	{ name: '孙浩', phone: '187****0123' },
	{ name: '周丽', phone: '188****4567' },
	{ name: '吴强', phone: '189****8901' },
	{ name: '郑雪', phone: '150****2345' },
	{ name: '冯超', phone: '151****6789' },
	{ name: '韩梅', phone: '152****0123' },
	{ name: '朱军', phone: '153****4567' },
	{ name: '许丹', phone: '155****8901' },
	{ name: '何刚', phone: '156****2345' },
	{ name: '曹颖', phone: '157****6789' },
	{ name: '彭涛', phone: '158****0123' },
	{ name: '曾玲', phone: '159****4567' },
	{ name: '蒋明', phone: '170****8901' }
];

const salesIds = ['u_sales_zhang', 'u_sales_li', 'u_sales_wang', 'u_sales_chen'];
const noShowNotes = [
	'客户临时有事取消',
	'天气原因未能到店',
	'已在其他门店成交',
	'电话联系不上',
	'客户说再考虑考虑'
];

export function seedMockData() {
	const tx = db.transaction(() => {
		db.prepare('DELETE FROM test_drive_leads').run();
		db.prepare('DELETE FROM finance_approvals').run();
		db.prepare('DELETE FROM crm_leads').run();
		db.prepare('DELETE FROM inspection_reports').run();
		db.prepare('DELETE FROM import_batches').run();
		db.prepare('DELETE FROM users').run();

		db.prepare(
			`INSERT INTO users (id, name, role, store_id, password_hash) VALUES (?, ?, 'manager', ?, ?)`
		).run('u_manager', '李店长', 'store_001', 'h_manager123');

		const salesNames = ['张销售', '李销售', '王销售', '陈销售'];
		const insertSales = db.prepare(
			`INSERT INTO users (id, name, role, store_id, password_hash) VALUES (?, ?, 'sales', ?, ?)`
		);
		salesIds.forEach((id, i) => {
			insertSales.run(id, salesNames[i], 'store_001', 'h_' + id.slice(2));
		});

		const sourceTypes: SourceType[] = ['finance', 'crm', 'inspection'];
		sourceTypes.forEach((type) => {
			const batchId = genId('batch');
			createBatch(batchId, `${type}-202406批次`, type, 'u_manager', 80);
		});

		const batches = db.prepare('SELECT id, source_type FROM import_batches').all() as {
			id: string;
			source_type: SourceType;
		}[];
		const financeBatch = batches.find((b) => b.source_type === 'finance')!.id;
		const crmBatch = batches.find((b) => b.source_type === 'crm')!.id;
		const inspectionBatch = batches.find((b) => b.source_type === 'inspection')!.id;

		const insertFinance = db.prepare(
			`INSERT INTO finance_approvals (id, customer_name, phone, vehicle_model, approved_amount, approval_status, approval_date, import_batch_id)
			 VALUES (?, ?, ?, ?, ?, 'approved', ?, ?)`
		);
		const insertCrm = db.prepare(
			`INSERT INTO crm_leads (id, customer_name, phone, lead_source, salesperson_id, created_at, import_batch_id)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		);
		const insertInspection = db.prepare(
			`INSERT INTO inspection_reports (id, vin_code, vehicle_model, customer_phone, inspection_result, inspection_date, import_batch_id)
			 VALUES (?, ?, ?, ?, '合格', ?, ?)`
		);

		const leadSources = ['线上推广', '门店到店', '老客户推荐', '400电话', '抖音'];

		for (let i = 0; i < 200; i++) {
			const cust = customers[i % customers.length];
			const model = vehicleModels[Math.floor(Math.random() * vehicleModels.length)];
			const salesId = salesIds[Math.floor(Math.random() * salesIds.length)];
			const status = pickStatus();
			const apptTime = randomDate();

			const financeId = i % 3 !== 1 ? genId('fin') : null;
			const crmId = i % 3 !== 2 ? genId('crm') : null;
			const inspectionId = i % 4 !== 3 ? genId('ins') : null;

			if (financeId) {
				insertFinance.run(
					financeId,
					cust.name,
					cust.phone,
					model,
					(5 + Math.random() * 30).toFixed(2),
					apptTime.slice(0, 10),
					financeBatch
				);
			}
			if (crmId) {
				insertCrm.run(
					crmId,
					cust.name,
					cust.phone,
					leadSources[Math.floor(Math.random() * leadSources.length)],
					salesId,
					apptTime,
					crmBatch
				);
			}
			if (inspectionId) {
				insertInspection.run(
					inspectionId,
					'LFV' + Math.random().toString(36).slice(2, 19).toUpperCase(),
					model,
					cust.phone,
					apptTime.slice(0, 10),
					inspectionBatch
				);
			}

			const leadId = genId('lead');
			const note = status === 'no_show' ? noShowNotes[Math.floor(Math.random() * noShowNotes.length)] : null;
			const mergeBatchId = batches[Math.floor(Math.random() * batches.length)].id;

			insertLead(
				leadId,
				cust.name,
				cust.phone,
				model,
				salesId,
				apptTime,
				status,
				financeId,
				crmId,
				inspectionId,
				mergeBatchId
			);
			if (note) {
				db.prepare('UPDATE test_drive_leads SET no_show_note = ? WHERE id = ?').run(note, leadId);
			}
		}

		batches.forEach((b) => {
			const count = db
				.prepare('SELECT COUNT(*) as c FROM test_drive_leads WHERE import_batch_id = ?')
				.get(b.id) as { c: number };
			updateBatchStatus(b.id, 'merged', count.c);
		});
	});

	tx();
}
