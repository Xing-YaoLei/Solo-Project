import type { WorkOrder, RouteInfo, CheckIn, TrajectoryPoint, TodoItem, UserRole, DailyMetric, ResponsibleMetric, LoadingItem } from '@/types';

export const mockWorkOrders: WorkOrder[] = [
  {
    id: 'WO-001', title: '厨房水龙头漏水', description: '厨房水龙头持续滴水，无法完全关闭', tenantId: 'U-001',
    tenantName: '张三', tenantPhone: '138****5678', roomId: 'R-101', roomAddress: 'A栋3单元501室',
    category: '水管', priority: 'urgent', status: 'in_progress', assignedTo: 'U-003',
    routeId: 'RT-001', createdAt: '2026-06-17T09:00:00', scheduledAt: '2026-06-18T10:00:00',
    completedAt: null, photos: [], cost: null, signatureUrl: null, receiptPhotos: [], delayReason: null,
  },
  {
    id: 'WO-002', title: '卧室空调不制冷', description: '空调开启后不制冷，出风口为常温', tenantId: 'U-002',
    tenantName: '李四', tenantPhone: '139****1234', roomId: 'R-205', roomAddress: 'B栋1单元1203室',
    category: '空调', priority: 'high', status: 'assigned', assignedTo: 'U-004',
    routeId: 'RT-001', createdAt: '2026-06-17T10:30:00', scheduledAt: '2026-06-18T11:30:00',
    completedAt: null, photos: [], cost: null, signatureUrl: null, receiptPhotos: [], delayReason: null,
  },
  {
    id: 'WO-003', title: '卫生间马桶堵塞', description: '马桶冲水不畅，下水缓慢', tenantId: 'U-005',
    tenantName: '王五', tenantPhone: '137****9876', roomId: 'R-308', roomAddress: 'C栋2单元807室',
    category: '水管', priority: 'normal', status: 'delayed', assignedTo: 'U-003',
    routeId: 'RT-002', createdAt: '2026-06-16T14:00:00', scheduledAt: '2026-06-17T09:00:00',
    completedAt: null, photos: [], cost: null, signatureUrl: null, receiptPhotos: [],
    delayReason: '上一工单维修时间超出预期，导致路线延误',
  },
  {
    id: 'WO-004', title: '客厅灯泡损坏', description: '客厅主灯不亮，需更换灯泡', tenantId: 'U-006',
    tenantName: '赵六', tenantPhone: '136****5432', roomId: 'R-412', roomAddress: 'A栋5单元302室',
    category: '电路', priority: 'normal', status: 'pending', assignedTo: '',
    routeId: '', createdAt: '2026-06-18T08:00:00', scheduledAt: '2026-06-18T14:00:00',
    completedAt: null, photos: [], cost: null, signatureUrl: null, receiptPhotos: [], delayReason: null,
  },
  {
    id: 'WO-005', title: '阳台窗户无法关闭', description: '阳台推拉窗滑轨变形，无法完全关闭', tenantId: 'U-007',
    tenantName: '钱七', tenantPhone: '135****6789', roomId: 'R-501', roomAddress: 'D栋3单元601室',
    category: '门窗', priority: 'high', status: 'completed', assignedTo: 'U-004',
    routeId: 'RT-003', createdAt: '2026-06-15T11:00:00', scheduledAt: '2026-06-16T10:00:00',
    completedAt: '2026-06-16T11:30:00', photos: [], cost: 280, signatureUrl: null,
    receiptPhotos: [], delayReason: null,
  },
  {
    id: 'WO-006', title: '热水器无法点火', description: '燃气热水器打火无反应', tenantId: 'U-008',
    tenantName: '孙八', tenantPhone: '134****3210', roomId: 'R-603', roomAddress: 'B栋4单元902室',
    category: '热水器', priority: 'urgent', status: 'assigned', assignedTo: 'U-003',
    routeId: 'RT-002', createdAt: '2026-06-18T07:30:00', scheduledAt: '2026-06-18T09:00:00',
    completedAt: null, photos: [], cost: null, signatureUrl: null, receiptPhotos: [], delayReason: null,
  },
  {
    id: 'WO-007', title: '门锁卡顿', description: '入户门锁插入钥匙后转动困难', tenantId: 'U-009',
    tenantName: '周九', tenantPhone: '133****8765', roomId: 'R-710', roomAddress: 'C栋1单元405室',
    category: '门窗', priority: 'low', status: 'rejected', assignedTo: 'U-004',
    routeId: 'RT-003', createdAt: '2026-06-14T16:00:00', scheduledAt: '2026-06-15T14:00:00',
    completedAt: null, photos: [], cost: null, signatureUrl: null, receiptPhotos: [],
    delayReason: '维修方案不符合要求，需重新评估',
  },
  {
    id: 'WO-008', title: '厨房排烟管道漏油', description: '排烟管道连接处漏油渍', tenantId: 'U-010',
    tenantName: '吴十', tenantPhone: '132****4567', roomId: 'R-815', roomAddress: 'A栋2单元1103室',
    category: '厨卫', priority: 'normal', status: 'completed', assignedTo: 'U-003',
    routeId: 'RT-001', createdAt: '2026-06-14T09:00:00', scheduledAt: '2026-06-15T10:00:00',
    completedAt: '2026-06-15T11:00:00', photos: [], cost: 150, signatureUrl: null,
    receiptPhotos: [], delayReason: null,
  },
];

const defaultLoadingList: LoadingItem[] = [
  { id: 'LI-001', name: '水管接头', quantity: 5, unit: '个', category: 'material', checked: true },
  { id: 'LI-002', name: '密封胶带', quantity: 3, unit: '卷', category: 'material', checked: true },
  { id: 'LI-003', name: '扳手套装', quantity: 1, unit: '套', category: 'tool', checked: true },
  { id: 'LI-004', name: '万用表', quantity: 1, unit: '个', category: 'tool', checked: false },
  { id: 'LI-005', name: '灯泡(LED)', quantity: 10, unit: '个', category: 'material', checked: true },
];

export const mockRoutes: RouteInfo[] = [
  {
    id: 'RT-001', name: '城东A区路线', driverId: 'U-003', driverName: '陈维修',
    status: 'in_progress', workOrders: ['WO-001', 'WO-002', 'WO-008'],
    waypoints: [
      { orderId: 'WO-001', lat: 31.2304, lng: 121.4737, address: 'A栋3单元501室', estimatedArrival: '2026-06-18T10:00:00', actualArrival: '2026-06-18T10:05:00', sequence: 1 },
      { orderId: 'WO-002', lat: 31.2350, lng: 121.4800, address: 'B栋1单元1203室', estimatedArrival: '2026-06-18T11:30:00', actualArrival: null, sequence: 2 },
      { orderId: 'WO-008', lat: 31.2280, lng: 121.4690, address: 'A栋2单元1103室', estimatedArrival: '2026-06-18T14:00:00', actualArrival: null, sequence: 3 },
    ],
    estimatedDuration: 240, actualDuration: null, loadingList: defaultLoadingList,
    startedAt: '2026-06-18T09:30:00', completedAt: null,
  },
  {
    id: 'RT-002', name: '城西B区路线', driverId: 'U-004', driverName: '王维修',
    status: 'delayed', workOrders: ['WO-003', 'WO-006'],
    waypoints: [
      { orderId: 'WO-003', lat: 31.2200, lng: 121.4500, address: 'C栋2单元807室', estimatedArrival: '2026-06-17T09:00:00', actualArrival: '2026-06-17T10:30:00', sequence: 1 },
      { orderId: 'WO-006', lat: 31.2250, lng: 121.4550, address: 'B栋4单元902室', estimatedArrival: '2026-06-18T09:00:00', actualArrival: null, sequence: 2 },
    ],
    estimatedDuration: 180, actualDuration: null, loadingList: [
      { id: 'LI-006', name: '疏通器', quantity: 1, unit: '台', category: 'tool', checked: true },
      { id: 'LI-007', name: '燃气配件', quantity: 3, unit: '套', category: 'material', checked: true },
    ],
    startedAt: '2026-06-17T08:30:00', completedAt: null,
  },
  {
    id: 'RT-003', name: '城南C区路线', driverId: 'U-004', driverName: '王维修',
    status: 'completed', workOrders: ['WO-005', 'WO-007'],
    waypoints: [
      { orderId: 'WO-005', lat: 31.2150, lng: 121.4650, address: 'D栋3单元601室', estimatedArrival: '2026-06-16T10:00:00', actualArrival: '2026-06-16T09:55:00', sequence: 1 },
      { orderId: 'WO-007', lat: 31.2100, lng: 121.4700, address: 'C栋1单元405室', estimatedArrival: '2026-06-16T14:00:00', actualArrival: '2026-06-16T14:10:00', sequence: 2 },
    ],
    estimatedDuration: 300, actualDuration: 280, loadingList: [
      { id: 'LI-008', name: '窗户滑轨', quantity: 2, unit: '根', category: 'material', checked: true },
      { id: 'LI-009', name: '锁芯', quantity: 3, unit: '个', category: 'material', checked: true },
    ],
    startedAt: '2026-06-16T09:00:00', completedAt: '2026-06-16T15:40:00',
  },
];

export const mockCheckIns: CheckIn[] = [
  { id: 'CI-001', driverId: 'U-003', driverName: '陈维修', orderId: 'WO-001', lat: 31.2304, lng: 121.4737, timestamp: '2026-06-18T10:05:00', type: 'arrival', photoUrl: null, online: true },
  { id: 'CI-002', driverId: 'U-004', driverName: '王维修', orderId: 'WO-003', lat: 31.2200, lng: 121.4500, timestamp: '2026-06-17T10:30:00', type: 'arrival', photoUrl: null, online: true },
  { id: 'CI-003', driverId: 'U-004', driverName: '王维修', orderId: 'WO-005', lat: 31.2150, lng: 121.4650, timestamp: '2026-06-16T09:55:00', type: 'arrival', photoUrl: null, online: true },
];

export const mockTrajectory: Record<string, TrajectoryPoint[]> = {
  'U-003': Array.from({ length: 24 }, (_, i) => ({
    lat: 31.2250 + (i * 0.0003) + (Math.random() - 0.5) * 0.001,
    lng: 121.4700 + (i * 0.0005) + (Math.random() - 0.5) * 0.001,
    timestamp: `2026-06-18T${String(9 + Math.floor(i / 6)).padStart(2, '0')}:${String((i * 10) % 60).padStart(2, '0')}:00`,
    speed: 15 + Math.random() * 30,
  })),
  'U-004': Array.from({ length: 20 }, (_, i) => ({
    lat: 31.2180 + (i * 0.0002) + (Math.random() - 0.5) * 0.001,
    lng: 121.4520 + (i * 0.0004) + (Math.random() - 0.5) * 0.001,
    timestamp: `2026-06-17T${String(8 + Math.floor(i / 6)).padStart(2, '0')}:${String((i * 15) % 60).padStart(2, '0')}:00`,
    speed: 20 + Math.random() * 25,
  })),
};

export const mockTodoItems: TodoItem[] = [
  {
    id: 'TD-001', orderId: 'WO-003', orderTitle: '卫生间马桶堵塞', type: 'delay',
    priority: 'high', reason: '上一工单维修时间超出预期，导致路线延误',
    createdAt: '2026-06-17T12:00:00', assignedTo: 'U-003', assignedName: '陈维修',
    attachments: [], status: 'pending',
  },
  {
    id: 'TD-002', orderId: 'WO-007', orderTitle: '门锁卡顿', type: 'rejection',
    priority: 'normal', reason: '维修方案不符合要求，需重新评估',
    createdAt: '2026-06-16T16:00:00', assignedTo: 'U-004', assignedName: '王维修',
    attachments: [], status: 'pending',
  },
  {
    id: 'TD-003', orderId: 'WO-003', orderTitle: '卫生间马桶堵塞', type: 'reassign',
    priority: 'urgent', reason: '原维修员已超负荷，需重新分派',
    createdAt: '2026-06-18T08:00:00', assignedTo: 'U-004', assignedName: '王维修',
    attachments: [], status: 'processing',
  },
];

export const mockUsers: UserRole[] = [
  {
    id: 'U-001', name: '张三', role: 'tenant',
    accessibleRoutes: ['/work-orders'],
    exportScope: ['own_orders'],
    sensitiveFields: [],
  },
  {
    id: 'U-002', name: '李管家', role: 'butler',
    accessibleRoutes: ['/', '/route-planner', '/work-orders', '/todo-pool', '/reports', '/trajectory'],
    exportScope: ['all_orders', 'routes', 'reports'],
    sensitiveFields: ['tenantPhone', 'cost'],
  },
  {
    id: 'U-003', name: '陈维修', role: 'maintenance',
    accessibleRoutes: ['/work-orders', '/trajectory'],
    exportScope: ['own_orders'],
    sensitiveFields: ['tenantPhone'],
  },
  {
    id: 'U-004', name: '王维修', role: 'maintenance',
    accessibleRoutes: ['/work-orders', '/trajectory'],
    exportScope: ['own_orders'],
    sensitiveFields: ['tenantPhone'],
  },
  {
    id: 'U-011', name: '刘财务', role: 'finance',
    accessibleRoutes: ['/work-orders', '/reports'],
    exportScope: ['all_orders', 'cost_reports'],
    sensitiveFields: [],
  },
];

export const mockDailyMetrics: DailyMetric[] = [
  { date: '2026-06-12', total: 12, onTime: 10, delayed: 2 },
  { date: '2026-06-13', total: 15, onTime: 12, delayed: 3 },
  { date: '2026-06-14', total: 10, onTime: 9, delayed: 1 },
  { date: '2026-06-15', total: 18, onTime: 16, delayed: 2 },
  { date: '2026-06-16', total: 14, onTime: 11, delayed: 3 },
  { date: '2026-06-17', total: 16, onTime: 13, delayed: 3 },
  { date: '2026-06-18', total: 8, onTime: 5, delayed: 3 },
];

export const mockResponsibleMetrics: ResponsibleMetric[] = [
  { id: 'U-003', name: '陈维修', total: 28, onTime: 24, onTimeRate: 85.7 },
  { id: 'U-004', name: '王维修', total: 22, onTime: 17, onTimeRate: 77.3 },
  { id: 'U-012', name: '林维修', total: 18, onTime: 16, onTimeRate: 88.9 },
  { id: 'U-013', name: '黄维修', total: 15, onTime: 14, onTimeRate: 93.3 },
];
