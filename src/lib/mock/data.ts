export type UserRole = 'ADVISOR' | 'TECHNICIAN' | 'PARTS' | 'MANAGER';
export type WoStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'INSPECTION' | 'COMPLETED' | 'CANCELLED';
export type WoItemStatus = 'TODO' | 'DOING' | 'DONE';
export type MovementType = 'IN' | 'OUT' | 'ADJUST';
export type QuoteStatus = 'DRAFT' | 'PENDING_CONFIRM' | 'CONFIRMED' | 'VOID';
export type ReminderStatus = 'PENDING' | 'CONTACTED' | 'ARRANGED' | 'CANCELLED';
export type ExceptionType = 'PARTS_SHORTAGE' | 'REWORK' | 'CUSTOMER_COMPLAINT' | 'OTHER';
export type ExceptionStatus = 'PENDING' | 'PROCESSING' | 'REVIEWING' | 'CLOSED';
export type AttachmentCategory = 'INSPECTION' | 'CONSTRUCTION' | 'EXCEPTION' | 'OTHER';

export interface MockUser {
	id: string;
	username: string;
	passwordHash: string;
	name: string;
	role: UserRole;
	createdAt: Date;
}

export interface MockCustomer {
	id: string;
	name: string;
	phone: string;
	remark: string | null;
}

export interface MockVehicle {
	id: string;
	customerId: string;
	plateNumber: string;
	vin: string | null;
	brand: string | null;
	model: string | null;
	mileage: number;
	lastMaintenanceDate: Date | null;
	customer: MockCustomer;
}

export interface MockWorkOrderItem {
	id: string;
	workOrderId: string;
	name: string;
	laborHours: number;
	laborPrice: number;
	partsPrice: number;
	status: WoItemStatus;
}

export interface MockWorkOrder {
	id: string;
	orderNo: string;
	customerId: string;
	vehicleId: string;
	advisorId: string;
	technicianId: string | undefined;
	status: WoStatus;
	totalAmount: number;
	remark: string | null;
	createdAt: Date;
	completedAt: Date | undefined;
	customer: MockCustomer;
	vehicle: MockVehicle;
	advisor: MockUser;
	technician: MockUser | undefined;
	items: MockWorkOrderItem[];
	movements: MockPartMovement[];
	attachments: MockAttachment[];
}

export interface MockPart {
	id: string;
	sku: string;
	name: string;
	category: string | null;
	stockQuantity: number;
	safetyStock: number;
	unitPrice: number;
	unit: string;
	movements: MockPartMovement[];
}

export interface MockPartMovement {
	id: string;
	partId: string;
	workOrderId: string | undefined;
	type: MovementType;
	quantity: number;
	source: string | null;
	remark: string | null;
	createdAt: Date;
	part: MockPart | undefined;
}

export interface MockQuote {
	id: string;
	workOrderId: string | undefined;
	quoteNo: string;
	totalAmount: number;
	discount: number;
	status: QuoteStatus;
	confirmedAt: Date | undefined;
	workOrder: MockWorkOrder | undefined;
}

export interface MockExceptionLog {
	id: string;
	exceptionId: string;
	operatorId: string;
	content: string;
	createdAt: Date;
	operator: MockUser;
}

export interface MockException {
	id: string;
	workOrderId: string | undefined;
	creatorId: string;
	assigneeId: string;
	type: ExceptionType;
	status: ExceptionStatus;
	title: string;
	materialSource: string | null;
	closeConclusion: string | null;
	createdAt: Date;
	workOrder: MockWorkOrder | undefined;
	creator: MockUser;
	assignee: MockUser;
	logs: MockExceptionLog[];
}

export interface MockReminder {
	id: string;
	vehicleId: string;
	remindDate: Date;
	status: ReminderStatus;
	content: string | null;
	vehicle: MockVehicle;
	customer: MockCustomer;
}

export interface MockAttachment {
	id: string;
	refType: string;
	refId: string;
	fileName: string;
	filePath: string;
	fileSize: number;
	mimeType: string;
	category: AttachmentCategory | null;
	createdAt: Date;
}

export const mockUsers: MockUser[] = [
	{
		id: 'user-00000000-0000-0000-0000-000000000001',
		username: 'admin',
		passwordHash: '',
		name: '张厂长',
		role: 'MANAGER',
		createdAt: new Date('2024-01-01T00:00:00Z')
	},
	{
		id: 'user-00000000-0000-0000-0000-000000000002',
		username: 'advisor1',
		passwordHash: '',
		name: '李顾问',
		role: 'ADVISOR',
		createdAt: new Date('2024-01-02T00:00:00Z')
	},
	{
		id: 'user-00000000-0000-0000-0000-000000000003',
		username: 'tech1',
		passwordHash: '',
		name: '王技师',
		role: 'TECHNICIAN',
		createdAt: new Date('2024-01-03T00:00:00Z')
	},
	{
		id: 'user-00000000-0000-0000-0000-000000000004',
		username: 'parts1',
		passwordHash: '',
		name: '赵库管',
		role: 'PARTS',
		createdAt: new Date('2024-01-04T00:00:00Z')
	}
];

export const mockCustomers: MockCustomer[] = [
	{ id: 'cust-001', name: '陈先生', phone: '13800138001', remark: 'VIP客户' },
	{ id: 'cust-002', name: '刘女士', phone: '13800138002', remark: null },
	{ id: 'cust-003', name: '周经理', phone: '13800138003', remark: '企业客户' },
	{ id: 'cust-004', name: '孙先生', phone: '13800138004', remark: null },
	{ id: 'cust-005', name: '吴女士', phone: '13800138005', remark: '老客户' }
];

export const mockVehicles: MockVehicle[] = [
	{ id: 'veh-001', customerId: 'cust-001', plateNumber: '京A·12345', vin: 'LSVNV2182E2123456', brand: '大众', model: '帕萨特', mileage: 58000, lastMaintenanceDate: new Date('2025-12-15'), customer: mockCustomers[0] },
	{ id: 'veh-002', customerId: 'cust-002', plateNumber: '京B·67890', vin: 'LFV3A23C8F3456789', brand: '丰田', model: '凯美瑞', mileage: 72000, lastMaintenanceDate: new Date('2026-01-10'), customer: mockCustomers[1] },
	{ id: 'veh-003', customerId: 'cust-003', plateNumber: '京C·11111', vin: 'LGBF5AE09G4567890', brand: '本田', model: '雅阁', mileage: 45000, lastMaintenanceDate: new Date('2025-11-20'), customer: mockCustomers[2] },
	{ id: 'veh-004', customerId: 'cust-004', plateNumber: '京D·22222', vin: 'LJDKA1111H5678901', brand: '奔驰', model: 'E300L', mileage: 32000, lastMaintenanceDate: new Date('2026-02-05'), customer: mockCustomers[3] },
	{ id: 'veh-005', customerId: 'cust-005', plateNumber: '京E·33333', vin: 'LFPH4AC32J6789012', brand: '宝马', model: '530Li', mileage: 89000, lastMaintenanceDate: new Date('2025-10-01'), customer: mockCustomers[4] },
	{ id: 'veh-006', customerId: 'cust-001', plateNumber: '京F·44444', vin: 'LSGPC54U9N7890123', brand: '奥迪', model: 'A6L', mileage: 120000, lastMaintenanceDate: new Date('2025-09-15'), customer: mockCustomers[0] }
];

const workOrderStatuses: WoStatus[] = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'INSPECTION', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'PENDING', 'CONFIRMED', 'COMPLETED', 'INSPECTION', 'IN_PROGRESS', 'PENDING', 'COMPLETED'];

function createWorkOrders(): MockWorkOrder[] {
	const arr: MockWorkOrder[] = [];
	for (let idx = 0; idx < 15; idx++) {
		const status = workOrderStatuses[idx];
		const customerIdx = idx % mockCustomers.length;
		const vehicleIdx = idx % mockVehicles.length;
		const advisorIdx = 1;
		const technicianIdx = idx % 2 === 0 ? 2 : undefined;
		const daysAgo = Math.floor(Math.random() * 30);
		const createdAt = new Date();
		createdAt.setDate(createdAt.getDate() - daysAgo);
		const completedAt = status === 'COMPLETED' ? new Date(createdAt.getTime() + 86400000 * (1 + Math.floor(Math.random() * 3))) : undefined;

		const items: MockWorkOrderItem[] = [
			{
				id: `item-${idx}-1`,
				workOrderId: `wo-${idx + 1}`,
				name: ['常规保养', '发动机检修', '刹车系统检查', '轮胎更换', '空调系统维修'][idx % 5],
				laborHours: Number(((2 + idx % 4) + 0.5).toFixed(1)),
				laborPrice: 200 + idx * 50,
				partsPrice: 300 + idx * 80,
				status: status === 'COMPLETED' ? 'DONE' : (status === 'IN_PROGRESS' ? (idx % 2 === 0 ? 'DOING' : 'TODO') : 'TODO')
			},
			{
				id: `item-${idx}-2`,
				workOrderId: `wo-${idx + 1}`,
				name: ['机油更换', '刹车片更换', '空气滤芯', '四轮定位', '电池检测'][idx % 5],
				laborHours: Number((1 + (idx % 3) * 0.5).toFixed(1)),
				laborPrice: 100 + idx * 30,
				partsPrice: 150 + idx * 40,
				status: status === 'COMPLETED' ? 'DONE' : 'TODO'
			}
		];

		const totalAmount = items.reduce((sum, it) => sum + it.laborPrice + it.partsPrice, 0);

		arr.push({
			id: `wo-${idx + 1}`,
			orderNo: `WO${String(20260001 + idx).padStart(10, '0')}`,
			customerId: mockCustomers[customerIdx].id,
			vehicleId: mockVehicles[vehicleIdx].id,
			advisorId: mockUsers[advisorIdx].id,
			technicianId: technicianIdx ? mockUsers[technicianIdx].id : undefined,
			status,
			totalAmount: Number(totalAmount.toFixed(2)),
			remark: idx % 3 === 0 ? '客户要求尽快完成' : null,
			createdAt,
			completedAt,
			customer: mockCustomers[customerIdx],
			vehicle: mockVehicles[vehicleIdx],
			advisor: mockUsers[advisorIdx],
			technician: technicianIdx ? mockUsers[technicianIdx] : undefined,
			items,
			movements: [],
			attachments: []
		});
	}
	return arr;
}

export const mockWorkOrders: MockWorkOrder[] = createWorkOrders();
export const mockWorkOrderItems: MockWorkOrderItem[] = mockWorkOrders.flatMap(wo => wo.items);

const partCategories = ['机油润滑', '制动系统', '滤清器', '轮胎轮毂', '电气系统', '冷却系统'];
const partNames = ['0W-40全合成机油', '刹车片前片', '空气滤芯', '空调滤芯', '机油滤芯',
	'火花塞', '刹车油', '变速箱油', '轮胎195/65R15', '蓄电池',
	'防冻液', '雨刮片', '发电机皮带', '正时皮带', '汽油滤芯',
	'减震器', '刹车片后片', 'LED大灯', '空调压缩机', '水泵'];
const partUnits = ['桶', '副', '个', '个', '个',
	'支', '瓶', '升', '条', '块',
	'桶', '对', '条', '条', '个',
	'根', '副', '对', '台', '个'];

export const mockParts: MockPart[] = partNames.map((name, i) => {
	const stock = Math.floor(Math.random() * 50) + 1;
	const safety = 5 + (i % 3) * 3;
	return {
		id: `part-${i + 1}`,
		sku: `SKU${String(1000 + i).padStart(6, '0')}`,
		name,
		category: partCategories[i % partCategories.length],
		stockQuantity: stock,
		safetyStock: safety,
		unitPrice: Number((50 + i * 75 + Math.floor(Math.random() * 200)).toFixed(2)),
		unit: partUnits[i],
		movements: []
	};
});

const movementTypes: MovementType[] = ['IN', 'OUT', 'IN', 'OUT', 'IN', 'OUT'];

export const mockPartMovements: MockPartMovement[] = Array.from({ length: 30 }, (_, i) => {
	const partIdx = i % mockParts.length;
	const woIdx = i % mockWorkOrders.length;
	const type = movementTypes[i % movementTypes.length];
	const createdAt = new Date();
	createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 20));
	return {
		id: `pm-${i + 1}`,
		partId: mockParts[partIdx].id,
		workOrderId: type === 'OUT' ? mockWorkOrders[woIdx].id : undefined,
		type,
		quantity: 1 + Math.floor(Math.random() * 5),
		source: type === 'IN' ? '供应商A' : (type === 'OUT' ? `工单${mockWorkOrders[woIdx].orderNo}` : '盘点调整'),
		remark: null,
		createdAt,
		part: mockParts[partIdx]
	};
});

mockParts.forEach(part => {
	part.movements = mockPartMovements.filter(m => m.partId === part.id);
});

mockWorkOrders.forEach(wo => {
	wo.movements = mockPartMovements.filter(m => m.workOrderId === wo.id);
});

const quoteStatuses: QuoteStatus[] = ['DRAFT', 'PENDING_CONFIRM', 'CONFIRMED', 'CONFIRMED', 'VOID'];

export const mockQuotes: MockQuote[] = Array.from({ length: 5 }, (_, i) => {
	const woIdx = i * 3;
	return {
		id: `quote-${i + 1}`,
		workOrderId: mockWorkOrders[woIdx]?.id,
		quoteNo: `QT${String(20260001 + i).padStart(10, '0')}`,
		totalAmount: 2000 + i * 1500,
		discount: i % 2 === 0 ? 0 : 50 + i * 10,
		status: quoteStatuses[i],
		confirmedAt: quoteStatuses[i] === 'CONFIRMED' ? new Date(Date.now() - i * 86400000) : undefined,
		workOrder: mockWorkOrders[woIdx]
	};
});

const exceptionTypes: ExceptionType[] = ['PARTS_SHORTAGE', 'REWORK', 'CUSTOMER_COMPLAINT', 'OTHER', 'REWORK'];
const exceptionStatuses: ExceptionStatus[] = ['PENDING', 'PROCESSING', 'REVIEWING', 'CLOSED', 'PROCESSING'];
const exceptionTitles = ['刹车异响问题返修', '配件延迟到货', '客户对保养项目投诉', '施工质量问题', '发动机二次返工'];
const exceptionMaterials = ['现场照片3张，工单记录', '采购订单截图，供应商沟通记录', '客户电话录音截图', '质检报告，现场照片', '技术员施工单，客户反馈记录'];

export const mockExceptions: MockException[] = Array.from({ length: 5 }, (_, i) => {
	const woIdx = i * 2;
	return {
		id: `exc-${i + 1}`,
		workOrderId: mockWorkOrders[woIdx]?.id,
		creatorId: mockUsers[i % 4].id,
		assigneeId: mockUsers[(i + 1) % 4].id,
		type: exceptionTypes[i],
		status: exceptionStatuses[i],
		title: exceptionTitles[i],
		materialSource: exceptionMaterials[i],
		closeConclusion: exceptionStatuses[i] === 'CLOSED' ? '问题已彻底解决，客户满意' : null,
		createdAt: new Date(Date.now() - i * 2 * 86400000),
		workOrder: mockWorkOrders[woIdx],
		creator: mockUsers[i % 4],
		assignee: mockUsers[(i + 1) % 4],
		logs: [
			{
				id: `el-${i}-1`,
				exceptionId: `exc-${i + 1}`,
				operatorId: mockUsers[i % 4].id,
				content: '创建异常单',
				createdAt: new Date(Date.now() - i * 2 * 86400000),
				operator: mockUsers[i % 4]
			},
			{
				id: `el-${i}-2`,
				exceptionId: `exc-${i + 1}`,
				operatorId: mockUsers[(i + 1) % 4].id,
				content: '开始处理，正在调查原因',
				createdAt: new Date(Date.now() - i * 2 * 86400000 + 3600000),
				operator: mockUsers[(i + 1) % 4]
			}
		]
	};
});

const reminderStatuses: ReminderStatus[] = ['PENDING', 'CONTACTED', 'ARRANGED', 'PENDING', 'CANCELLED', 'PENDING', 'CONTACTED', 'PENDING', 'ARRANGED', 'PENDING'];
const reminderContents = ['常规保养提醒', '刹车片更换提醒', '轮胎检查提醒', '空调系统保养', '变速箱油更换', '电池检测提醒', '防冻液更换', '火花塞更换', '正时皮带检查', '全车检测提醒'];

export const mockReminders: MockReminder[] = Array.from({ length: 10 }, (_, i) => {
	const vehicleIdx = i % mockVehicles.length;
	const remindDate = new Date();
	remindDate.setDate(remindDate.getDate() + (i - 3));
	return {
		id: `rem-${i + 1}`,
		vehicleId: mockVehicles[vehicleIdx].id,
		remindDate,
		status: reminderStatuses[i],
		content: reminderContents[i],
		vehicle: mockVehicles[vehicleIdx],
		customer: mockVehicles[vehicleIdx].customer
	};
});

const attachmentCategories: AttachmentCategory[] = ['INSPECTION', 'CONSTRUCTION', 'EXCEPTION', 'OTHER', 'INSPECTION'];
const mimeTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/jpeg', 'image/png'];
const attachmentFileNames = ['车辆外观检查.jpg', '发动机舱.png', '异常报告.pdf', '底盘检查.jpg', '零件照片.png',
	'完工照片.jpg', '施工过程.jpg', '配件清单.png', '客户签字.pdf', '检测报告.jpg'];

export const mockAttachments: MockAttachment[] = Array.from({ length: 10 }, (_, i) => {
	const refTypes = ['WORK_ORDER', 'WORK_ORDER', 'EXCEPTION', 'WORK_ORDER', 'EXCEPTION', 'WORK_ORDER', 'WORK_ORDER', 'WORK_ORDER', 'EXCEPTION', 'WORK_ORDER'];
	const refIds = [
		mockWorkOrders[0].id, mockWorkOrders[1].id, mockExceptions[0].id, mockWorkOrders[2].id, mockExceptions[1].id,
		mockWorkOrders[3].id, mockWorkOrders[4].id, mockWorkOrders[5].id, mockExceptions[2].id, mockWorkOrders[6].id
	];
	return {
		id: `att-${i + 1}`,
		refType: refTypes[i],
		refId: refIds[i],
		fileName: attachmentFileNames[i],
		filePath: `/uploads/att-${i + 1}`,
		fileSize: 102400 + i * 51200,
		mimeType: mimeTypes[i % mimeTypes.length],
		category: attachmentCategories[i % attachmentCategories.length],
		createdAt: new Date(Date.now() - i * 86400000)
	};
});

mockWorkOrders.forEach(wo => {
	wo.attachments = mockAttachments.filter(a => a.refType === 'WORK_ORDER' && a.refId === wo.id);
});

export interface DashboardStats {
	todayPending: number;
	awaitingPickup: number;
	openExceptions: number;
	monthReworkRate: number;
	todayPendingTrend: number[];
	awaitingPickupTrend: number[];
	openExceptionsTrend: number[];
	reworkRateTrend: number[];
}

export const mockDashboardStats: DashboardStats = {
	todayPending: 12,
	awaitingPickup: 8,
	openExceptions: 5,
	monthReworkRate: 3.2,
	todayPendingTrend: [8, 10, 7, 9, 12, 11, 12],
	awaitingPickupTrend: [5, 6, 8, 7, 9, 8, 8],
	openExceptionsTrend: [3, 4, 3, 5, 4, 5, 5],
	reworkRateTrend: [2.1, 2.8, 2.5, 3.0, 2.9, 3.1, 3.2]
};

export interface TodoItem {
	id: string;
	title: string;
	type: 'work_order' | 'exception' | 'quote' | 'reminder';
	priority: 'high' | 'medium' | 'low';
	dueAt: Date;
	relatedId?: string;
}

export const mockTodoList: TodoItem[] = [
	{ id: 'todo-1', title: 'WO20260001 待分配技师', type: 'work_order', priority: 'high', dueAt: new Date(Date.now() + 3600000), relatedId: mockWorkOrders[0].id },
	{ id: 'todo-2', title: '异常单 exc-001 待复核', type: 'exception', priority: 'high', dueAt: new Date(Date.now() + 7200000), relatedId: mockExceptions[0].id },
	{ id: 'todo-3', title: '京B·67890 保养提醒联系客户', type: 'reminder', priority: 'medium', dueAt: new Date(Date.now() + 86400000) },
	{ id: 'todo-4', title: 'WO20260002 客户确认报价', type: 'quote', priority: 'medium', dueAt: new Date(Date.now() + 86400000 * 2) },
	{ id: 'todo-5', title: 'WO20260003 配件待出库', type: 'work_order', priority: 'low', dueAt: new Date(Date.now() + 86400000 * 2) },
	{ id: 'todo-6', title: '月度报表整理', type: 'work_order', priority: 'low', dueAt: new Date(Date.now() + 86400000 * 5) }
];

export interface ReworkRateData {
	month: string;
	rate: number;
	totalOrders: number;
	reworkOrders: number;
}

export const mockReworkRateData: ReworkRateData[] = [
	{ month: '2026-01', rate: 2.5, totalOrders: 120, reworkOrders: 3 },
	{ month: '2026-02', rate: 3.1, totalOrders: 135, reworkOrders: 4 },
	{ month: '2026-03', rate: 2.8, totalOrders: 142, reworkOrders: 4 },
	{ month: '2026-04', rate: 3.5, totalOrders: 158, reworkOrders: 6 },
	{ month: '2026-05', rate: 2.9, totalOrders: 165, reworkOrders: 5 },
	{ month: '2026-06', rate: 3.2, totalOrders: 175, reworkOrders: 6 }
];

export interface BusinessData {
	date: string;
	revenue: number;
	orderCount: number;
}

export function createBusinessData(): BusinessData[] {
	const arr: BusinessData[] = [];
	for (let i = 0; i < 30; i++) {
		const d = new Date();
		d.setDate(d.getDate() - (29 - i));
		arr.push({
			date: `${d.getMonth() + 1}/${d.getDate()}`,
			revenue: 8000 + Math.floor(Math.random() * 15000),
			orderCount: 5 + Math.floor(Math.random() * 15)
		});
	}
	return arr;
}

export const mockBusinessData: BusinessData[] = createBusinessData();

export interface PartsRankingData {
	name: string;
	category: string;
	usageCount: number;
	usageAmount: number;
}

export const mockPartsRanking: PartsRankingData[] = [
	{ name: '0W-40全合成机油', category: '机油润滑', usageCount: 156, usageAmount: 78000 },
	{ name: '刹车片前片', category: '制动系统', usageCount: 98, usageAmount: 49000 },
	{ name: '空气滤芯', category: '滤清器', usageCount: 145, usageAmount: 21750 },
	{ name: '火花塞', category: '电气系统', usageCount: 87, usageAmount: 17400 },
	{ name: '空调滤芯', category: '滤清器', usageCount: 132, usageAmount: 19800 },
	{ name: '机油滤芯', category: '滤清器', usageCount: 156, usageAmount: 15600 },
	{ name: '刹车油', category: '制动系统', usageCount: 76, usageAmount: 15200 },
	{ name: '变速箱油', category: '机油润滑', usageCount: 45, usageAmount: 22500 },
	{ name: '轮胎195/65R15', category: '轮胎轮毂', usageCount: 38, usageAmount: 26600 },
	{ name: '蓄电池', category: '电气系统', usageCount: 52, usageAmount: 31200 }
];

export async function delay<T>(data: T, ms = 100): Promise<T> {
	return new Promise(resolve => setTimeout(() => resolve(data), ms));
}
